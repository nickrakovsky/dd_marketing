import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const context = { source: '/posts/warehouse-audit-overview', landingPage: 'https://datadocks.com/posts/warehouse-audit-checklist' };

beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear();
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('audit pack request acknowledgement', () => {
  it.each([
    [200, '{"ok":false}'],
    [503, '{"ok":true}'],
    [200, 'not json'],
  ])('rejects an unacknowledged request (%s, %s)', async (status, body) => {
    const { captureAuditPackRequest } = await import('./audit-pack-capture');
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(body, { status }));
    await expect(captureAuditPackRequest('operator@example.com', context, request)).rejects.toThrow();
  });

  it('uses the dedicated resource event and sends no request for invalid email', async () => {
    const { captureAuditPackRequest } = await import('./audit-pack-capture');
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"ok":true}'));
    await expect(captureAuditPackRequest('not-an-email', context, request)).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
    await captureAuditPackRequest(' operator@example.com ', context, request);
    expect(request).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(request.mock.calls[0][1]?.body))).toEqual({
      email: 'operator@example.com', event: '$subscribeWarehouseAudit', ...context,
    });
  });
});

// These minimal DOM fixtures exercise submission state only, not presentation.
function addPlacements(preview = false) {
  document.body.innerHTML = [1, 2, 3].map(() => `<div data-audit-pack-capture ${preview ? 'data-audit-pack-preview="true"' : ''}>
    <form><input name="email" type="email" required value="operator@example.com"><button type="submit">Subscribe</button><p data-audit-pack-error></p></form>
    <div data-audit-pack-downloads hidden><p data-audit-pack-ready tabindex="-1">Ready</p><a href="/files/warehouse-audit-working-pack.xlsx" download>Excel</a><a href="/files/warehouse-audit-floor-pack.pdf" download>PDF</a></div>
  </div>`).join('');
  return [...document.querySelectorAll<HTMLFormElement>('form')];
}

function submit(form: HTMLFormElement) {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('shared pack access', () => {
  it('previews downloads without a request or visitor helpers, and keeps live access separate after navigation', async () => {
    vi.stubEnv('DEV', true);
    const { initAuditPackForms } = await import('./audit-pack-capture');
    const visitor = vi.fn(() => 'visitor-id');
    const attribution = vi.fn(() => ({ first: {}, last: {} }));
    vi.stubGlobal('getBentoVisitorUuid', visitor);
    vi.stubGlobal('ddGetAttribution', attribution);
    let acknowledge!: (response: Response) => void;
    const request = vi.fn<typeof fetch>(() => new Promise(resolve => { acknowledge = resolve; }));
    vi.stubGlobal('fetch', request);
    const previewForms = addPlacements(true);
    initAuditPackForms();
    submit(previewForms[0]);
    await vi.waitFor(() => expect(previewForms.every(form => form.hidden)).toBe(true));
    expect([...document.querySelectorAll<HTMLElement>('[data-audit-pack-downloads]')].every(links => !links.hidden)).toBe(true);
    expect(request).not.toHaveBeenCalled();
    expect(visitor).not.toHaveBeenCalled();
    expect(attribution).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(1);
    expect(sessionStorage.getItem('dd_warehouse_audit_pack_preview_access')).toBe('granted');
    expect(sessionStorage.getItem('dd_warehouse_audit_pack_access')).toBeNull();

    const liveForms = addPlacements();
    initAuditPackForms();
    expect(liveForms.every(form => !form.hidden)).toBe(true);
    expect([...document.querySelectorAll<HTMLElement>('[data-audit-pack-downloads]')].every(links => links.hidden)).toBe(true);
    submit(liveForms[0]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(liveForms.every(form => !form.hidden)).toBe(true);
    acknowledge(new Response('{"ok":true}'));
    await vi.waitFor(() => expect(liveForms.every(form => form.hidden)).toBe(true));
    expect(sessionStorage.getItem('dd_warehouse_audit_pack_access')).toBe('granted');
  });

  it('ignores a preview attribute outside development and still waits for capture acknowledgement', async () => {
    vi.stubEnv('DEV', false);
    const { initAuditPackForms } = await import('./audit-pack-capture');
    let acknowledge!: (response: Response) => void;
    const request = vi.fn<typeof fetch>(() => new Promise(resolve => { acknowledge = resolve; }));
    vi.stubGlobal('fetch', request);
    const forms = addPlacements(true);
    initAuditPackForms();
    submit(forms[0]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(forms.every(form => !form.hidden)).toBe(true);
    expect(sessionStorage.length).toBe(0);
    acknowledge(new Response('{"ok":true}'));
    await vi.waitFor(() => expect(forms.every(form => form.hidden)).toBe(true));
    expect(sessionStorage.getItem('dd_warehouse_audit_pack_access')).toBe('granted');
    expect(sessionStorage.getItem('dd_warehouse_audit_pack_preview_access')).toBeNull();
  });

  it('guards repeated binding and all placements until acknowledgement, then stores access without email', async () => {
    const { initAuditPackForms } = await import('./audit-pack-capture');
    let acknowledge!: (response: Response) => void;
    const request = vi.fn<typeof fetch>(() => new Promise(resolve => { acknowledge = resolve; }));
    vi.stubGlobal('fetch', request);
    const forms = addPlacements();
    initAuditPackForms();
    initAuditPackForms();
    submit(forms[0]);
    submit(forms[0]);
    submit(forms[1]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(forms.every(form => !form.hidden)).toBe(true);
    expect([...document.querySelectorAll<HTMLInputElement>('input')].every(input => input.disabled)).toBe(true);
    expect(sessionStorage.length).toBe(0);
    acknowledge(new Response('{"ok":true}'));
    await vi.waitFor(() => expect(forms.every(form => form.hidden)).toBe(true));
    expect(document.activeElement).toBe(document.querySelector('[data-audit-pack-ready]'));
    expect([...document.querySelectorAll<HTMLElement>('[data-audit-pack-downloads]')].every(links => !links.hidden)).toBe(true);
    expect(sessionStorage.length).toBe(1);
    expect(sessionStorage.getItem('dd_warehouse_audit_pack_access')).toBe('granted');
    expect(JSON.stringify(sessionStorage)).not.toContain('operator@example.com');

    // A fresh module/page uses the session flag without requesting the address again.
    vi.resetModules();
    const { initAuditPackForms: initReloaded } = await import('./audit-pack-capture');
    const reloadedForms = addPlacements();
    initReloaded();
    expect(reloadedForms.every(form => form.hidden)).toBe(true);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('keeps downloads gated and input intact after failure, and permits a deliberate retry', async () => {
    const { initAuditPackForms } = await import('./audit-pack-capture');
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('{"ok":false}'))
      .mockResolvedValueOnce(new Response('{"ok":true}'));
    vi.stubGlobal('fetch', request);
    const forms = addPlacements();
    initAuditPackForms();
    submit(forms[0]);
    await vi.waitFor(() => expect(forms[0].querySelector('[data-audit-pack-error]')?.textContent).toContain('Please try again'));
    expect(forms[0].querySelector<HTMLInputElement>('input')?.value).toBe('operator@example.com');
    expect(forms[0].querySelector<HTMLInputElement>('input')?.disabled).toBe(false);
    expect([...document.querySelectorAll<HTMLElement>('[data-audit-pack-downloads]')].every(links => links.hidden)).toBe(true);
    expect(sessionStorage.length).toBe(0);
    submit(forms[0]);
    await vi.waitFor(() => expect(forms.every(form => form.hidden)).toBe(true));
    expect(request).toHaveBeenCalledTimes(2);
  });
});

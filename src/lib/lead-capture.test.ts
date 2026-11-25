import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureContext, installLeadCapture, submitLeadForm } from './lead-capture';
import { buildBentoEvent } from './bento-track-payload';

type Marketing = Window & { ddCurrentEmail?: string; ddGetAttribution?: () => unknown; ddSetEmail?: (email: string) => void; getBentoVisitorUuid?: () => unknown; ddOpenCalendly?: (params: string) => void };
const marketing = window as Marketing;
const fetchMock = vi.fn<typeof fetch>();

function makeForm(attributes = '', metadata?: Record<string, unknown>) {
  const container = document.createElement('section');
  container.innerHTML = `<form data-lead-capture data-cta-id="homepage-hero" data-cta-placement="hero" ${attributes}><input name="email" type="email" required value="operator@example.com"><button type="submit">Book a demo</button></form>`;
  document.body.append(container);
  const form = container.querySelector('form')!;
  if (metadata) form.dataset.leadMetadata = JSON.stringify(metadata);
  return form;
}
const sent = (index = 0) => JSON.parse(String(fetchMock.mock.calls[index][1]?.body));

beforeEach(() => {
  document.body.innerHTML = '';
  history.replaceState(null, '', '/');
  localStorage.clear(); sessionStorage.clear();
  fetchMock.mockReset().mockImplementation(async () => new Response('{"ok":true}'));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(window, 'open').mockReturnValue(null);
  for (const key of ['ddCurrentEmail', 'ddGetAttribution', 'ddSetEmail', 'getBentoVisitorUuid', 'ddOpenCalendly', 'bento']) delete marketing[key as keyof Marketing];
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('storage-independent submission context', () => {
  it('saves a submission without cookies, storage or the Bento SDK and marks history unknown', async () => {
    history.replaceState(null, '', '/benefits/see-everything?utm_source=bing&msclkid=click-1');
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(document, 'cookie', 'get').mockImplementation(() => { throw new Error('denied'); });
    marketing.getBentoVisitorUuid = () => document.cookie;
    await submitLeadForm(makeForm());
    const payload = sent();
    expect(payload).toMatchObject({ email: 'operator@example.com', source: '/benefits/see-everything', ctaId: 'homepage-hero', ctaPlacement: 'hero', pageCategory: 'benefit', currentTouch: { utm_source: 'bing', msclkid: 'click-1' }, firstTouch: {}, lastTouch: {} });
    expect(payload).not.toHaveProperty('landingPage');
    expect(payload).not.toHaveProperty('visitorUuid');
    const event = buildBentoEvent(payload);
    expect(event.details).toMatchObject({ current_channel: 'paid_traffic', attribution_availability: { first_touch: 'unknown', last_touch: 'unknown', session_landing: 'unknown' } });
    expect(event.fields).toMatchObject({ source: '/benefits/see-everything', dd_demo_request_channel: 'paid_traffic' });
    expect(event.fields).not.toHaveProperty('first_landing');
    expect(marketing.ddCurrentEmail).toBe('operator@example.com');
  });

  it('does not let corrupt or throwing optional helpers block the explicit submission', async () => {
    localStorage.setItem('dd_first_touch', '{broken');
    localStorage.setItem('dd_last_touch', JSON.stringify({ utm_source: {}, landing: 'invalid-path' }));
    sessionStorage.setItem('dd_landing_page', 'not-a-url');
    marketing.ddGetAttribution = () => { throw new Error('unavailable'); };
    marketing.getBentoVisitorUuid = () => ({ invalid: true });
    marketing.ddSetEmail = () => { throw new Error('denied'); };
    marketing.bento = { identify: () => { throw new Error('SDK failed'); } };
    await submitLeadForm(makeForm());
    expect(sent().firstTouch).toEqual({});
    expect(sent().lastTouch).toEqual({});
    expect(document.body.textContent).toContain('Choose a time');
    expect(window.open).toHaveBeenCalledTimes(1);
  });

  it('snapshots page, campaign, CTA and supplied answers before awaiting delivery', async () => {
    history.replaceState(null, '', '/posts/best-yard-management-options?utm_source=partner');
    sessionStorage.setItem('dd_landing_page', 'https://datadocks.com/');
    localStorage.setItem('dd_first_touch', JSON.stringify({ landing: '/', utm_source: 'google' }));
    let complete!: (response: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
    const form = makeForm('data-lead-event="DataDocks Demo Request"', { selectedSystem: 'DataDocks', subCategory: 'Retail', integrationEcosystem: 'NetSuite' });
    const pending = submitLeadForm(form);
    history.replaceState(null, '', '/');
    form.dataset.leadMetadata = '{}';
    expect(window.open).toHaveBeenCalledTimes(1);
    complete(new Response('{"ok":true}')); await pending;
    expect(sent()).toMatchObject({ event: 'DataDocks Demo Request', source: '/posts/best-yard-management-options', firstTouch: { landing: '/' }, metadata: { selectedSystem: 'DataDocks', subCategory: 'Retail', integrationEcosystem: 'NetSuite' } });
    expect(buildBentoEvent(sent()).details).toMatchObject({ metadata: { selectedSystem: 'DataDocks', subCategory: 'Retail', integrationEcosystem: 'NetSuite' } });
    expect(sent().eventId).toBeTruthy(); expect(sent().attemptId).toBeTruthy();
  });

  it('gives different CTAs distinct labels and IDs without writing new browser storage', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    await submitLeadForm(makeForm());
    const bottom = makeForm(); bottom.dataset.ctaId = 'page-bottom'; bottom.dataset.ctaPlacement = 'bottom';
    await submitLeadForm(bottom);
    expect(sent(0).ctaId).toBe('homepage-hero'); expect(sent(1).ctaId).toBe('page-bottom');
    expect(sent(0).attemptId).not.toBe(sent(1).attemptId);
    expect(write).not.toHaveBeenCalled();
  });

  it('does not fabricate UTMs or first-touch history from an untagged current page', () => {
    const context = captureContext('hero', 'hero');
    expect(context.attribution).toEqual({ first: {}, last: {} });
    expect(context.currentTouch).not.toHaveProperty('utm_source');
    expect(context.currentTouch).toMatchObject({ landing: '/' });
  });
});

describe('one handler and acknowledged outcomes', () => {
  it('does not add a Bento waiting gate when qualification rollout is off', async () => {
    installLeadCapture(); installLeadCapture();
    fetchMock.mockImplementationOnce(() => new Promise(() => {}));
    const form = makeForm();
    form.insertAdjacentHTML('beforeend', '<p class="capture-status" data-capture-status role="status" aria-live="polite"></p>');
    const status = form.querySelector<HTMLElement>('[data-capture-status]')!;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalled();
    expect(form.querySelector('button')).not.toBeDisabled();
    expect(status).toHaveTextContent('Choose a time');
    expect(status).not.toHaveTextContent('saved');
    expect(form.querySelector('input')).toHaveAttribute('aria-describedby', status.id);
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
  });
  it('leaves shared demo forms exclusively to qualification when the rollout is active', () => {
    document.body.dataset.demoQualification = 'true';
    try {
      installLeadCapture();
      const form = makeForm();
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      expect(fetchMock).not.toHaveBeenCalled();
      expect(window.open).not.toHaveBeenCalled();
      expect(document.querySelector('[role="status"]')).toBeNull();
    } finally {
      delete document.body.dataset.demoQualification;
    }
  });
  it.each([200, 503])('keeps booking available after HTTP %s without replaying capture', async status => {
    fetchMock.mockResolvedValueOnce(new Response('{"ok":false}', { status }));
    const form = makeForm(); await submitLeadForm(form);
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).not.toContain('Email saved');
    await submitLeadForm(form); expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
  });

  it('uses an existing external CTA status without duplicating feedback', async () => {
    const form = makeForm('data-capture-status-id="bottom-status"');
    form.insertAdjacentHTML('afterend', '<p id="bottom-status" class="capture-status capture-status-banner" role="status"></p>');
    await submitLeadForm(form);
    expect(document.getElementById('bottom-status')).toHaveTextContent('Choose a time');
    expect(form.querySelector('input')).toHaveAttribute('aria-describedby', 'bottom-status');
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
  });

  it('keeps a visible direct booking link after a dialog closes and the opener throws', async () => {
    const form = makeForm();
    const dialog = document.createElement('dialog'); document.body.append(dialog); dialog.append(form);
    dialog.open = true;
    const close = vi.fn(() => { dialog.open = false; });
    dialog.close = close;
    marketing.ddOpenCalendly = () => { throw new Error('blocked'); };
    await submitLeadForm(form);
    expect(close).toHaveBeenCalled();
    const link = [...document.querySelectorAll('a')].find(a => !a.closest('dialog'));
    expect(link).toBeVisible();
    expect(link?.href).not.toContain('email=');
    expect(link?.href).not.toContain('operator');
    expect(link?.parentElement?.textContent).toContain('Choose a time');
    expect(document.body.textContent).not.toContain('couldn’t confirm');
  });

  it('keeps email in memory for prefill and preserves parameters without adding email to URLs', async () => {
    marketing.ddOpenCalendly = vi.fn();
    await submitLeadForm(makeForm('data-booking-params="hide_gdpr_banner=1"'));
    const params = new URLSearchParams(vi.mocked(marketing.ddOpenCalendly).mock.calls[0][0]);
    expect(marketing.ddCurrentEmail).toBe('operator@example.com');
    expect(params.get('email')).toBeNull(); expect(params.get('hide_gdpr_banner')).toBe('1');
  });

  it('does not call Bento when native email validation fails', async () => {
    const form = makeForm(); form.querySelector('input')!.value = 'invalid';
    await submitLeadForm(form);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['$subscribeLCCP', '$subscribescorecards'])('preserves %s resource intent with one API event writer', async eventName => {
    const form = makeForm(`data-capture-kind="resource" data-lead-event="${eventName}" data-redirect="/files/guide.pdf"`);
    form.parentElement!.classList.add('lead-magnet-container');
    form.insertAdjacentHTML('afterend', '<div class="success-message hidden">Download ready</div>');
    marketing.bento = { identify: vi.fn(), track: vi.fn() };
    fetchMock.mockResolvedValueOnce(new Response('{"ok":false}'));
    await submitLeadForm(form);
    expect(marketing.bento.track).not.toHaveBeenCalled();
    expect(form).not.toHaveClass('hidden');
    await submitLeadForm(form);
    expect(sent().event).toBe(eventName);
    expect(marketing.bento.track).not.toHaveBeenCalled();
    expect(form).toHaveClass('hidden');
    expect(form.parentElement!.querySelector('.success-message')).not.toHaveClass('hidden');
    expect(window.open).toHaveBeenCalledWith('/files/guide.pdf', '_blank', 'noopener');
  });
});

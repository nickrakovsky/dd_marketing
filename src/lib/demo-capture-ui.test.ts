import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { waitFor } from '@testing-library/dom';
import { createDemoCaptureFlow } from './demo-qualification';
import type { DemoLeadService } from './demo-qualification';
import { mountDemoCapture } from './demo-capture-ui';

const formMarkup = (id: string) => `<form data-demo-form>
  <label data-demo-label for="${id}">Email address</label>
  <input id="${id}" name="email" type="email" required aria-describedby="${id}-status">
  <button type="submit"><span data-demo-button-label>Book a demo</span><span data-icon>↗</span></button>
  <p id="${id}-status" data-demo-status role="status"></p>
</form>`;
let cleanup = () => {};
afterEach(() => { cleanup(); document.body.innerHTML = ''; vi.restoreAllMocks(); });

function setup() {
  document.body.innerHTML = `<div data-demo-root>
    <button data-demo-open>Schedule a demo</button>${formMarkup('inline')}
    <dialog data-demo-dialog><button data-demo-close>Close</button>${formMarkup('popover')}</dialog>
    <a data-demo-facility>Facility booking</a></div>`;
  const root = document.querySelector<HTMLElement>('[data-demo-root]')!;
  const dialog = root.querySelector('dialog')!;
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; };
  const capture = vi.fn<DemoLeadService['capture']>().mockResolvedValue({ leadToken: 'receipt' });
  const useWorkEmail = vi.fn<DemoLeadService['useWorkEmail']>().mockImplementation(async ({ email }) => ({ status: 'ready', email }));
  const flow = createDemoCaptureFlow({ capture, useWorkEmail }, { source: '/', landingPage: 'https://datadocks.com' });
  const onReady = vi.fn();
  cleanup = mountDemoCapture(root, flow, onReady);
  const input = (id: string) => document.getElementById(id) as HTMLInputElement;
  const submit = (id: string, email: string) => {
    input(id).value = email;
    input(id).form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  };
  const status = (id: string) => document.getElementById(`${id}-status`)!;
  const open = () => root.querySelector<HTMLButtonElement>('[data-demo-open]')!.click();
  return { root, dialog, flow, capture, useWorkEmail, onReady, input, submit, status, open };
}

describe('shared capture presentations', () => {
  it.each(['inline', 'popover'])('%s qualifies before the CRM responds and preserves markup', async id => {
    const app = setup(); app.capture.mockImplementation(() => new Promise(() => {}));
    if (id === 'popover') app.open();
    app.submit(id, 'buyer@gmail.com');
    await waitFor(() => expect(app.flow.getState().step).toBe('work-email'));
    expect(app.input(id).value).toBe(''); expect(app.input(id)).toHaveFocus(); expect(app.onReady).not.toHaveBeenCalled();
    app.submit(id, 'buyer@yahoo.com'); await Promise.resolve(); expect(app.onReady).not.toHaveBeenCalled();
    app.submit(id, 'buyer@company.com');
    await waitFor(() => expect(app.onReady).toHaveBeenCalledTimes(1));
    expect(app.onReady.mock.calls[0][0]).toBe('buyer@company.com'); expect(app.dialog.open).toBe(false);
    expect(app.root.querySelector('[data-icon]')).toHaveTextContent('↗');
    expect(app.root.querySelector('a[data-demo-facility]')).toHaveAttribute('href', 'https://booking.datadocks.com/sessions/new?email=buyer%40company.com');
  });
  it('shares the personal-email step when moving from inline to dialog', async () => {
    const app = setup(); app.submit('inline', 'buyer@gmail.com'); await Promise.resolve(); app.open();
    expect(app.input('popover').placeholder).toBe('Enter your work email');
    app.submit('popover', 'buyer@company.com'); await waitFor(() => expect(app.onReady).toHaveBeenCalledTimes(1));
    await app.flow.settled(); expect(app.capture).toHaveBeenCalledTimes(1); expect(app.useWorkEmail).toHaveBeenCalledTimes(1);
  });
  it('ignores duplicate same-tick submissions', async () => {
    const app = setup(); app.capture.mockImplementation(() => new Promise(() => {}));
    app.submit('inline', 'buyer@company.com'); app.submit('popover', 'buyer@company.com');
    await waitFor(() => expect(app.onReady).toHaveBeenCalledTimes(1)); expect(app.capture).toHaveBeenCalledTimes(1);
  });
  it('does not launch after immediate dismissal or a late save response', async () => {
    const app = setup(); let complete!: (value: { leadToken: string }) => void;
    app.capture.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    app.open(); app.submit('popover', 'buyer@company.com'); app.dialog.querySelector<HTMLButtonElement>('[data-demo-close]')!.click();
    await Promise.resolve(); complete({ leadToken: 'receipt' }); await app.flow.settled();
    expect(app.onReady).not.toHaveBeenCalled();
  });
  it('handles dynamically mounted micro-app demo forms but leaves resources alone', async () => {
    const app = setup(); app.root.insertAdjacentHTML('beforeend', `<form data-lead-capture data-cta-id="micro"><input name="email" type="email" value="buyer@company.com"><button type="submit">Demo</button></form><form data-lead-capture data-capture-kind="resource"><input name="email" value="buyer@gmail.com"></form>`);
    const resource = app.root.querySelector<HTMLFormElement>('[data-capture-kind]')!;
    const event = new Event('submit', { bubbles: true, cancelable: true }); resource.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    app.root.querySelector<HTMLFormElement>('[data-cta-id="micro"]')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await waitFor(() => expect(app.onReady).toHaveBeenCalledTimes(1));
  });
  it('rewrites direct Calendly links for modified clicks and permits qualified fallbacks', () => {
    cleanup();
    document.body.innerHTML = `<div id="root"><a href="https://calendly.com/nick-rakovsky/datadocks-demo" target="_blank">Book</a><a data-qualified-booking href="https://calendly.com/nick-rakovsky/datadocks-demo">Qualified</a></div>`;
    const root = document.getElementById('root')!;
    const flow = createDemoCaptureFlow({ capture: vi.fn(), useWorkEmail: vi.fn() }, { source: '/' });
    cleanup = mountDemoCapture(root, flow, vi.fn());
    expect(root.querySelector('a')!.getAttribute('href')).toBe('#book-demo'); expect(root.querySelector('a')).not.toHaveAttribute('target');
    expect(root.querySelector('[data-qualified-booking]')!.getAttribute('href')).toContain('calendly.com');
  });
});

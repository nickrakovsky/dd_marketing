import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createDemoCaptureFlow } from './demo-qualification';
import { createDemoCalendar } from './demo-calendar';
import { mountDemoCapture } from './demo-capture-ui';
import { captureContext } from './lead-context';

type Browser = Window & { Calendly?: { initPopupWidget: ReturnType<typeof vi.fn> }; ddHandleDemoCalendarMessage?: (event: MessageEvent) => void };
const browser = window as Browser;
beforeEach(() => {
  document.body.innerHTML = '';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"ok":true}')));
  browser.Calendly = { initPopupWidget: vi.fn() };
});
afterEach(() => { delete browser.Calendly; delete browser.ddHandleDemoCalendarMessage; vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it('uses the submitted qualifying email and starts Calendly while capture is still unresolved', async () => {
  const capture = vi.fn(() => new Promise<never>(() => {}));
  const flow = createDemoCaptureFlow({ capture, useWorkEmail: vi.fn() }, { source: '/' });
  await flow.submit('buyer@company.com');
  const calendar = createDemoCalendar();
  await calendar(flow.getState().email, flow, document.createElement('form'));
  expect(browser.Calendly!.initPopupWidget).toHaveBeenCalledWith(expect.objectContaining({ prefill: { email: 'buyer@company.com' } }));
  expect(fetch).not.toHaveBeenCalled();
});
it('retains an email-free qualified fallback if the widget fails and prevents direct personal-email launch', async () => {
  const flow = createDemoCaptureFlow({ capture: vi.fn(), useWorkEmail: vi.fn() }, { source: '/' });
  const calendar = createDemoCalendar();
  await calendar('buyer@gmail.com', flow, document.createElement('form'));
  expect(browser.Calendly!.initPopupWidget).not.toHaveBeenCalled(); expect(document.querySelector('a')).toBeNull();
  browser.Calendly!.initPopupWidget.mockImplementation(() => { throw new Error('blocked'); });
  await calendar('buyer@company.com', flow, document.createElement('form'));
  const link = document.querySelector<HTMLAnchorElement>('[data-qualified-booking]')!;
  expect(link.href).not.toContain('email'); expect(link.href).not.toContain('buyer');
});
it('only accepts active Calendly iframe messages and does not create a competing CRM identity while rename is pending', async () => {
  const flow = createDemoCaptureFlow({ capture: vi.fn().mockResolvedValue({ leadToken: 'receipt', status: 'pending' }), useWorkEmail: vi.fn() }, { source: '/', attemptId: 'attempt-key' });
  await flow.submit('buyer@company.com'); await flow.settled();
  await createDemoCalendar()('buyer@company.com', flow, document.createElement('form'));
  document.body.insertAdjacentHTML('beforeend', '<div class="calendly-popup"><iframe src="https://calendly.com/nick-rakovsky/datadocks-demo"></iframe></div>');
  browser.ddHandleDemoCalendarMessage!(new MessageEvent('message', { origin: 'https://calendly.com', source: document.querySelector('iframe')!.contentWindow, data: { event: 'calendly.date_and_time_selected' } }));
  await Promise.resolve(); expect(fetch).not.toHaveBeenCalled();
});
it('deduplicates browser funnel stages within an attempt and ignores unrelated message sources', async () => {
  const flow = createDemoCaptureFlow({ capture: vi.fn().mockResolvedValue({ leadToken: 'receipt', status: 'ready' }), useWorkEmail: vi.fn() }, { source: '/carrier', attemptId: 'attempt-key' });
  await flow.submit('buyer@company.com'); await flow.settled();
  await createDemoCalendar()('buyer@company.com', flow, document.createElement('form'));
  document.body.insertAdjacentHTML('beforeend', '<div class="calendly-popup"><iframe src="https://calendly.com/nick-rakovsky/datadocks-demo"></iframe></div>');
  const message = { origin: 'https://calendly.com', source: document.querySelector('iframe')!.contentWindow, data: { event: 'calendly.date_and_time_selected' } };
  browser.ddHandleDemoCalendarMessage!(new MessageEvent('message', { ...message, source: window }));
  browser.ddHandleDemoCalendarMessage!(new MessageEvent('message', { ...message, origin: 'https://calendly.com.evil.test' }));
  expect(fetch).not.toHaveBeenCalled();
  browser.ddHandleDemoCalendarMessage!(new MessageEvent('message', message));
  browser.ddHandleDemoCalendarMessage!(new MessageEvent('message', message));
  await Promise.resolve(); expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toMatchObject({ email: 'buyer@company.com', event: 'demo_date_selected', attemptId: 'attempt-key' });
});
it('captures CTA context at first submit and never clears a typed address when installing a lazy flow', async () => {
  document.body.innerHTML = '<form data-demo-capture data-cta-id="homepage-hero"><input name="email" type="email" value="buyer@company.com"><button type="submit">Demo</button></form>';
  const capture = vi.fn().mockResolvedValue({ leadToken: 'receipt' });
  const ready = vi.fn();
  const clean = mountDemoCapture(document.body, form => createDemoCaptureFlow({ capture, useWorkEmail: vi.fn() }, captureContext(form.dataset.ctaId!, 'hero')), ready);
  document.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(ready).toHaveBeenCalledTimes(1));
  expect(capture.mock.calls[0][0]).toMatchObject({ email: 'buyer@company.com', context: { ctaId: 'homepage-hero' } }); clean();
});

it('the verified rollout sends completion only to its booking service and never to the public Bento writer', async () => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  const bookings = { prepare: vi.fn().mockResolvedValue({ token: 'booking-receipt' }), complete: vi.fn().mockResolvedValue(null), cancel: vi.fn(), status: vi.fn() };
  const flow = createDemoCaptureFlow({ capture: vi.fn().mockResolvedValue({ leadToken: 'lead-receipt', status: 'ready' }), useWorkEmail: vi.fn() }, { source: '/' });
  await flow.submit('buyer@company.com'); await flow.settled();
  await createDemoCalendar(bookings)('buyer@company.com', flow, document.createElement('form'));
  document.body.insertAdjacentHTML('beforeend', '<div class="calendly-popup"><iframe src="https://calendly.com/nick-rakovsky/datadocks-demo"></iframe></div>');
  const message = new MessageEvent('message', { origin: 'https://calendly.com', source: document.querySelector('iframe')!.contentWindow,
    data: { event: 'calendly.event_scheduled', payload: { event: { uri: 'event' }, invitee: { uri: 'invitee' } } } });
  browser.ddHandleDemoCalendarMessage!(message); browser.ddHandleDemoCalendarMessage!(message);
  await vi.waitFor(() => expect(bookings.complete).toHaveBeenCalledExactlyOnceWith('booking-receipt', 'event', 'invitee'));
  expect(fetch).not.toHaveBeenCalled(); expect(document.body.textContent).toContain('You booked a DataDocks software demo');
});

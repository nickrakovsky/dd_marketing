import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { showDemoBookingResult } from './demo-booking-result';
import type { BookingSnapshot } from './demo-booking-service';
const snapshot: BookingSnapshot = { token: 'receipt', phase: 'verified', supportAvailable: false };
const service = { prepare: vi.fn(), complete: vi.fn(), cancel: vi.fn(), status: vi.fn() };
beforeEach(() => {
  document.body.innerHTML = '';
  HTMLDialogElement.prototype.showModal = vi.fn(); HTMLDialogElement.prototype.close = vi.fn();
});
afterEach(() => vi.resetAllMocks());
const click = (text: string) => [...document.querySelectorAll('button')].find(item => item.textContent === text)!.click();
it('requires a second explicit confirmation; keeping a demo performs no cancellation', async () => {
  showDemoBookingResult(Promise.resolve(snapshot), service); await Promise.resolve();
  expect(document.body.textContent).toContain('You booked a DataDocks software demo');
  expect(document.body.textContent).not.toContain('I’m an existing customer');
  click('I meant to book a facility appointment'); expect(service.cancel).not.toHaveBeenCalled();
  click('Keep my demo'); expect(service.cancel).not.toHaveBeenCalled();
});
it('shows verified cancellation, email-prefilled destination and a rebooking path', async () => {
  service.cancel.mockResolvedValue({ ...snapshot, phase: 'cancelled', destination: 'https://booking.datadocks.com/sessions/new?email=buyer%40company.com' });
  showDemoBookingResult(Promise.resolve(snapshot), service); await Promise.resolve();
  click('I meant to book a facility appointment'); click('Cancel demo and go to facility sign-in');
  await vi.waitFor(() => expect(document.body.textContent).toContain('Your software demo is cancelled'));
  expect(service.cancel).toHaveBeenCalledExactlyOnceWith('receipt', 'facility');
  expect(document.querySelector('a')?.href).toContain('email=buyer%40company.com');
  expect(document.body.textContent).toContain('Book a new software demo');
  click('Stay here');
});
it('does not claim cancellation or redirect after an uncertain response', async () => {
  service.cancel.mockRejectedValue(new Error('lost response'));
  showDemoBookingResult(Promise.resolve(snapshot), service); await Promise.resolve();
  click('I meant to book a facility appointment'); click('Cancel demo and go to facility sign-in');
  await vi.waitFor(() => expect(document.body.textContent).toContain('We haven’t confirmed'));
  expect(document.querySelector('a')).toBeNull();
  service.status.mockResolvedValue({ ...snapshot, phase: 'cancel_sent' });
  click('Check cancellation status'); await vi.waitFor(() => expect(service.status).toHaveBeenCalledOnce());
  expect(service.cancel).toHaveBeenCalledOnce();
});
it('offers manual invitation management when the API is unavailable', async () => {
  showDemoBookingResult(Promise.resolve(null), service); await Promise.resolve();
  expect(document.body.textContent).toContain('Calendly confirmation email');
  expect(document.body.textContent).not.toContain('I meant to book');
});
it('redirects only after confirmed cancellation and lets the visitor stop it', async () => {
  vi.useFakeTimers();
  const navigate = vi.fn();
  service.cancel.mockResolvedValue({ ...snapshot, phase: 'cancelled', destination: 'https://booking.datadocks.com/sessions/new?email=buyer%40company.com' });
  const dialog = showDemoBookingResult(Promise.resolve(snapshot), service, navigate); dialog.open = true;
  await Promise.resolve(); click('I meant to book a facility appointment'); click('Cancel demo and go to facility sign-in');
  await Promise.resolve(); await Promise.resolve();
  expect(navigate).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(5000); expect(navigate).toHaveBeenCalledOnce();
  vi.useRealTimers();
});
it('does not redirect if the visitor closes the result while cancellation is in flight', async () => {
  vi.useFakeTimers();
  let resolve!: (value: BookingSnapshot) => void;
  service.cancel.mockReturnValue(new Promise<BookingSnapshot>(done => { resolve = done; }));
  const navigate = vi.fn(), dialog = showDemoBookingResult(Promise.resolve(snapshot), service, navigate); dialog.open = true;
  await Promise.resolve(); click('I meant to book a facility appointment'); click('Cancel demo and go to facility sign-in');
  dialog.remove();
  resolve({ ...snapshot, phase: 'cancelled', destination: 'https://booking.datadocks.com/sessions/new' });
  await Promise.resolve(); await vi.advanceTimersByTimeAsync(6000);
  expect(navigate).not.toHaveBeenCalled(); expect(document.querySelector('[data-demo-result]')).toBeNull();
  vi.useRealTimers();
});

import type { DemoLeadContext } from './demo-qualification';
export interface BookingSnapshot {
  token: string; phase: 'prepared' | 'verifying' | 'verified' | 'cancel_sent' | 'cancelled' | 'review';
  supportAvailable: boolean; startAt?: number; outcome?: string; destination?: string;
}
export interface BookingService {
  prepare(attemptKey: string, email: string, context: DemoLeadContext): Promise<BookingSnapshot>;
  complete(token: string, eventUri: string, inviteeUri: string): Promise<BookingSnapshot>;
  cancel(token: string, reason: 'facility' | 'support'): Promise<BookingSnapshot>;
  status(token: string): Promise<BookingSnapshot>;
}
export function createBookingService(request: typeof fetch = fetch) {
  let session: Promise<void> | undefined;
  async function post(body: Record<string, unknown>) {
    const response = await request('/api/demo-booking', { method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Booking service unavailable');
    return response.json();
  }
  const startSession = () => session ||= post({ action: 'session' }).then(() => undefined).catch(error => { session = undefined; throw error; });
  async function booking(body: Record<string, unknown>): Promise<BookingSnapshot> {
    const value = (await post(body)).booking;
    if (!value || typeof value.token !== 'string' || !['prepared','verifying','verified','cancel_sent','cancelled','review'].includes(value.phase)) throw new Error('Invalid booking state');
    return value;
  }
  const service: BookingService = {
    async prepare(attemptKey, email, context) { await startSession(); return booking({ action: 'prepare', attemptKey, email, context }); },
    complete: (token, eventUri, inviteeUri) => booking({ action: 'complete', token, eventUri, inviteeUri }),
    cancel: (token, reason) => booking({ action: 'cancel', token, reason, confirm: true }),
    status: token => booking({ action: 'status', token }),
  };
  return { service, startSession };
}

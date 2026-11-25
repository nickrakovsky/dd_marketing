// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { testDatabase, context } from './demo-test-fixtures';
import { BookingStore, BookingProcessor, correctionText } from './demo-booking';
import { CalendarRejected } from './demo-calendly';
import type { BookingEvidence } from './demo-calendly';
import { DemoAuth } from './demo-auth';
import { createBookingApi } from './demo-booking-api';
import { reportBooking, bookingEvent } from './demo-booking-report';

let db: ReturnType<typeof testDatabase>, store: BookingStore, processor: BookingProcessor, evidence: BookingEvidence;
let now: number;
const eventUri = 'https://api.calendly.com/scheduled_events/event-12345678';
const inviteeUri = `${eventUri}/invitees/invitee-12345678`;
const policy = { eventType: 'https://api.calendly.com/event_types/type-12345678', hosts: ['https://api.calendly.com/users/host-12345678'] };
const inspect = vi.fn(), cancel = vi.fn();
const id = 'a'.repeat(64);
beforeEach(async () => {
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Real network prohibited'); }));
  now = 1_000_000; db = testDatabase(); store = new BookingStore(db.db);
  evidence = { email: 'buyer@company.com', nonce: 'ddbs.attempt-12345678', createdAt: now + 1000, startAt: now + 3600000,
    eventStatus: 'active', inviteeStatus: 'active', eventType: policy.eventType, hosts: policy.hosts,
    activeInvitees: 1, inviteeLimit: 1, rescheduled: false };
  inspect.mockImplementation(async () => structuredClone(evidence));
  cancel.mockImplementation(async (_uri, reason) => { evidence.eventStatus = 'canceled'; evidence.inviteeStatus = 'canceled'; evidence.activeInvitees = 0; evidence.cancellationReason = reason; });
  processor = new BookingProcessor(store, { inspect, cancel }, policy, () => now);
  await store.create({ id, sessionHash: 'session', attemptKey: 'attempt-12345678', email: 'buyer@company.com', context,
    createdAt: now, updatedAt: now, nextAttemptAt: 0, phase: 'prepared' });
});
afterEach(() => { db.close(); vi.resetAllMocks(); vi.unstubAllGlobals(); });
const complete = () => processor.advance(id, { eventUri, inviteeUri });
it('verifies first; explicit confirmed intent is required for a cancellation and audit', async () => {
  expect((await complete()).phase).toBe('verified'); expect(cancel).not.toHaveBeenCalled();
  const result = await processor.advance(id, { correction: 'facility' });
  expect(result).toMatchObject({ phase: 'cancelled', outcome: 'confirmed', correction: 'facility', confirmedAt: now });
  expect(cancel).toHaveBeenCalledWith(eventUri, correctionText('facility'));
  expect(db.sqlite.prepare('SELECT count(*) AS n FROM demo_booking_audit').get()?.n).toBeGreaterThan(2);
  await processor.advance(id, { correction: 'facility' }); expect(cancel).toHaveBeenCalledTimes(1);
});
it.each([
  ['nonce', 'ddbs.someone-else'], ['email', 'someone@company.com'], ['eventType', 'other-type'],
  ['hosts', ['other-host']], ['inviteeLimit', 5], ['activeInvitees', 2], ['rescheduled', true],
  ['createdAt', 1], ['startAt', 1],
] as const)('refuses unsafe evidence %s', async (key, value) => {
  Object.assign(evidence, { [key]: value });
  expect((await complete()).phase).toBe('review'); expect(cancel).not.toHaveBeenCalled();
});
it('rechecks the live booking before cancelling, even after a valid confirmation screen', async () => {
  await complete(); evidence.activeInvitees = 2;
  expect((await processor.advance(id, { correction: 'facility' })).phase).toBe('review'); expect(cancel).not.toHaveBeenCalled();
});
it('reconciles a lost cancellation response by reads without replaying the cancellation', async () => {
  await complete(); const actual = cancel.getMockImplementation()!;
  cancel.mockImplementationOnce(async (...args) => { await actual(...args); throw new Error('lost response'); });
  expect((await processor.advance(id, { correction: 'support' })).phase).toBe('cancel_sent');
  now += 300001; await processor.reconcile();
  expect(await store.get(id)).toMatchObject({ phase: 'cancelled', outcome: 'confirmed' });
  expect(cancel).toHaveBeenCalledTimes(1);
});
it('keeps never-confirmed cancellations visible and never repeats them', async () => {
  await complete(); cancel.mockRejectedValue(new Error('timeout'));
  await processor.advance(id, { correction: 'facility' }); now += 300001; await processor.reconcile();
  expect(await store.get(id)).toMatchObject({ phase: 'cancel_sent', outcome: 'unknown' });
  now += 86400000; await processor.reconcile();
  expect(await store.get(id)).toMatchObject({ phase: 'review', reason: 'verification_window_expired' });
  expect(cancel).toHaveBeenCalledTimes(1);
});
it('does not call Calendly when persisting confirmation fails', async () => {
  await complete(); const save = store.save.bind(store);
  vi.spyOn(store, 'save').mockImplementation((booking, ...args) => { if (booking.phase === 'cancel_sent') throw new Error('offline'); return save(booking, ...args); });
  await expect(processor.advance(id, { correction: 'facility' })).rejects.toThrow('offline'); expect(cancel).not.toHaveBeenCalled();
});
it('distinguishes a definite rejection and a cancellation made outside this flow', async () => {
  await complete(); cancel.mockRejectedValue(new CalendarRejected('denied'));
  expect(await processor.advance(id, { correction: 'facility' })).toMatchObject({ phase: 'review', outcome: 'rejected' });
});
it('fences concurrent requests and duplicate invitee references', async () => {
  await complete();
  const outcomes = await Promise.allSettled([processor.advance(id, { correction: 'facility' }), processor.advance(id, { correction: 'facility' })]);
  expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(1); expect(cancel).toHaveBeenCalledTimes(1);
  const other = { ...(await store.get(id))!, id: 'b'.repeat(64), attemptKey: 'other-12345678', phase: 'prepared' as const, eventUri: undefined, inviteeUri: undefined };
  await store.create(other); await expect(processor.advance(other.id, { eventUri, inviteeUri })).rejects.toThrow();
});
it('emits server-only versioned evidence and retains DemoBooked after cancellation', async () => {
  await complete(); const booking = await processor.advance(id, { correction: 'facility' });
  expect(bookingEvent(booking)).toMatchObject({ type: 'demo_booked', fields: { dd_demo_booking_evidence: 'calendly_verified' } });
  const cancelled = bookingEvent(booking, true);
  expect(cancelled).toMatchObject({ type: 'demo_booking_cancelled', fields: {}, details: { booking: { schema_version: 1, result: 'confirmed', invitee_uri: inviteeUri } } });
  expect(JSON.stringify(cancelled)).not.toContain('provider_cancelled_at');
});
it('makes at most one Bento send attempt per invitee and event kind, retaining uncertainty', async () => {
  await complete(); await processor.advance(id, { correction: 'facility' });
  const request = vi.fn().mockRejectedValue(new Error('lost response'));
  const credentials = { siteUuid: 'site', publishableKey: 'pub', secretKey: 'secret' };
  await reportBooking(store, db.store, id, credentials, request, () => now);
  await reportBooking(store, db.store, id, credentials, request, () => now);
  expect(request).toHaveBeenCalledTimes(2);
  expect(await store.get(id)).toMatchObject({ report: 'unknown', cancellationReport: 'unknown' });
});
it('requires same-origin signed-session ownership, a scoped receipt and an explicit reason', async () => {
  const auth = new DemoAuth('secret'.repeat(8), () => now), origin = 'https://www.datadocks.com';
  const api = createBookingApi(store, db.store, processor, auth, origin, undefined, () => now);
  const cookie = (await auth.newSession()).split(';')[0];
  const request = (body: unknown, headers: Record<string,string> = {}) => new Request(`${origin}/api/demo-booking`, {
    method: 'POST', headers: { origin, 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.1', cookie, ...headers }, body: JSON.stringify(body) });
  expect((await api(request({ action: 'session' }, { origin: 'https://evil.test' }))).status).toBe(403);
  const prepared = await (await api(request({ action: 'prepare', attemptKey: 'test-12345678', email: 'buyer@company.com', context }))).json() as { booking: { token: string } };
  const token = prepared.booking.token;
  expect((await api(request({ action: 'cancel', token, reason: 'facility' }))).status).toBe(400);
  expect((await api(request({ action: 'cancel', token, reason: 'support', confirm: true }))).status).toBe(400);
  expect((await api(request({ action: 'cancel', token, reason: 'facility', confirm: true }))).status).toBe(409);
  expect((await api(request({ action: 'status', token }, { cookie: (await auth.newSession()).split(';')[0] }))).status).toBe(403);
  const session = (await auth.session(request({})))!;
  await expect(auth.leadId(token, session)).rejects.toMatchObject({ code: 'invalid_receipt' });
  expect(cancel).not.toHaveBeenCalled();
});

it('retires unverified external cancellations so the bounded queue can process later bookings', async () => {
  evidence.eventStatus = 'canceled'; evidence.inviteeStatus = 'canceled'; evidence.activeInvitees = 0;
  await complete();
  const secondId = 'b'.repeat(64), laterId = 'c'.repeat(64);
  const create = (bookingId: string, attemptKey: string) => store.create({
    id: bookingId, sessionHash: 'session', attemptKey, email: 'buyer@company.com', context,
    createdAt: now, updatedAt: now, nextAttemptAt: 0, phase: 'prepared',
  });
  await create(secondId, 'second-12345678'); evidence.nonce = 'ddbs.second-12345678';
  await processor.advance(secondId, { eventUri: `${eventUri}-second`, inviteeUri: `${eventUri}-second/invitees/invitee-second` });
  for (const cancelledId of [id, secondId]) {
    const cancelled = await store.get(cancelledId);
    expect(cancelled).toMatchObject({ phase: 'cancelled', outcome: 'already_cancelled', evidence: { eventStatus: 'canceled' } });
    expect(cancelled!.verifiedAt).toBeUndefined();
    expect(db.sqlite.prepare("SELECT count(*) AS n FROM demo_booking_audit WHERE booking_id=? AND phase='cancelled'").get(cancelledId)?.n).toBeGreaterThan(0);
  }
  // A later booking needs a retry. Two terminal rows must not consume its batch.
  now += 1000;
  await create(laterId, 'later-12345678');
  evidence.nonce = 'ddbs.later-12345678'; evidence.eventStatus = 'active'; evidence.inviteeStatus = 'active'; evidence.activeInvitees = 1;
  inspect.mockRejectedValueOnce(new Error('Temporary read failure'));
  await processor.advance(laterId, { eventUri: `${eventUri}-later`, inviteeUri: `${eventUri}-later/invitees/invitee-later` });
  now += 300001;
  expect(await store.due(now, 2)).toEqual([laterId]);
  await processor.reconcile(2);
  expect(await store.get(laterId)).toMatchObject({ phase: 'verified' });
  expect(cancel).not.toHaveBeenCalled();
});
it('keeps verified cancellations scheduled until their booking and cancellation reports are attempted', async () => {
  await complete(); await processor.advance(id, { correction: 'facility' });
  now += 300001;
  expect(await store.due(now, 2)).toEqual([id]);
  const request = vi.fn().mockImplementation(async () => new Response('{"results":1}'));
  await reportBooking(store, db.store, id, { siteUuid: 'site', publishableKey: 'pub', secretKey: 'secret' }, request, () => now);
  expect(request).toHaveBeenCalledTimes(2);
  expect(await store.get(id)).toMatchObject({ phase: 'cancelled', report: 'accepted', cancellationReport: 'accepted' });
  expect(await store.due(now, 2)).toEqual([]);
});

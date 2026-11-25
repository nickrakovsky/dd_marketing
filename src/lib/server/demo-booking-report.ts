import { buildBentoEvent } from '../bento-track-payload';
import type { DemoBooking, BookingStore } from './demo-booking';
import type { DemoStore } from './demo-types';
import type { BentoCredentials } from './demo-bento';
import { RECONCILE_WINDOW_MS } from './demo-types';

/** Server event schema 1. Legacy profile evidence cannot overwrite these verified fields. */
export function bookingEvent(booking: DemoBooking, cancellation = false) {
  if (!booking.verifiedAt || !booking.evidence || !booking.inviteeUri) throw new Error('Unverified booking');
  if (cancellation && (booking.phase !== 'cancelled' || booking.outcome !== 'confirmed')) throw new Error('Unverified cancellation');
  const occurredAt = new Date(cancellation ? booking.cancelObservedAt! : booking.verifiedAt).toISOString();
  const event = buildBentoEvent({ ...booking.context, email: booking.email, event: 'demo_booked',
    eventId: `${booking.id}:${cancellation ? 'cancelled' : 'booked'}`, occurredAt });
  const fields = event.fields as Record<string, unknown>;
  // Never rewrite acquisition history or a person-wide cancellation flag.
  for (const key of Object.keys(fields)) if (!key.startsWith('dd_')) delete fields[key];
  if (cancellation) {
    event.type = 'demo_booking_cancelled';
    for (const key of Object.keys(fields)) delete fields[key];
  } else {
    fields.dd_demo_booking_evidence = 'calendly_verified';
    fields.dd_verified_demo_booking_invitee = booking.inviteeUri;
    fields.dd_verified_demo_booking_observed_at = occurredAt;
    fields.dd_verified_demo_booking_scheduled_at = new Date(booking.evidence.startAt).toISOString();
  }
  delete event.landing_page_url; delete event.visitor_id;
  event.details = { ...(event.details as object), action_kind: cancellation ? 'demo_cancellation' : 'demo_booking',
    collection_source: 'calendly_verified_server', booking: { schema_version: 1,
      event_uri: booking.eventUri, invitee_uri: booking.inviteeUri,
      scheduled_start: new Date(booking.evidence.startAt).toISOString(), verified_at: new Date(booking.verifiedAt).toISOString(),
      ...(cancellation ? { reason: booking.correction, result: booking.outcome,
        visitor_confirmed_at: new Date(booking.confirmedAt!).toISOString(), cancellation_observed_at: occurredAt,
        ...(booking.evidence.canceledAt ? { provider_cancelled_at: new Date(booking.evidence.canceledAt).toISOString() } : {}) } : {}),
    } };
  return event;
}

/** Background only: at most one send attempt per verified invitee/event kind. */
export async function reportBooking(store: BookingStore, leads: DemoStore, id: string, credentials?: BentoCredentials,
  request: typeof fetch = fetch, now = Date.now) {
  const owner = crypto.randomUUID(), booking = await store.lock(id, owner, now());
  if (!booking) return;
  const save = () => store.save(booking, owner, now());
  try {
    if (!booking.verifiedAt) return;
    if (now() - booking.createdAt > RECONCILE_WINDOW_MS) { booking.nextAttemptAt = Number.MAX_SAFE_INTEGER; await save(); return; }
    booking.nextAttemptAt = now() + 300000; await save();
    const latest = await leads.latest(booking.sessionHash);
    // Wait for identity processing instead of creating a contact that competes with rename.
    if (latest && (latest.workEmail || latest.email).toLowerCase() === booking.email.toLowerCase()
      && !['ready', 'review'].includes(latest.phase)) return;
    if (!credentials) return;
    for (const cancellation of [false, true]) {
      const key = cancellation ? 'cancellationReport' : 'report';
      if (booking[key] || (cancellation && (booking.phase !== 'cancelled' || booking.outcome !== 'confirmed'))) continue;
      const event = bookingEvent(booking, cancellation);
      booking[key] = 'sent'; await save();
      try {
        const response = await request(`https://app.bentonow.com/api/v1/batch/events?site_uuid=${encodeURIComponent(credentials.siteUuid)}`, {
          method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json',
            Authorization: `Basic ${btoa(`${credentials.publishableKey}:${credentials.secretKey}`)}` },
          body: JSON.stringify({ events: [event] }), signal: AbortSignal.timeout(4000),
        });
        const result = await response.json() as { results?: number; failed?: number };
        booking[key] = response.ok && result.results === 1 && (!result.failed) ? 'accepted' : 'unknown';
      } catch { booking[key] = 'unknown'; }
      await save();
    }
    if (booking.phase === 'verified' || booking.phase === 'cancelled') booking.nextAttemptAt = Number.MAX_SAFE_INTEGER;
    await save();
  } finally { await store.unlock(id, owner); }
}

import { demoResponse } from './demo-api';
import { digest } from './demo-auth';
import type { DemoAuth } from './demo-auth';
import { DemoError } from './demo-types';
import type { DemoStore } from './demo-types';
import { calendlyReference } from './demo-calendly';
import type { BookingStore, BookingProcessor } from './demo-booking';
import type { DemoBooking, CorrectionReason } from './demo-booking';
import { emailAddress, leadContext, readBody, requestKey } from './demo-validation';
import { facilityBookingUrl } from '../demo-qualification';

export function createBookingApi(store: BookingStore, limits: DemoStore, processor: BookingProcessor | null,
  auth: DemoAuth, origin: string, supportUrl?: string, now = Date.now) {
  async function snapshot(booking: DemoBooking, session: { hash: string; expires: number }) {
    return { booking: { token: await auth.receipt(booking.id, session, 'booking'), phase: booking.phase,
      reason: booking.reason, outcome: booking.outcome, startAt: booking.evidence?.startAt,
      supportAvailable: !!supportUrl,
      destination: booking.phase === 'cancelled' && booking.correction
        ? booking.correction === 'facility' ? facilityBookingUrl(booking.email) : supportUrl : undefined } };
  }
  return async (request: Request) => {
    try {
      if (request.method !== 'POST') throw new DemoError('method_not_allowed', 405);
      if (new URL(request.url).origin !== origin || request.headers.get('origin') !== origin
        || (request.headers.has('sec-fetch-site') && request.headers.get('sec-fetch-site') !== 'same-origin')) throw new DemoError('origin_not_allowed', 403);
      const ip = request.headers.get('cf-connecting-ip');
      if (!ip) throw new DemoError('edge_required', 503);
      const bucket = Math.floor(now() / 3600000);
      if (!await limits.rateLimit(await auth.rateKey(ip, bucket), 180, (bucket + 1) * 3600000)) throw new DemoError('rate_limited', 429);
      const body = await readBody(request), session = await auth.session(request);
      if (body.action === 'session') return demoResponse({ ok: true }, 200, session ? {} : { 'Set-Cookie': await auth.newSession() });
      if (!processor) throw new DemoError('booking_disabled', 503);
      if (!session) throw new DemoError('session_required', 401);
      if (!await limits.rateLimit(`booking:${session.hash}:${bucket}`, 80, (bucket + 1) * 3600000)) throw new DemoError('rate_limited', 429);
      if (body.action === 'prepare') {
        const attemptKey = requestKey(body.attemptKey), email = emailAddress(body.email, true), context = leadContext(body.context, origin);
        const id = await digest(`booking:${session.hash}:${attemptKey}`);
        const booking = await store.create({ id, sessionHash: session.hash, attemptKey, email, context,
          createdAt: now(), updatedAt: now(), nextAttemptAt: 0, phase: 'prepared' });
        if (!booking || booking.email !== email || JSON.stringify(booking.context) !== JSON.stringify(context)) throw new DemoError('booking_conflict', 409);
        return demoResponse(await snapshot(booking, session));
      }
      const id = await auth.leadId(body.token, session, 'booking');
      const booking = await store.get(id);
      if (!booking || booking.sessionHash !== session.hash) throw new DemoError('not_found', 404);
      let input: { eventUri?: string; inviteeUri?: string; correction?: CorrectionReason } | undefined;
      if (body.action === 'complete') {
        const eventUri = calendlyReference(body.eventUri, 'event'), inviteeUri = calendlyReference(body.inviteeUri, 'invitee');
        if (!inviteeUri.startsWith(`${eventUri}/invitees/`)) throw new DemoError('booking_mismatch');
        input = { eventUri, inviteeUri };
      } else if (body.action === 'cancel') {
        if (body.confirm !== true || !['facility', 'support'].includes(String(body.reason))) throw new DemoError('confirmation_required');
        if (body.reason === 'support' && !supportUrl) throw new DemoError('support_unavailable');
        if (!booking.verifiedAt) throw new DemoError('verification_required', 409);
        input = { correction: body.reason as CorrectionReason };
      } else if (body.action !== 'status') throw new DemoError('invalid_action');
      return demoResponse(await snapshot(await processor.advance(id, input), session));
    } catch (error) {
      if (error instanceof DemoError) return demoResponse({ error: error.code }, error.status);
      console.error('[demo-booking] Request could not complete');
      return demoResponse({ error: 'temporarily_unavailable' }, 503);
    }
  };
}

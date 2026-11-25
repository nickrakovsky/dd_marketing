import type { DemoDatabase } from './demo-store';
import { DemoError, RECONCILE_WINDOW_MS } from './demo-types';
import { CalendarRejected } from './demo-calendly';
import type { BookingEvidence, DemoCalendarProvider } from './demo-calendly';
import type { DemoLeadContext } from '../demo-qualification';

export type BookingPhase = 'prepared' | 'verifying' | 'verified' | 'cancel_sent' | 'cancelled' | 'review';
export type CorrectionReason = 'facility' | 'support';
export interface DemoBooking {
  id: string; sessionHash: string; attemptKey: string; email: string; context: DemoLeadContext;
  createdAt: number; updatedAt: number; nextAttemptAt: number; phase: BookingPhase;
  eventUri?: string; inviteeUri?: string; evidence?: BookingEvidence; verifiedAt?: number;
  correction?: CorrectionReason; confirmedAt?: number; cancelObservedAt?: number;
  outcome?: 'confirmed' | 'already_cancelled' | 'unknown' | 'rejected'; reason?: string;
  report?: 'sent' | 'accepted' | 'unknown'; cancellationReport?: 'sent' | 'accepted' | 'unknown';
}
const decode = (row: { payload: string } | null): DemoBooking | null => row ? JSON.parse(row.payload) : null;
export class BookingStore {
  constructor(private db: DemoDatabase) {}
  async create(booking: DemoBooking) {
    await this.db.prepare(`INSERT OR IGNORE INTO demo_bookings
      (id,session_hash,attempt_key,phase,payload,created_at,updated_at,next_attempt_at) VALUES (?,?,?,?,?,?,?,?)`)
      .bind(booking.id, booking.sessionHash, booking.attemptKey, booking.phase, JSON.stringify(booking), booking.createdAt, booking.updatedAt, booking.nextAttemptAt).run();
    return this.get(booking.id);
  }
  async get(id: string) { return decode(await this.db.prepare('SELECT payload FROM demo_bookings WHERE id=?').bind(id).first<{ payload: string }>()); }
  async lock(id: string, owner: string, now: number) {
    return decode(await this.db.prepare(`UPDATE demo_bookings SET lease_id=?,lease_until=?
      WHERE id=? AND (lease_id IS NULL OR lease_until < ?) RETURNING payload`).bind(owner, now + 60000, id, now).first<{ payload: string }>());
  }
  async save(booking: DemoBooking, owner: string, now: number) {
    booking.updatedAt = now;
    const result = await this.db.batch([
      this.db.prepare(`UPDATE demo_bookings SET phase=?,invitee_uri=?,payload=?,updated_at=?,next_attempt_at=?
        WHERE id=? AND lease_id=? AND lease_until>=?`).bind(booking.phase, booking.verifiedAt ? booking.inviteeUri || null : null, JSON.stringify(booking), now, booking.nextAttemptAt, booking.id, owner, now),
      this.db.prepare(`INSERT INTO demo_booking_audit(booking_id,occurred_at,phase,reason,outcome)
        SELECT id,?,?,?,? FROM demo_bookings WHERE id=? AND lease_id=? AND lease_until>=?`)
        .bind(now, booking.phase, booking.reason || booking.correction || null, booking.outcome || null, booking.id, owner, now),
    ]);
    if (result[0].meta.changes !== 1) throw new Error('Lost booking lease');
  }
  async unlock(id: string, owner: string) { await this.db.prepare('UPDATE demo_bookings SET lease_id=NULL,lease_until=0 WHERE id=? AND lease_id=?').bind(id, owner).run(); }
  async due(now: number, limit: number) {
    const rows = await this.db.prepare(`SELECT id FROM demo_bookings WHERE phase IN ('verifying','cancel_sent','verified','cancelled')
      AND next_attempt_at<=? AND (lease_id IS NULL OR lease_until<?) ORDER BY next_attempt_at LIMIT ?`).bind(now, now, limit).all<{ id: string }>();
    return rows.results.map(row => row.id);
  }
}
export const correctionText = (reason: CorrectionReason) => reason === 'support'
  ? 'This user actually wanted support.' : 'This user actually wanted to book a facility appointment.';
export interface BookingPolicy { eventType: string; hosts: string[] }

export class BookingProcessor {
  constructor(private store: BookingStore, private calendar: DemoCalendarProvider, private policy: BookingPolicy, private now = Date.now) {}
  private validate(booking: DemoBooking, evidence: BookingEvidence) {
    if (evidence.email !== booking.email.toLowerCase() || evidence.nonce !== `ddbs.${booking.attemptKey}`
      || evidence.createdAt < booking.createdAt - 60000 || evidence.createdAt > this.now() + 60000
      || evidence.eventType !== this.policy.eventType || !evidence.hosts.length
      || !evidence.hosts.every(host => this.policy.hosts.includes(host)) || evidence.rescheduled
      || evidence.inviteeLimit !== 1) throw new DemoError('booking_not_eligible', 409);
  }
  async advance(id: string, input?: { eventUri?: string; inviteeUri?: string; correction?: CorrectionReason }) {
    const owner = crypto.randomUUID(), now = this.now();
    const booking = await this.store.lock(id, owner, now);
    if (!booking) throw new DemoError('booking_busy', 409);
    const save = () => this.store.save(booking, owner, this.now());
    try {
      if (input?.eventUri && input.inviteeUri) {
        if (booking.eventUri && (booking.eventUri !== input.eventUri || booking.inviteeUri !== input.inviteeUri)) throw new DemoError('booking_conflict', 409);
        if (booking.phase === 'prepared') {
          booking.eventUri = input.eventUri; booking.inviteeUri = input.inviteeUri; booking.phase = 'verifying'; await save();
        }
      }
      if (input?.correction && booking.correction && booking.correction !== input.correction) throw new DemoError('correction_conflict', 409);
      if (['review','cancelled','prepared'].includes(booking.phase)) return booking;
      if (!input?.correction && booking.phase === 'verified') return booking;
      if (now - booking.createdAt > RECONCILE_WINDOW_MS) {
        booking.phase = 'review'; booking.reason = 'verification_window_expired'; await save(); return booking;
      }
      if (booking.nextAttemptAt > now && !input?.correction) return booking;
      booking.nextAttemptAt = now + 300000;
      await save();
      let evidence: BookingEvidence;
      try { evidence = await this.calendar.inspect(booking.eventUri!, booking.inviteeUri!); }
      catch { booking.reason = 'calendly_read_unavailable'; await save(); return booking; }
      try { this.validate(booking, evidence); }
      catch { booking.phase = 'review'; booking.reason = 'booking_not_eligible'; await save(); return booking; }
      booking.evidence = evidence;
      if (evidence.eventStatus === 'canceled' && evidence.inviteeStatus === 'canceled') {
        booking.phase = 'cancelled'; booking.cancelObservedAt = now;
        booking.outcome = booking.confirmedAt && evidence.cancellationReason === correctionText(booking.correction!) ? 'confirmed' : 'already_cancelled';
        // No verified booking event exists to report. Keep the evidence/audit,
        // but free the scheduled queue for bookings that still need work.
        if (!booking.verifiedAt) booking.nextAttemptAt = Number.MAX_SAFE_INTEGER;
        booking.reason = undefined; await save(); return booking;
      }
      if (evidence.eventStatus !== 'active' || evidence.inviteeStatus !== 'active' || evidence.activeInvitees !== 1 || evidence.startAt <= now) {
        booking.phase = 'review'; booking.reason = 'booking_no_longer_eligible'; await save(); return booking;
      }
      if (booking.phase === 'cancel_sent') { booking.outcome = 'unknown'; await save(); return booking; }
      booking.phase = 'verified'; booking.verifiedAt ||= now; booking.reason = undefined; await save();
      if (!input?.correction) return booking;
      booking.correction = input.correction; booking.confirmedAt = now;
      booking.phase = 'cancel_sent'; booking.outcome = 'unknown';
      await save(); // Never call cancellation unless the intent and no-replay checkpoint are durable.
      try { await this.calendar.cancel(booking.eventUri!, correctionText(input.correction)); }
      catch (error) {
        if (error instanceof CalendarRejected) { booking.phase = 'review'; booking.outcome = 'rejected'; booking.reason = 'calendly_rejected'; }
        await save(); return booking;
      }
      // A POST response alone is not the final user-visible success signal.
      try {
        const after = await this.calendar.inspect(booking.eventUri!, booking.inviteeUri!);
        this.validate(booking, after);
        if (after.eventStatus === 'canceled' && after.inviteeStatus === 'canceled') {
          booking.evidence = after; booking.phase = 'cancelled'; booking.cancelObservedAt = this.now();
          booking.outcome = after.cancellationReason === correctionText(input.correction) ? 'confirmed' : 'already_cancelled';
        }
      } catch { /* Reconciliation performs reads only; never resend an uncertain cancellation. */ }
      await save(); return booking;
    } finally { await this.store.unlock(id, owner); }
  }
  async reconcile(limit = 2) {
    for (const id of await this.store.due(this.now(), limit)) {
      try { await this.advance(id); } catch { console.error('[demo-booking] Verification deferred', id); }
    }
  }
}

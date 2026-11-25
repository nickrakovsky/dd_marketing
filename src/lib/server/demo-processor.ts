import { needsWorkEmail, normalizeDemoEmail } from '../demo-qualification';
import { BentoRejected } from './demo-bento';
import { CAPTURE_FIELD, DemoError, PERSONAL_FIELD, RECONCILE_WINDOW_MS } from './demo-types';
import type { DemoBento, DemoStore, Lead } from './demo-types';

class ProviderFailure extends Error {
  constructor(public rejected: boolean) { super('Provider operation failed'); }
}
async function upstream<T>(run: () => Promise<T>): Promise<T> {
  try { return await run(); }
  catch (error) { throw new ProviderFailure(error instanceof BentoRejected); }
}

/** Durable write-ahead checkpoints fence off duplicate upstream writes. */
export class DemoProcessor {
  constructor(private store: DemoStore, private bento: DemoBento, private now = Date.now) {}

  async advance(id: string, work?: { email: string; requestId: string }): Promise<Lead> {
    if (work && (normalizeDemoEmail(work.email) !== work.email || needsWorkEmail(work.email))) throw new DemoError('invalid_work_email');
    const owner = crypto.randomUUID();
    const lead = await this.store.lock(id, owner, this.now());
    if (!lead) {
      const current = await this.store.get(id);
      if (!current) throw new DemoError('not_found', 404);
      if (work) throw new DemoError('operation_busy', 409);
      return current;
    }
    const save = () => this.store.save(lead, owner, this.now());
    const review = async (reason: string) => { lead.phase = 'review'; lead.reason = reason; await save(); };
    try {
      if (work) {
        if (lead.workKey && (lead.workKey !== work.requestId || lead.workEmail !== work.email)) throw new DemoError('operation_conflict', 409);
        if (!lead.workKey) {
          if (!['capture', 'capture_sent', 'captured', 'review'].includes(lead.phase)
            || !needsWorkEmail(lead.email) || needsWorkEmail(work.email)) throw new DemoError('work_email_not_allowed', 409);
          lead.workKey = work.requestId;
          lead.workEmail = work.email;
          lead.operationStartedAt = this.now();
          lead.attempts = 0;
          lead.nextAttemptAt = 0;
          // Accept the requested identity even while capture is unverified.
          // Only verified capture can advance to a rename; review remains internal.
          if (lead.phase === 'captured') lead.phase = 'rename';
          await save(); // Preserve the requested work address before any remote work.
        }
      }
      if (['captured', 'ready', 'review'].includes(lead.phase) || lead.nextAttemptAt > this.now()) return lead;
      if (this.now() - lead.operationStartedAt > RECONCILE_WINDOW_MS) {
        await review('verification_timeout');
        return lead;
      }
      lead.attempts++;
      lead.reason = undefined;
      lead.nextAttemptAt = this.now() + Math.min(300000, 5000 * 2 ** Math.min(lead.attempts - 1, 6));
      await save();
      try {
        if (lead.phase === 'capture') {
          const existing = await upstream(() => this.bento.find({ email: lead.email }));
          lead.preexisting = !!existing;
          if (!await this.store.claimEmail(lead.email, lead.id)) {
            await review('concurrent_identity');
            return lead;
          }
          lead.phase = 'capture_sent';
          await save(); // A crash after this point must never replay the event blindly.
          await upstream(() => this.bento.capture(lead));
        }
        if (lead.phase === 'capture_sent') {
          const person = await upstream(() => this.bento.find({ email: lead.email }));
          if (person?.fields[CAPTURE_FIELD] === lead.id) {
            if (!lead.preexisting && needsWorkEmail(lead.email) && person.fields[PERSONAL_FIELD] !== lead.email) {
              await review('personal_field_missing');
            } else {
              lead.baseline = person;
              lead.phase = needsWorkEmail(lead.email) ? (lead.workEmail ? 'rename' : 'captured') : 'ready';
              await save();
            }
          }
          return lead;
        }
        if (lead.phase === 'rename') {
          if (!lead.baseline || !lead.workEmail) {
            await review('missing_source_identity'); return lead;
          }
          const source = await upstream(() => this.bento.find({ uuid: lead.baseline!.uuid }));
          if (!source || source.email !== lead.email || source.fields[CAPTURE_FIELD] !== lead.id) {
            await review('source_identity_changed'); return lead;
          }
          const workEmail = lead.workEmail;
          const target = await upstream(() => this.bento.find({ email: workEmail }));
          if (!await this.store.claimEmail(workEmail, lead.id)) {
            await review('concurrent_identity'); return lead;
          }
          if (lead.preexisting || target) {
            lead.workTarget = target;
            lead.phase = 'work_capture';
            await save();
          } else {
            if (source.fields[PERSONAL_FIELD] !== lead.email) { await review('personal_field_missing'); return lead; }
          lead.phase = 'rename_sent';
          await save(); // Queue acceptance alone never makes an identity ready.
          await upstream(() => this.bento.changeEmail(lead.email, workEmail));
          }
        }
        if (lead.phase === 'rename_sent' && lead.baseline) {
          const sourceUuid = lead.baseline.uuid;
          const person = await upstream(() => this.bento.find({ uuid: sourceUuid }));
          if (person && person.email === lead.workEmail) {
            const workEmail = lead.workEmail!;
            const target = await upstream(() => this.bento.find({ email: workEmail }));
            if (target?.uuid !== lead.baseline.uuid || person.fields[PERSONAL_FIELD] !== lead.email
              || person.fields[CAPTURE_FIELD] !== lead.id || person.unsubscribedAt !== lead.baseline.unsubscribedAt
              || !lead.baseline.tags.every(tag => person.tags.includes(tag))
              || !Object.entries(lead.baseline.fields).every(([key, value]) => JSON.stringify(person.fields[key]) === JSON.stringify(value))) {
              await review('identity_preservation_mismatch');
            } else {
              lead.phase = 'ready';
              lead.identityMethod = 'renamed';
              await save();
            }
          } else if (person && person.email !== lead.email) {
            await review('unexpected_identity');
          }
        }
        if (lead.phase === 'work_capture') {
          lead.phase = 'work_capture_sent';
          await save();
          await upstream(() => this.bento.captureWork(lead));
        }
        if (lead.phase === 'work_capture_sent' && lead.workEmail) {
          const person = await upstream(() => this.bento.find({ email: lead.workEmail! }));
          if (person?.fields[CAPTURE_FIELD] === `${lead.id}:work`) {
            const baseline = lead.workTarget;
            if ((baseline && (person.uuid !== baseline.uuid || person.unsubscribedAt !== baseline.unsubscribedAt
              || !baseline.tags.every(tag => person.tags.includes(tag))))
              || person.fields[PERSONAL_FIELD] !== (baseline?.fields[PERSONAL_FIELD] || lead.email)) {
              await review('work_capture_preservation_mismatch');
            } else {
              lead.phase = 'ready'; lead.identityMethod = 'separate_contacts'; await save();
            }
          }
        }
      } catch (error) {
        // Never convert persistence/lease failures into successful responses.
        if (!(error instanceof ProviderFailure)) throw error;
        if (error.rejected) await review('provider_rejected');
        else { lead.reason = 'provider_unavailable'; await save(); }
        // Unknown outcomes stay at *_sent and are reconciled by reads only.
      }
      return lead;
    } finally {
      await this.store.unlock(id, owner);
    }
  }

  async reconcile(limit = 10) {
    const ids = await this.store.due(this.now(), limit);
    for (const id of ids) {
      try { await this.advance(id); }
      catch { console.error('[demo-reconcile] Operation deferred', id); }
    }
    await this.store.pruneRateLimits(this.now());
    return ids.length;
  }
}

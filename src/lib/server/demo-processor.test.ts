// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoProcessor } from './demo-processor';
import { BentoRejected } from './demo-bento';
import { RECONCILE_WINDOW_MS } from './demo-types';
import { fakeBento, person, testDatabase, testLead } from './demo-test-fixtures';

let database: ReturnType<typeof testDatabase>;
let bento: ReturnType<typeof fakeBento>;
let processor: DemoProcessor;
let now: number;
beforeEach(async () => {
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Real network prohibited'); }));
  database = testDatabase(); bento = fakeBento(); now = 1000000;
  processor = new DemoProcessor(database.store, bento, () => now);
  await database.store.create(testLead());
});
afterEach(() => { database.close(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const id = 'a'.repeat(64);
const work = { email: 'buyer@company.com', requestId: 'work-key' };

describe('durable capture and identity changes', () => {
  it('captures personal then changes the same identity while retaining fields, tags and unsubscribe status', async () => {
    const captured = await processor.advance(id);
    expect(captured.phase).toBe('captured');
    const ready = await processor.advance(id, work);
    expect(ready.phase).toBe('ready');
    expect([...bento.people.values()]).toEqual([{ ...captured.baseline, email: work.email }]);
    expect(ready.context).toEqual(captured.context);
    await processor.advance(id, work);
    expect(bento.capture).toHaveBeenCalledTimes(1);
    expect(bento.changeEmail).toHaveBeenCalledTimes(1);
  });
  it('persists a qualifying work address during delayed capture and reconciles after the visitor leaves', async () => {
    const actualCapture = bento.capture.getMockImplementation()!;
    bento.capture.mockResolvedValue(undefined);
    expect((await processor.advance(id)).phase).toBe('capture_sent');
    const queued = await processor.advance(id, work);
    expect(queued).toMatchObject({ phase: 'capture_sent', workEmail: work.email, workKey: work.requestId });
    expect(bento.changeEmail).not.toHaveBeenCalled();
    await actualCapture(queued);
    now += 6000; await processor.reconcile();
    expect((await database.store.get(id))?.phase).toBe('rename');
    now += 11000; await processor.reconcile();
    expect((await database.store.get(id))?.phase).toBe('ready');
    expect(bento.capture).toHaveBeenCalledTimes(1); expect(bento.changeEmail).toHaveBeenCalledTimes(1);
  });
  it('retains a submitted work address even when capture needs internal review', async () => {
    bento.capture.mockRejectedValue(new BentoRejected('rejected'));
    await processor.advance(id);
    expect(await processor.advance(id, work)).toMatchObject({ phase: 'review', workEmail: work.email });
    expect(bento.changeEmail).not.toHaveBeenCalled();
  });
  it('deduplicates simultaneous captures through a database lease', async () => {
    await Promise.all([processor.advance(id), processor.advance(id)]);
    expect(bento.capture).toHaveBeenCalledTimes(1);
  });
  it('preserves an existing personal record and creates the work contact with its personal address', async () => {
    bento.people.set('stable-person', person());
    await processor.advance(id);
    const result = await processor.advance(id, work);
    expect(result).toMatchObject({ phase: 'ready', identityMethod: 'separate_contacts', email: 'buyer@gmail.com', workEmail: work.email });
    expect(bento.changeEmail).not.toHaveBeenCalled();
  });
  it('updates an existing work contact while retaining the separate personal contact', async () => {
    bento.people.set('stable-person', person(work.email));
    await processor.advance(id);
    expect(await processor.advance(id, work)).toMatchObject({ phase: 'ready', identityMethod: 'separate_contacts' });
    expect(bento.people.size).toBe(2);
    expect(bento.changeEmail).not.toHaveBeenCalled();
  });
  it('retains the work contact’s first personal address and histories when another personal address is submitted', async () => {
    const existing = person(work.email); existing.fields.original_personal_email = 'earlier@yahoo.com';
    bento.people.set(existing.uuid, existing);
    await processor.advance(id);
    expect((await processor.advance(id, work)).phase).toBe('ready');
    expect(bento.people.get(existing.uuid)).toMatchObject({ fields: { original_personal_email: 'earlier@yahoo.com' }, tags: ['customer'], unsubscribedAt: '2025-01-01' });
    expect(bento.captureWork).toHaveBeenCalledOnce(); expect(bento.changeEmail).not.toHaveBeenCalled();
  });
  it('verifies a separate work capture after a lost response without repeating the event', async () => {
    bento.people.set('stable-person', person()); await processor.advance(id);
    const actual = bento.captureWork.getMockImplementation()!;
    bento.captureWork.mockImplementationOnce(async lead => { await actual(lead); throw new Error('lost'); });
    expect((await processor.advance(id, work)).phase).toBe('work_capture_sent');
    now += 6000; await processor.reconcile();
    expect(await database.store.get(id)).toMatchObject({ phase: 'ready', identityMethod: 'separate_contacts' });
    expect(bento.captureWork).toHaveBeenCalledOnce();
  });
  it('fences two concurrent renames targeting the same work identity', async () => {
    const other = testLead({ id: 'b'.repeat(64), captureKey: 'other-key', email: 'second@gmail.com' });
    await database.store.create(other);
    await processor.advance(id); await processor.advance(other.id);
    bento.changeEmail.mockResolvedValue(undefined);
    const results = await Promise.all([processor.advance(id, work), processor.advance(other.id, work)]);
    expect(results.map(result => result.phase).sort()).toEqual(['rename_sent', 'review']);
    expect(bento.changeEmail).toHaveBeenCalledTimes(1);
  });
  it('holds a record changed externally instead of renaming the changed identity', async () => {
    await processor.advance(id);
    [...bento.people.values()][0].email = 'external@company.com';
    expect(await processor.advance(id, work)).toMatchObject({ phase: 'review', reason: 'source_identity_changed' });
    expect(bento.changeEmail).not.toHaveBeenCalled();
  });
  it('recovers a delayed capture with reads after the tab closes, without reposting the event', async () => {
    const actualCapture = bento.capture.getMockImplementation()!;
    bento.capture.mockResolvedValue(undefined);
    expect((await processor.advance(id)).phase).toBe('capture_sent');
    await actualCapture((await database.store.get(id))!);
    now += 6000;
    await processor.reconcile();
    expect((await database.store.get(id))?.phase).toBe('captured');
    expect(bento.capture).toHaveBeenCalledTimes(1);
  });
  it('verifies a rename whose response was lost without sending it again', async () => {
    await processor.advance(id);
    const rename = bento.changeEmail.getMockImplementation()!;
    bento.changeEmail.mockImplementationOnce(async (...args) => { await rename(...args); throw new Error('response lost'); });
    expect((await processor.advance(id, work)).phase).toBe('rename_sent');
    now += 6000;
    expect((await processor.advance(id, work)).phase).toBe('ready');
    expect(bento.changeEmail).toHaveBeenCalledTimes(1);
  });
  it('retains a never-confirmed write for review after the bounded reconciliation window', async () => {
    bento.capture.mockRejectedValue(new Error('unknown write outcome'));
    await processor.advance(id);
    now += RECONCILE_WINDOW_MS + 1;
    await processor.reconcile();
    expect(await database.store.get(id)).toMatchObject({ phase: 'review', reason: 'verification_timeout', email: 'buyer@gmail.com' });
    expect(bento.capture).toHaveBeenCalledTimes(1);
  });
  it('retries failed reads safely before writing', async () => {
    bento.find.mockRejectedValueOnce(new Error('timeout'));
    expect((await processor.advance(id)).phase).toBe('capture');
    expect(bento.capture).not.toHaveBeenCalled();
    now += 6000;
    expect((await processor.advance(id)).phase).toBe('captured');
  });
  it('holds a definite provider rejection for review', async () => {
    bento.capture.mockRejectedValue(new BentoRejected('rejected'));
    expect(await processor.advance(id)).toMatchObject({ phase: 'review', reason: 'provider_rejected' });
  });
  it.each(['tags', 'unsubscribedAt', 'fields'] as const)('does not claim readiness when %s were lost', async field => {
    await processor.advance(id);
    const rename = bento.changeEmail.getMockImplementation()!;
    bento.changeEmail.mockImplementationOnce(async (...args) => {
      await rename(...args);
      const saved = [...bento.people.values()][0];
      if (field === 'tags') saved.tags = [];
      if (field === 'unsubscribedAt') saved.unsubscribedAt = null;
      if (field === 'fields') delete saved.fields.utm_source;
    });
    expect(await processor.advance(id, work)).toMatchObject({ phase: 'review', reason: 'identity_preservation_mismatch' });
  });
  it('refuses conflicting work retries and personal addresses server-side', async () => {
    await processor.advance(id);
    await expect(processor.advance(id, { ...work, email: 'other@gmail.com' })).rejects.toMatchObject({ code: 'invalid_work_email' });
    bento.changeEmail.mockResolvedValue(undefined);
    await processor.advance(id, work);
    await expect(processor.advance(id, { ...work, email: 'different@company.com' })).rejects.toMatchObject({ code: 'operation_conflict' });
  });
  it('does not send anything when saving the write-ahead checkpoint fails', async () => {
    const save = database.store.save.bind(database.store);
    vi.spyOn(database.store, 'save').mockImplementation(async (...args) => {
      if (args[0].phase === 'capture_sent') throw new Error('database unavailable');
      return save(...args);
    });
    await expect(processor.advance(id)).rejects.toThrow('database unavailable');
    expect(bento.capture).not.toHaveBeenCalled();
  });
});

describe('SQLite persistence fencing and reservations', () => {
  it('rejects a stale lease owner and keeps the new owner’s audit intact', async () => {
    const stale = (await database.store.lock(id, 'old', now))!;
    expect(await database.store.lock(id, 'new', now)).toBeNull();
    now += 60001;
    await database.store.lock(id, 'new', now);
    stale.phase = 'ready';
    await expect(database.store.save(stale, 'old', now)).rejects.toThrow('Lost lead lease');
    expect((await database.store.get(id))?.phase).toBe('capture');
    expect(database.sqlite.prepare('SELECT count(*) AS n FROM demo_operation_audit').get()?.n).toBe(0);
    await database.store.unlock(id, 'old');
    expect(await database.store.lock(id, 'third', now)).toBeNull();
  });
  it('lets a returning work-email visitor capture again after the prior operation completed', async () => {
    const first = testLead({ id: 'b'.repeat(64), captureKey: 'first-work', email: work.email });
    const next = testLead({ id: 'c'.repeat(64), captureKey: 'next-work', email: work.email });
    await database.store.create(first); await database.store.create(next);
    expect((await processor.advance(first.id)).phase).toBe('ready');
    expect((await processor.advance(next.id)).phase).toBe('ready');
    expect(bento.changeEmail).not.toHaveBeenCalled();
  });
  it('blocks concurrent identities and releases only abandoned captured reservations after expiry', async () => {
    await processor.advance(id);
    const next = testLead({ id: 'b'.repeat(64), captureKey: 'other-key' });
    await database.store.create(next);
    expect(await database.store.claimEmail(next.email, next.id)).toBe(false);
    now += RECONCILE_WINDOW_MS + 1;
    await database.store.pruneRateLimits(now);
    expect(await database.store.claimEmail(next.email, next.id)).toBe(true);
    expect(await database.store.get(id)).not.toBeNull();
  });
  it('bounds request counts and deletes expired rate buckets', async () => {
    expect(await database.store.rateLimit('one', 1, now)).toBe(true);
    expect(await database.store.rateLimit('one', 1, now)).toBe(false);
    await database.store.pruneRateLimits(now + 1);
    expect(database.sqlite.prepare('SELECT count(*) AS n FROM demo_rate_limits').get()?.n).toBe(0);
  });
});

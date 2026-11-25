import { RECONCILE_WINDOW_MS } from './demo-types';
import type { DemoStore, Lead } from './demo-types';

// Structural subset of D1's API: tests exercise the same SQL using SQLite.
export interface DemoStatement {
  bind(...values: (string | number | null)[]): DemoStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}
export interface DemoDatabase {
  prepare(sql: string): DemoStatement;
  batch(statements: DemoStatement[]): Promise<{ meta: { changes: number } }[]>;
}
const parse = (row: { payload: string } | null): Lead | null => row ? JSON.parse(row.payload) : null;

export class D1DemoStore implements DemoStore {
  constructor(private db: DemoDatabase) {}

  async create(lead: Lead) {
    await this.db.prepare(`INSERT OR IGNORE INTO demo_leads
      (id, session_hash, capture_key, email, phase, payload, created_at, updated_at, next_attempt_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      lead.id, lead.sessionHash, lead.captureKey, lead.email, lead.phase, JSON.stringify(lead),
      lead.createdAt, lead.createdAt, lead.nextAttemptAt,
    ).run();
    const saved = await this.get(lead.id);
    if (!saved) throw new Error('Lead was not persisted');
    return saved;
  }
  async get(id: string) {
    return parse(await this.db.prepare('SELECT payload FROM demo_leads WHERE id = ?').bind(id).first<{ payload: string }>());
  }
  async latest(sessionHash: string) {
    return parse(await this.db.prepare('SELECT payload FROM demo_leads WHERE session_hash = ? ORDER BY created_at DESC LIMIT 1')
      .bind(sessionHash).first<{ payload: string }>());
  }
  async lock(id: string, owner: string, now: number) {
    return parse(await this.db.prepare(`UPDATE demo_leads SET lease_id = ?, lease_until = ?
      WHERE id = ? AND (lease_id IS NULL OR lease_until < ?) RETURNING payload`)
      .bind(owner, now + 60000, id, now).first<{ payload: string }>());
  }
  async save(lead: Lead, owner: string, now: number) {
    const results = await this.db.batch([
      this.db.prepare(`UPDATE demo_leads SET payload = ?, phase = ?, updated_at = ?, next_attempt_at = ?
        WHERE id = ? AND lease_id = ? AND lease_until >= ?`)
        .bind(JSON.stringify(lead), lead.phase, now, lead.nextAttemptAt, lead.id, owner, now),
      this.db.prepare(`INSERT INTO demo_operation_audit(lead_id, occurred_at, phase, reason)
        SELECT id, ?, ?, ? FROM demo_leads WHERE id = ? AND lease_id = ? AND lease_until >= ?`)
        .bind(now, lead.phase, lead.reason || null, lead.id, owner, now),
    ]);
    if (results[0].meta.changes !== 1) throw new Error('Lost lead lease');
  }
  async unlock(id: string, owner: string) {
    await this.db.prepare('UPDATE demo_leads SET lease_id = NULL, lease_until = 0 WHERE id = ? AND lease_id = ?').bind(id, owner).run();
  }
  async claimEmail(email: string, leadId: string) {
    const key = email.toLowerCase();
    // Completed operations no longer own a reservation. Uncertain/review
    // operations keep theirs until reviewed, so a late write cannot collide.
    await this.db.prepare(`INSERT INTO demo_identity_claims(email_key, lead_id) VALUES (?, ?)
      ON CONFLICT(email_key) DO UPDATE SET lead_id = excluded.lead_id
      WHERE demo_identity_claims.lead_id IN (SELECT id FROM demo_leads WHERE phase = 'ready')`)
      .bind(key, leadId).run();
    const row = await this.db.prepare('SELECT lead_id FROM demo_identity_claims WHERE email_key = ?').bind(key).first<{ lead_id: string }>();
    return row?.lead_id === leadId;
  }
  async due(now: number, limit: number) {
    const rows = await this.db.prepare(`SELECT id FROM demo_leads
      WHERE phase IN ('capture', 'capture_sent', 'rename', 'rename_sent', 'work_capture', 'work_capture_sent') AND next_attempt_at <= ?
      AND (lease_id IS NULL OR lease_until < ?) ORDER BY next_attempt_at LIMIT ?`).bind(now, now, limit).all<{ id: string }>();
    return rows.results.map(row => row.id);
  }
  async rateLimit(key: string, limit: number, expiresAt: number) {
    const row = await this.db.prepare(`INSERT INTO demo_rate_limits(bucket_key, count, expires_at) VALUES (?, 1, ?)
      ON CONFLICT(bucket_key) DO UPDATE SET count = count + 1 WHERE count < ? RETURNING count`)
      .bind(key, expiresAt, limit).first<{ count: number }>();
    return !!row;
  }
  async pruneRateLimits(now: number) {
    await this.db.prepare('DELETE FROM demo_rate_limits WHERE expires_at < ?').bind(now).run();
    // A personal capture with an expired session cannot start a rename. Keep
    // the contact/history, but let a returning visitor capture it again.
    await this.db.prepare(`DELETE FROM demo_identity_claims WHERE lead_id IN
      (SELECT id FROM demo_leads WHERE phase = 'captured' AND created_at < ?)`)
      .bind(now - RECONCILE_WINDOW_MS).run();
  }
}

// Test-only fixtures. No network and no production database bindings.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { vi } from 'vitest';
import { D1DemoStore } from './demo-store';
import type { DemoDatabase, DemoStatement } from './demo-store';
import { CAPTURE_FIELD, PERSONAL_FIELD } from './demo-types';
import type { Lead, Subscriber } from './demo-types';
import { needsWorkEmail } from '../demo-qualification';

export function testDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../../../migrations/demo/0001_demo_leads.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../../../migrations/demo/0002_demo_bookings.sql', import.meta.url), 'utf8'));
  class Statement implements DemoStatement {
    values: (string | number | null)[] = [];
    constructor(private sql: string) {}
    bind(...values: (string | number | null)[]) { this.values = values; return this; }
    async first<T>() { return (sqlite.prepare(this.sql).get(...this.values) as T) || null; }
    async all<T>() { return { results: sqlite.prepare(this.sql).all(...this.values) as T[] }; }
    execute() { return { meta: { changes: Number(sqlite.prepare(this.sql).run(...this.values).changes) } }; }
    async run() { return this.execute(); }
  }
  const db: DemoDatabase = {
    prepare: sql => new Statement(sql),
    async batch(statements) {
      sqlite.exec('BEGIN');
      try { const result = statements.map(statement => (statement as Statement).execute()); sqlite.exec('COMMIT'); return result; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  return { sqlite, db, store: new D1DemoStore(db), close: () => sqlite.close() };
}

export const context = { source: '/carrier', landingPage: 'https://www.datadocks.com/carrier?utm_source=test', firstTouch: { utm_source: 'test' } };
export function testLead(overrides: Partial<Lead> = {}): Lead {
  return { id: 'a'.repeat(64), sessionHash: 'session', captureKey: 'capture-key', email: 'buyer@gmail.com', context,
    phase: 'capture', createdAt: 1000000, operationStartedAt: 1000000, nextAttemptAt: 0, attempts: 0, ...overrides };
}
export function person(email = 'buyer@gmail.com'): Subscriber {
  return { uuid: 'stable-person', email, fields: { utm_source: 'first' }, unsubscribedAt: '2025-01-01', tags: ['customer'] };
}
export function fakeBento() {
  const people = new Map<string, Subscriber>();
  const find = vi.fn(async (query: { email: string } | { uuid: string }) => {
    const found = [...people.values()].find(item => 'uuid' in query ? item.uuid === query.uuid : item.email === query.email);
    return found ? structuredClone(found) : null;
  });
  const capture = vi.fn(async (lead: Lead) => {
    const existing = [...people.values()].find(item => item.email === lead.email);
    const saved = existing || { ...person(lead.email), uuid: `person-${lead.id}` };
    saved.fields[CAPTURE_FIELD] = lead.id;
    if (!lead.preexisting && needsWorkEmail(lead.email)) saved.fields[PERSONAL_FIELD] = lead.email;
    people.set(saved.uuid, saved);
  });
  const changeEmail = vi.fn(async (oldEmail: string, newEmail: string) => {
    const saved = [...people.values()].find(item => item.email === oldEmail);
    if (!saved) throw new Error('missing');
    saved.email = newEmail;
  });
  const captureWork = vi.fn(async (lead: Lead) => {
    const existing = [...people.values()].find(item => item.email === lead.workEmail);
    const saved = existing || { ...person(lead.workEmail!), uuid: `work-${lead.id}` };
    saved.fields[CAPTURE_FIELD] = `${lead.id}:work`;
    if (!saved.fields[PERSONAL_FIELD]) saved.fields[PERSONAL_FIELD] = lead.email;
    people.set(saved.uuid, saved);
  });
  return { people, find, capture, captureWork, changeEmail };
}

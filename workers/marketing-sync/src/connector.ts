import type { MetricRow, Month, SourceId } from '../../../src/lib/marketing-dashboard/types';
import type { Env } from './env';

export type { MetricRow, Month, SourceId };

/**
 * Contract every source implements.
 *
 * `sync` receives the months to refresh (oldest first, current month last)
 * and returns monthly totals as raw, summable metrics. Metric names must
 * match `metrics` in src/lib/marketing-dashboard/sources.ts. Rows returned
 * replace existing rows for the same (month, source, metric, dimension).
 */
export interface Connector {
  source: SourceId;
  /** Secrets that must all be set before this connector runs. */
  requiredSecrets: (keyof Env)[];
  sync(env: Env, months: Month[]): Promise<MetricRow[]>;
}

export class NotImplementedError extends Error {
  constructor(source: SourceId) {
    super(`${source} connector not implemented yet`);
  }
}

/** First and last calendar day of a month as 'YYYY-MM-DD'. */
export function monthBounds(month: Month): { start: string; end: string } {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${month}-01`, end: `${month}-${String(last).padStart(2, '0')}` };
}

/** The `count` most recent months, oldest first, ending with the current month. */
export function recentMonths(count: number, now = new Date()): Month[] {
  const out: Month[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

/** 'YYYY-MM-DD' or ISO timestamp -> 'YYYY-MM'. */
export const toMonth = (date: string): Month => date.slice(0, 7);

/** Adds `value` into a month/metric/dimension bucket. Use when rolling daily rows up to months. */
export class MonthlyAccumulator {
  private buckets = new Map<string, MetricRow>();
  constructor(private source: SourceId) {}

  add(month: Month, metric: string, value: number, dimension = '') {
    const key = `${month}|${metric}|${dimension}`;
    const row = this.buckets.get(key) ?? { month, source: this.source, metric, dimension, value: 0 };
    row.value += value;
    this.buckets.set(key, row);
  }

  rows(): MetricRow[] {
    return [...this.buckets.values()];
  }
}

/** Standard OAuth 2 refresh-token exchange. Returns a short-lived access token. */
export async function refreshAccessToken(opts: {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  scope?: string;
}): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    refresh_token: opts.refreshToken,
  });
  if (opts.scope) body.set('scope', opts.scope);
  const res = await fetch(opts.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Token refresh failed (${res.status}): ${await res.text()}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

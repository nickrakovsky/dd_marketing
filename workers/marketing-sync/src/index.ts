import type { Connector, MetricRow, Month } from './connector';
import { NotImplementedError, recentMonths } from './connector';
import type { Env } from './env';
import { bingWebmaster } from './connectors/bing-webmaster';
import { blog } from './connectors/blog';
import { calendly } from './connectors/calendly';
import { chatgptAds } from './connectors/chatgpt-ads';
import { email } from './connectors/email';
import { googleAds } from './connectors/google-ads';
import { googleSearchConsole } from './connectors/google-search-console';
import { linkedinAds } from './connectors/linkedin-ads';
import { microsoftAds } from './connectors/microsoft-ads';
import { youtube } from './connectors/youtube';

const CONNECTORS: Connector[] = [
  calendly,
  googleAds,
  microsoftAds,
  linkedinAds,
  chatgptAds,
  googleSearchConsole,
  bingWebmaster,
  youtube,
  email,
  blog,
];

/** Daily runs refresh last month too, since ad platforms restate conversions. */
const DAILY_MONTHS = 2;

type Outcome = { source: string; status: 'ok' | 'skipped' | 'error'; rows?: number; detail?: string };

async function runConnector(env: Env, c: Connector, months: Month[]): Promise<Outcome> {
  const missing = c.requiredSecrets.filter((k) => !env[k]);
  if (missing.length) return { source: c.source, status: 'skipped', detail: `missing ${missing.join(', ')}` };

  const now = new Date().toISOString();
  try {
    const rows = await c.sync(env, months);
    await writeRows(env.MARKETING_DB, rows, months, now);
    await env.MARKETING_DB.prepare(
      `INSERT INTO sync_status (source, last_success_at, last_error, last_attempt_at) VALUES (?1, ?2, NULL, ?2)
       ON CONFLICT(source) DO UPDATE SET last_success_at = ?2, last_error = NULL, last_attempt_at = ?2`,
    )
      .bind(c.source, now)
      .run();
    return { source: c.source, status: 'ok', rows: rows.length };
  } catch (err) {
    if (err instanceof NotImplementedError) return { source: c.source, status: 'skipped', detail: err.message };
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[marketing-sync] ${c.source} failed:`, message);
    await env.MARKETING_DB.prepare(
      `INSERT INTO sync_status (source, last_success_at, last_error, last_attempt_at) VALUES (?1, NULL, ?2, ?3)
       ON CONFLICT(source) DO UPDATE SET last_error = ?2, last_attempt_at = ?3`,
    )
      .bind(c.source, message.slice(0, 500), now)
      .run();
    return { source: c.source, status: 'error', detail: message };
  }
}

/**
 * Replaces every row for the sources returned, within the synced months,
 * in one transaction. Deleting first clears breakdowns that dropped to zero.
 */
async function writeRows(db: D1Database, rows: MetricRow[], months: Month[], now: string) {
  const sources = [...new Set(rows.map((r) => r.source))];
  const placeholders = months.map((_, i) => `?${i + 2}`).join(', ');
  const statements = [
    ...sources.map((s) =>
      db.prepare(`DELETE FROM marketing_metrics WHERE source = ?1 AND month IN (${placeholders})`).bind(s, ...months),
    ),
    ...rows
      .filter((r) => months.includes(r.month))
      .map((r) =>
        db
          .prepare(
            `INSERT INTO marketing_metrics (month, source, metric, dimension, value, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(month, source, metric, dimension) DO UPDATE SET value = ?5, updated_at = ?6`,
          )
          .bind(r.month, r.source, r.metric, r.dimension, r.value, now),
      ),
  ];
  if (statements.length) await db.batch(statements);
}

async function runAll(env: Env, months: Month[], only?: string): Promise<Outcome[]> {
  const targets = only ? CONNECTORS.filter((c) => c.source === only) : CONNECTORS;
  // Sequential keeps us well inside per-invocation subrequest limits.
  const outcomes: Outcome[] = [];
  for (const c of targets) outcomes.push(await runConnector(env, c, months));
  return outcomes;
}

export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runAll(env, recentMonths(DAILY_MONTHS)).then((o) => console.log(JSON.stringify(o))));
  },

  /**
   * Manual run / backfill:
   *   curl -X POST -H "Authorization: Bearer $SYNC_TRIGGER_TOKEN" \
   *     "https://marketing-sync.<subdomain>.workers.dev/run?months=18&source=google_ads"
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/run') return new Response('Not found', { status: 404 });
    if (!env.SYNC_TRIGGER_TOKEN || request.headers.get('Authorization') !== `Bearer ${env.SYNC_TRIGGER_TOKEN}`) {
      return new Response('Unauthorized', { status: 401 });
    }
    const count = Math.min(24, Math.max(1, Number(url.searchParams.get('months')) || DAILY_MONTHS));
    const outcomes = await runAll(env, recentMonths(count), url.searchParams.get('source') ?? undefined);
    return Response.json(outcomes);
  },
} satisfies ExportedHandler<Env>;

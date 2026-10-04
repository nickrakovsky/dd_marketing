import type { DashboardData, MetricRow, SyncStatus } from './types';
import { buildMockData } from './mock-data';

/**
 * Loads dashboard data from D1 when the MARKETING_DB binding exists,
 * otherwise falls back to sample data so the page works before setup.
 *
 * Schema: workers/marketing-sync/migrations/0001_init.sql
 */

/** The slice of the D1 binding this module uses. */
interface D1Like {
  prepare(sql: string): {
    all<T>(): Promise<{ results: T[] }>;
  };
}

export interface DashboardEnv {
  MARKETING_DB?: D1Like;
}

export async function loadDashboardData(env: DashboardEnv | undefined): Promise<DashboardData> {
  const generatedAt = new Date().toISOString();
  const db = env?.MARKETING_DB;

  if (!db) {
    const { rows, sync } = buildMockData();
    return { rows, sync, isMock: true, generatedAt };
  }

  const [metrics, runs] = await Promise.all([
    db
      .prepare('SELECT month, source, metric, dimension, value FROM marketing_metrics ORDER BY month')
      .all<MetricRow>(),
    db
      .prepare('SELECT source, last_success_at AS lastSuccessAt, last_error AS lastError FROM sync_status')
      .all<SyncStatus>(),
  ]);

  return { rows: metrics.results, sync: runs.results, isMock: false, generatedAt };
}

/**
 * Shared types for the internal marketing KPI dashboard.
 *
 * Storage model: one row per (month, source, metric, dimension). Only raw,
 * summable counts are stored. Rates (CTR, open rate, cost per demo) are
 * derived at display time so they stay correct when months are combined.
 */

/** Calendar month in `YYYY-MM` form. */
export type Month = string;

export type SourceId =
  | 'google_ads'
  | 'microsoft_ads'
  | 'linkedin_ads'
  | 'chatgpt_ads'
  | 'google_search_console'
  | 'bing_webmaster'
  | 'youtube'
  | 'email'
  | 'blog'
  | 'calendly';

export interface MetricRow {
  month: Month;
  source: SourceId;
  metric: string;
  /** Optional breakdown key, e.g. the channel a demo is attributed to. Empty string when unused. */
  dimension: string;
  value: number;
}

export interface SyncStatus {
  source: SourceId;
  /** ISO timestamp of the last successful sync, or null if never synced. */
  lastSuccessAt: string | null;
  /** Last error message, cleared on the next successful sync. */
  lastError: string | null;
}

export interface DashboardData {
  rows: MetricRow[];
  sync: SyncStatus[];
  /** True while the page is showing generated sample data instead of D1. */
  isMock: boolean;
  /** ISO timestamp the payload was built. */
  generatedAt: string;
}

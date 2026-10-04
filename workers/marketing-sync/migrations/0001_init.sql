-- Marketing KPI dashboard storage.
-- One row per (month, source, metric, dimension). Raw summable counts only;
-- rates are derived in the dashboard so multi-month totals stay correct.

CREATE TABLE IF NOT EXISTS marketing_metrics (
  month      TEXT NOT NULL,              -- 'YYYY-MM'
  source     TEXT NOT NULL,              -- SourceId, e.g. 'google_ads'
  metric     TEXT NOT NULL,              -- e.g. 'spend', 'clicks', 'demos_booked'
  dimension  TEXT NOT NULL DEFAULT '',   -- breakdown key, '' for the total
  value      REAL NOT NULL,
  updated_at TEXT NOT NULL,              -- ISO timestamp of the sync that wrote it
  PRIMARY KEY (month, source, metric, dimension)
);

CREATE INDEX IF NOT EXISTS idx_marketing_metrics_month ON marketing_metrics (month);

CREATE TABLE IF NOT EXISTS sync_status (
  source          TEXT PRIMARY KEY,
  last_success_at TEXT,
  last_error      TEXT,
  last_attempt_at TEXT NOT NULL
);

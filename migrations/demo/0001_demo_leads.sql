-- Apply only to the dedicated demo database during the live-test setup.
CREATE TABLE demo_leads (
  id TEXT PRIMARY KEY,
  session_hash TEXT NOT NULL,
  capture_key TEXT NOT NULL,
  email TEXT NOT NULL,
  phase TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  next_attempt_at INTEGER NOT NULL,
  lease_id TEXT,
  lease_until INTEGER NOT NULL DEFAULT 0,
  UNIQUE(session_hash, capture_key)
);
CREATE INDEX demo_leads_due ON demo_leads(phase, next_attempt_at);
CREATE INDEX demo_leads_session ON demo_leads(session_hash, created_at);
CREATE TABLE demo_identity_claims (
  email_key TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES demo_leads(id)
);
CREATE TABLE demo_operation_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id TEXT NOT NULL REFERENCES demo_leads(id),
  occurred_at INTEGER NOT NULL,
  phase TEXT NOT NULL,
  reason TEXT
);
CREATE INDEX demo_audit_lead ON demo_operation_audit(lead_id, occurred_at);
CREATE TABLE demo_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS demo_bookings (
  id TEXT PRIMARY KEY, session_hash TEXT NOT NULL, attempt_key TEXT NOT NULL,
  phase TEXT NOT NULL, invitee_uri TEXT UNIQUE, payload TEXT NOT NULL,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, next_attempt_at INTEGER NOT NULL,
  lease_id TEXT, lease_until INTEGER NOT NULL DEFAULT 0,
  UNIQUE(session_hash, attempt_key)
);
CREATE INDEX IF NOT EXISTS demo_bookings_due ON demo_bookings(phase, next_attempt_at);
CREATE INDEX IF NOT EXISTS demo_bookings_created ON demo_bookings(created_at);
CREATE TABLE IF NOT EXISTS demo_booking_audit (
  id INTEGER PRIMARY KEY, booking_id TEXT NOT NULL, occurred_at INTEGER NOT NULL,
  phase TEXT NOT NULL, reason TEXT, outcome TEXT
);
CREATE INDEX IF NOT EXISTS demo_booking_audit_booking ON demo_booking_audit(booking_id, occurred_at);

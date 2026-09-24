CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  province TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  severity TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS redactions (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  replacement TEXT NOT NULL,
  reason TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_redactions_case ON redactions(case_id);

CREATE TABLE IF NOT EXISTS agent_steps (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  agent TEXT NOT NULL,
  detail TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_steps_case ON agent_steps(case_id, seq);

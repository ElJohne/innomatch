CREATE TABLE IF NOT EXISTS catalog_controls (
  record_type text NOT NULL CHECK (record_type IN ('innovation','knowledge')),
  record_id text NOT NULL,
  managed_locally boolean NOT NULL DEFAULT true,
  content_hash text NOT NULL,
  index_pending boolean NOT NULL DEFAULT true,
  reviewed_at timestamptz,
  updated_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (record_type, record_id)
);
CREATE TABLE IF NOT EXISTS audit_events (
  id text PRIMARY KEY,
  actor_id text NOT NULL,
  action text NOT NULL,
  object_type text NOT NULL,
  object_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS owner_recovery (
  owner_id text PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL
);

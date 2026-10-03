CREATE TABLE IF NOT EXISTS innovations (
  id text PRIMARY KEY,
  record jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS needs (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  input jsonb NOT NULL,
  request_key text NOT NULL,
  match jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS need_owner_request ON needs(owner_id, request_key);
CREATE INDEX IF NOT EXISTS need_owner_created ON needs(owner_id, created_at);
CREATE TABLE IF NOT EXISTS embeddings (
  record_id text PRIMARY KEY REFERENCES innovations(id),
  record jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS request_counters (key text PRIMARY KEY, count integer NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS ai_usage (
  id text PRIMARY KEY, operation text NOT NULL, deployment text NOT NULL,
  input_tokens integer NOT NULL, output_tokens integer NOT NULL,
  latency_ms integer NOT NULL, status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ideas (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  request_key text NOT NULL,
  input_hash text NOT NULL,
  record jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, request_key)
);
CREATE INDEX IF NOT EXISTS ideas_owner ON ideas(owner_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS idea_assists (
  idea_id text NOT NULL REFERENCES ideas(id),
  revision integer NOT NULL,
  state text NOT NULL CHECK (state IN ('generating','ready','failed')),
  attempt_id text NOT NULL,
  result jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(idea_id,revision)
);
ALTER TABLE threads ADD COLUMN IF NOT EXISTS idea_id text REFERENCES ideas(id);
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_check;
ALTER TABLE threads ADD CONSTRAINT threads_context_check CHECK (num_nonnulls(need_id,innovation_id,idea_id)=1);

CREATE TABLE IF NOT EXISTS adaptations (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  need_id text NOT NULL REFERENCES needs(id),
  innovation_id text NOT NULL REFERENCES innovations(id),
  request_key text NOT NULL,
  input_hash text NOT NULL,
  state text NOT NULL CHECK (state IN ('generating','ready','failed')),
  attempt_id text NOT NULL,
  record jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, request_key)
);
CREATE INDEX IF NOT EXISTS adaptations_owner ON adaptations(owner_id, updated_at DESC);
ALTER TABLE threads ADD COLUMN IF NOT EXISTS adaptation_id text REFERENCES adaptations(id);
-- Adaptation conversations retain their need context and the existing XOR constraint.

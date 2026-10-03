CREATE TABLE IF NOT EXISTS pilot_participations (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  innovation_id text NOT NULL REFERENCES innovations(id),
  record jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id,innovation_id)
);
CREATE TABLE IF NOT EXISTS innovation_feedback (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  innovation_id text NOT NULL REFERENCES innovations(id),
  record jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id,innovation_id)
);
CREATE INDEX IF NOT EXISTS feedback_innovation ON innovation_feedback(innovation_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS feedback_status ON innovation_feedback((record->>'status'),updated_at DESC);

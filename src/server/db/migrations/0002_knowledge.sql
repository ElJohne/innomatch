CREATE TABLE IF NOT EXISTS knowledge_resources (
  id text PRIMARY KEY,
  record jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  record_id text PRIMARY KEY REFERENCES knowledge_resources(id),
  record jsonb NOT NULL
);

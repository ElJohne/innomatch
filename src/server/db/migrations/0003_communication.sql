CREATE TABLE IF NOT EXISTS staff_users (
  id text PRIMARY KEY,
  login text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN', 'EXPERT')),
  active boolean NOT NULL DEFAULT true,
  auth_version integer NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS threads (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  need_id text REFERENCES needs(id),
  innovation_id text REFERENCES innovations(id),
  context_key text NOT NULL,
  user_read integer NOT NULL DEFAULT 0,
  staff_read integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((need_id IS NOT NULL) <> (innovation_id IS NOT NULL)),
  UNIQUE (owner_id, context_key)
);
CREATE TABLE IF NOT EXISTS messages (
  id text PRIMARY KEY,
  sequence serial UNIQUE NOT NULL,
  thread_id text NOT NULL REFERENCES threads(id),
  author_id text NOT NULL,
  author_role text NOT NULL CHECK (author_role IN ('USER', 'STAFF')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  request_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, author_id, request_key)
);
CREATE INDEX IF NOT EXISTS threads_owner_updated ON threads (owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS messages_thread_sequence ON messages (thread_id, sequence);

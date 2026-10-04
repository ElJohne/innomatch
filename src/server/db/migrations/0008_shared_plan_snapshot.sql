-- Freeze the last visible revision of existing conversations. New revisions
-- are shared only by an explicit owner action, never by editing the plan.
ALTER TABLE threads ADD COLUMN IF NOT EXISTS adaptation_snapshot jsonb;
UPDATE threads t SET adaptation_snapshot = a.record
FROM adaptations a
WHERE t.adaptation_id = a.id AND t.adaptation_snapshot IS NULL
  AND a.state = 'ready';

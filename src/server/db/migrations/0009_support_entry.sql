-- Private coordinator requests entered directly from Testowanie i współpraca.
-- Preserve the existing context invariant for all linked conversations.
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_context_check;
ALTER TABLE threads ADD CONSTRAINT threads_context_check CHECK (
  (num_nonnulls(need_id, innovation_id, idea_id) = 1 AND context_key NOT LIKE 'support:%')
  OR (
    num_nonnulls(need_id, innovation_id, idea_id, adaptation_id) = 0
    AND context_key ~ '^support:(CONSULTATION|MENTORSHIP|PARTNERSHIP):[0-9a-fA-F-]{36}$'
  )
);

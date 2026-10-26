-- Add optional ownership to issues. Existing civic records remain unowned.
-- Requires database/migrations/001_authentication.sql first.
BEGIN;

ALTER TABLE issues
  ADD COLUMN IF NOT EXISTS reporter_user_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_issues_reporter_user'
      AND conrelid = 'issues'::regclass
  ) THEN
    ALTER TABLE issues
      ADD CONSTRAINT fk_issues_reporter_user
      FOREIGN KEY (reporter_user_id)
      REFERENCES app_users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_issues_reporter_user_id
  ON issues(reporter_user_id);

COMMIT;

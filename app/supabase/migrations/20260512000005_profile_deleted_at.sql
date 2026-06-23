-- Soft-delete for profiles: set deleted_at to request account deletion.
-- A scheduled job (or manual process) permanently removes auth users after 30 days.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles (deleted_at) WHERE deleted_at IS NOT NULL;

-- Spot moderation: pending → approved → rejected
-- Existing spots are grandfathered in as 'approved' so they stay live.
-- New spots inserted from the app use 'pending' and are hidden from
-- public queries until manually approved via Supabase dashboard or admin tooling.

ALTER TABLE spots
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved'
  CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

-- Index for the two common public filters
CREATE INDEX IF NOT EXISTS idx_spots_moderation ON spots (moderation_status, active);

-- Convenience: approve a spot
-- UPDATE spots SET moderation_status = 'approved' WHERE id = '<uuid>';

-- Convenience: reject a spot
-- UPDATE spots SET moderation_status = 'rejected', active = false WHERE id = '<uuid>';

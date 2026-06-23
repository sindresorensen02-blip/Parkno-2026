-- ─────────────────────────────────────────────
-- PERFORMANCE INDEXES
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_spots_feed
  ON spots (active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_spots_owner
  ON spots (owner_id);

CREATE INDEX IF NOT EXISTS idx_reservations_renter_status
  ON reservations (renter_id, status);

CREATE INDEX IF NOT EXISTS idx_reservations_availability
  ON reservations (spot_id, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_saved_spots_user
  ON saved_spots (user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_spot
  ON reviews (spot_id);

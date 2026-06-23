C52D5TBW47
-- ─────────────────────────────────────────────
-- SPOT RATING DENORMALIZATION
-- ─────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spots' AND column_name = 'avg_rating'
  ) THEN
    ALTER TABLE spots ADD COLUMN avg_rating numeric(3,1) DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spots' AND column_name = 'review_count'
  ) THEN
    ALTER TABLE spots ADD COLUMN review_count int DEFAULT 0;
  END IF;
END $$;

-- Backfill from existing reviews
UPDATE spots s
SET
  avg_rating   = COALESCE((
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM reviews r WHERE r.spot_id = s.id
  ), 0),
  review_count = (
    SELECT COUNT(*) FROM reviews r WHERE r.spot_id = s.id
  );

-- Function to keep avg_rating / review_count in sync
CREATE OR REPLACE FUNCTION sync_spot_rating()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_spot_id uuid;
BEGIN
  v_spot_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.spot_id ELSE NEW.spot_id END;

  UPDATE spots
  SET
    avg_rating   = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE spot_id = v_spot_id
    ), 0),
    review_count = (
      SELECT COUNT(*) FROM reviews WHERE spot_id = v_spot_id
    )
  WHERE id = v_spot_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_spot_rating ON reviews;
CREATE TRIGGER trg_sync_spot_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION sync_spot_rating();

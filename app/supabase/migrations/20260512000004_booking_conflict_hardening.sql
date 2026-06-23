-- ─────────────────────────────────────────────────────────────────────────────
-- BOOKING CONFLICT HARDENING
-- Adds three layers on top of the existing INSERT trigger:
--   1. btree_gist exclusion constraint  — atomic, race-condition-proof
--   2. UPDATE trigger                   — blocks extend-into-conflict
--   3. check_spot_availability_for_update RPC — pre-flight for extend UX
-- ─────────────────────────────────────────────────────────────────────────────

-- Needed for the exclusion constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Exclusion constraint: no two active reservations for the same spot
-- may have overlapping [starts_at, ends_at) ranges.
-- This is enforced atomically at the storage level — immune to race conditions.
ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS no_overlap_booking;

ALTER TABLE reservations
  ADD CONSTRAINT no_overlap_booking
  EXCLUDE USING gist (
    spot_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  )
  WHERE (status IN ('confirmed', 'pending'));

-- Extend the double-booking check to cover UPDATE (for booking extensions)
CREATE OR REPLACE FUNCTION prevent_double_booking_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Only re-check if the time window or status changed
  IF NEW.ends_at = OLD.ends_at AND NEW.starts_at = OLD.starts_at AND NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'ends_at må være etter starts_at'
      USING ERRCODE = 'P0001';
  END IF;

  -- Check for overlap with *other* reservations on the same spot
  IF EXISTS (
    SELECT 1 FROM reservations
    WHERE spot_id = NEW.spot_id
      AND id      <> NEW.id
      AND status  IN ('confirmed', 'pending')
      AND starts_at < NEW.ends_at
      AND ends_at   > NEW.starts_at
  ) THEN
    RAISE EXCEPTION 'Parkeringsplassen er ikke tilgjengelig for valgt tidspunkt'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_double_booking_update ON reservations;
CREATE TRIGGER trg_prevent_double_booking_update
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION prevent_double_booking_update();

-- RPC variant that excludes a specific reservation id (used by extend pre-flight)
CREATE OR REPLACE FUNCTION check_spot_availability_excluding(
  p_spot_id      uuid,
  p_starts_at    timestamptz,
  p_ends_at      timestamptz,
  p_exclude_id   uuid
) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM reservations
    WHERE spot_id = p_spot_id
      AND id      <> p_exclude_id
      AND status  IN ('confirmed', 'pending')
      AND starts_at < p_ends_at
      AND ends_at   > p_starts_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_spot_availability_excluding(uuid, timestamptz, timestamptz, uuid)
  TO authenticated, anon;

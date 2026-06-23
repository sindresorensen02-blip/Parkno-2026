-- ─────────────────────────────────────────────
-- DOUBLE-BOOKING PREVENTION
-- ─────────────────────────────────────────────

-- Returns TRUE if the slot is free, FALSE if taken
CREATE OR REPLACE FUNCTION check_spot_availability(
  p_spot_id   uuid,
  p_starts_at timestamptz,
  p_ends_at   timestamptz
) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM reservations
    WHERE spot_id = p_spot_id
      AND status IN ('confirmed', 'pending')
      AND starts_at < p_ends_at
      AND ends_at   > p_starts_at
  );
END;
$$;

-- Trigger function: validates time order + availability before insert
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'ends_at må være etter starts_at'
      USING ERRCODE = 'P0001',
            DETAIL  = 'ends_at must be strictly after starts_at';
  END IF;

  IF NOT check_spot_availability(NEW.spot_id, NEW.starts_at, NEW.ends_at) THEN
    RAISE EXCEPTION 'Parkeringsplassen er ikke tilgjengelig for valgt tidspunkt'
      USING ERRCODE = 'P0001',
            DETAIL  = 'Another confirmed or pending reservation overlaps this window';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_double_booking ON reservations;
CREATE TRIGGER trg_prevent_double_booking
  BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION prevent_double_booking();

-- Expose function to client via RPC
GRANT EXECUTE ON FUNCTION check_spot_availability(uuid, timestamptz, timestamptz) TO authenticated, anon;

-- ─────────────────────────────────────────────
-- SECURITY HARDENING
-- ─────────────────────────────────────────────


-- ── 7a: Rate limit — max 10 reservations per hour per user ──────────────────

CREATE OR REPLACE FUNCTION check_reservation_rate_limit()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM reservations
  WHERE renter_id = auth.uid()
    AND created_at > now() - interval '1 hour';

  IF v_count >= 10 THEN
    RAISE EXCEPTION 'Grense nådd: maks 10 bestillinger per time er tillatt'
      USING ERRCODE = 'P0001',
            DETAIL  = 'Rate limit exceeded: max 10 bookings per hour';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservation_rate_limit ON reservations;
CREATE TRIGGER trg_reservation_rate_limit
  BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION check_reservation_rate_limit();


-- ── 7b: Lock down profiles.role — cannot be changed after creation ───────────

-- Drop the existing broad update policy if it exists
DROP POLICY IF EXISTS "profiles: own update" ON profiles;

-- Trigger that blocks role changes
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Brukerrollen kan ikke endres etter registrering'
      USING ERRCODE = 'P0001',
            DETAIL  = 'The role column is immutable after account creation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_change ON profiles;
CREATE TRIGGER trg_prevent_role_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_change();

-- Recreate update policy limited to safe columns only
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ── 7c: Reviews rating constraint ───────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_rating_check'
      AND conrelid = 'reviews'::regclass
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check
      CHECK (rating BETWEEN 1 AND 5);
  END IF;
END $$;


-- ── 7d: Reservations time-order constraint ───────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reservations_time_order'
      AND conrelid = 'reservations'::regclass
  ) THEN
    ALTER TABLE reservations ADD CONSTRAINT reservations_time_order
      CHECK (ends_at > starts_at);
  END IF;
END $$;


-- ── 7e: Manual step reminder ─────────────────────────────────────────────────
-- MANUAL STEP REQUIRED: In the Supabase dashboard → Authentication → Providers → Email,
-- enable "Confirm email" so new users must verify their address before signing in.
-- This cannot be configured via SQL migrations.

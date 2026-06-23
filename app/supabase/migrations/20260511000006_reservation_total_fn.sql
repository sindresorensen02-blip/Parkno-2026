-- ─────────────────────────────────────────────
-- RESERVATION TOTAL FUNCTION
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION calculate_reservation_total(
  p_price_per_hour numeric,
  p_duration_mins  int
) RETURNS TABLE (
  price_subtotal numeric(10,2),
  booking_fee    numeric(10,2),
  total          numeric(10,2)
) LANGUAGE plpgsql AS $$
DECLARE
  v_subtotal numeric(10,2);
  v_fee      numeric(10,2);
BEGIN
  v_subtotal := ROUND((p_price_per_hour / 60.0) * p_duration_mins, 2);
  v_fee      := ROUND(v_subtotal * 0.18, 2);

  RETURN QUERY SELECT v_subtotal, v_fee, v_subtotal + v_fee;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_reservation_total(numeric, int) TO authenticated, anon;

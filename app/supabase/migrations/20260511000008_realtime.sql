-- ─────────────────────────────────────────────
-- REALTIME
-- ─────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE reservations;

-- MANUAL STEP REQUIRED: In Supabase dashboard → Database → Replication,
-- confirm the `reservations` table appears under supabase_realtime.
-- Set replication mode to FULL if you need old/new row values in your
-- React Native subscription handler (needed for status change events).

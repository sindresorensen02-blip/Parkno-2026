-- ─────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true, 2097152,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'spot-photos', 'spot-photos', true, 5242880,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ─────────────────────────────────────────────
-- RLS POLICIES — avatars
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "avatars: public read"      ON storage.objects;
DROP POLICY IF EXISTS "avatars: owner insert"     ON storage.objects;
DROP POLICY IF EXISTS "avatars: owner update"     ON storage.objects;
DROP POLICY IF EXISTS "avatars: owner delete"     ON storage.objects;

CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars: owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ─────────────────────────────────────────────
-- RLS POLICIES — spot-photos
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "spot-photos: public read"  ON storage.objects;
DROP POLICY IF EXISTS "spot-photos: owner insert" ON storage.objects;
DROP POLICY IF EXISTS "spot-photos: owner update" ON storage.objects;
DROP POLICY IF EXISTS "spot-photos: owner delete" ON storage.objects;

CREATE POLICY "spot-photos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'spot-photos');

CREATE POLICY "spot-photos: owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'spot-photos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "spot-photos: owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'spot-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "spot-photos: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'spot-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ─────────────────────────────────────────────
-- TRIGGER — max 5 photos per spot
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION storage.check_spot_photo_limit()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_owner_id text;
  v_spot_id  text;
  v_count    int;
  v_parts    text[];
BEGIN
  IF NEW.bucket_id <> 'spot-photos' THEN
    RETURN NEW;
  END IF;

  v_parts    := string_to_array(NEW.name, '/');
  v_owner_id := v_parts[1];
  v_spot_id  := v_parts[2];

  SELECT COUNT(*) INTO v_count
  FROM storage.objects
  WHERE bucket_id = 'spot-photos'
    AND name LIKE v_owner_id || '/' || v_spot_id || '/%';

  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Maks 5 bilder per parkeringsplass er tillatt'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_spot_photo_limit ON storage.objects;
CREATE TRIGGER trg_spot_photo_limit
  BEFORE INSERT ON storage.objects
  FOR EACH ROW EXECUTE FUNCTION storage.check_spot_photo_limit();

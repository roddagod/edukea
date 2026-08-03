-- =============================================================================
-- 00056 — Bucket Storage pour branding ecole (logo + signature)
-- =============================================================================
-- Un seul bucket public 'school-branding' pour :
--   - schools/{school_id}/logo.{ext}
--   - schools/{school_id}/director-signature.{ext}
-- Public en lecture (les logos apparaissent sur bulletins et recus PDF), les
-- ecritures sont restreintes au staff de l'ecole via RLS.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-branding',
  'school-branding',
  true,
  2 * 1024 * 1024, -- 2 MB max
  ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Policies : lecture publique, ecriture reservee au staff de l'ecole
-- Les fichiers sont dans un dossier 'schools/{school_id}/...'
-- On extrait school_id via split_part(name, '/', 2)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "school_branding_public_read" ON storage.objects;
CREATE POLICY "school_branding_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'school-branding');

DROP POLICY IF EXISTS "school_branding_staff_write" ON storage.objects;
CREATE POLICY "school_branding_staff_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'school-branding'
    AND (
      is_admin()
      OR split_part(name, '/', 2) = get_school_staff_school_id()
    )
  );

DROP POLICY IF EXISTS "school_branding_staff_update" ON storage.objects;
CREATE POLICY "school_branding_staff_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'school-branding'
    AND (
      is_admin()
      OR split_part(name, '/', 2) = get_school_staff_school_id()
    )
  );

DROP POLICY IF EXISTS "school_branding_staff_delete" ON storage.objects;
CREATE POLICY "school_branding_staff_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'school-branding'
    AND (
      is_admin()
      OR split_part(name, '/', 2) = get_school_staff_school_id()
    )
  );

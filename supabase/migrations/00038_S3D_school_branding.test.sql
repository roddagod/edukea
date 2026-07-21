-- Test verification for 00038_S3D_school_branding
-- Expected before migration: 0 rows
-- Expected after migration: 13 rows, all with pass = true

SELECT c.column_name, COUNT(*) = 1 AS pass
FROM information_schema.columns c
WHERE c.table_name = 'schools' AND c.column_name IN (
  'display_name', 'motto', 'address', 'postal_address', 'phone', 'email',
  'accreditation_number', 'accent_color', 'logo_url', 'stamp_url',
  'director_signature_url', 'bulletin_config', 'structure_seeded_from'
)
GROUP BY c.column_name;

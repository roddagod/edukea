SELECT 'bulletins.status column exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'bulletins' AND column_name = 'status';

SELECT 'bulletins.current_version column exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'bulletins' AND column_name = 'current_version';

SELECT 'bulletins.annual_average column exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'bulletins' AND column_name = 'annual_average';

SELECT 'bulletin_versions table exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables
WHERE table_name = 'bulletin_versions';

SELECT 'notes_audit table exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables
WHERE table_name = 'notes_audit';

SELECT 'notes.is_exempted column exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'notes' AND column_name = 'is_exempted';

-- Verification queries for migration 00035
-- Should return 0 rows / errors BEFORE migration is applied
SELECT
  'student_types table exists' AS assertion,
  COUNT(*) = 1 AS pass
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'student_types';

SELECT
  'students.student_type_id column exists' AS assertion,
  COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'student_type_id';

SELECT
  'on_school_created trigger exists' AS assertion,
  COUNT(*) = 1 AS pass
FROM information_schema.triggers
WHERE trigger_name = 'on_school_created_seed_student_types';

SELECT p.proname, COUNT(*) = 1 AS pass
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN (
  'generate_default_periodes',
  'copy_fees_between_student_types'
) GROUP BY p.proname;

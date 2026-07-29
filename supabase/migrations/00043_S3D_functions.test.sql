SELECT p.proname, COUNT(*) = 1 AS pass
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN (
  'advance_bulletin_status',
  'allocate_payment_to_installments',
  'seed_pedagogy_for_school',
  'seed_structure_for_school',
  'close_period_for_classrooms',
  'compute_annual_average',
  'apply_level_fees_to_classrooms',
  'trigger_on_level_created'
) GROUP BY p.proname;

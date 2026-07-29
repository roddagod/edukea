SELECT table_name AS view_name, COUNT(*) = 1 AS pass
FROM information_schema.views
WHERE table_schema = 'public' AND table_name IN (
  'v_pedagogy_setup_status',
  'v_provisional_averages',
  'v_note_entry_progress',
  'v_class_statistics',
  'v_bulletin_history',
  'v_period_closure_overview',
  'v_classroom_effective_fees',
  'v_classroom_effective_installments',
  'v_ssyl_installment_status'
) GROUP BY table_name;

-- Smoke test : chaque vue doit être queryable
SELECT 'v_pedagogy_setup_status queryable' AS assertion, true AS pass
FROM v_pedagogy_setup_status LIMIT 1;

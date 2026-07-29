SELECT 'v_fees_overview_matrix exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.views
WHERE table_schema = 'public' AND table_name = 'v_fees_overview_matrix';

SELECT 'v_fees_overview_matrix queryable' AS assertion, true AS pass
FROM v_fees_overview_matrix LIMIT 1;

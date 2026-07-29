SELECT 'schools.default_fee_template exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'schools' AND column_name = 'default_fee_template';

SELECT 'level_fee_lines exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'level_fee_lines';

SELECT 'level_fee_installments exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'level_fee_installments';

SELECT 'classroom_fee_lines exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'classroom_fee_lines';

SELECT 'classroom_fee_installments exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'classroom_fee_installments';

SELECT 'payment_allocations exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'payment_allocations';

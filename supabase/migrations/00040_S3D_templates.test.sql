SELECT 'subject_templates table exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'subject_templates';

SELECT 'structure_templates table exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'structure_templates';

SELECT 'appreciation_templates table exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'appreciation_templates';

SELECT 'structure_templates seeded for ivorien_college' AS assertion, COUNT(*) > 0 AS pass
FROM structure_templates WHERE template_key = 'ivorien_college';

SELECT 'subject_templates seeded for ivorien_college' AS assertion, COUNT(*) > 0 AS pass
FROM subject_templates WHERE cycle_code = 'ivorien_college';

SELECT 'appreciation_templates seeded globally' AS assertion, COUNT(*) >= 10 AS pass
FROM appreciation_templates WHERE school_id IS NULL;

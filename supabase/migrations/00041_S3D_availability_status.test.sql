SELECT 'subject_school_year_availability exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'subject_school_year_availability';

SELECT 'classroom_periode_status exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'classroom_periode_status';

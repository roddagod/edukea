SELECT 'teacher_invitations exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'teacher_invitations';

SELECT 'classrooms.principal_teacher_id exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'classrooms' AND column_name = 'principal_teacher_id';

SELECT 'school_years.periode_type exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'school_years' AND column_name = 'periode_type';

SELECT 'teacher_profiles.signature_url exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'teacher_profiles' AND column_name = 'signature_url';

SELECT 'ssyl.is_redoublant exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'student_school_year_loggings' AND column_name = 'is_redoublant';

SELECT 'ssyl.lv2_subject_id exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'student_school_year_loggings' AND column_name = 'lv2_subject_id';

SELECT 'cycles.created_natively exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'cycles' AND column_name = 'created_natively';

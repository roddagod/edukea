SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN (
  'student_types', 'bulletin_versions', 'notes_audit', 'teacher_invitations',
  'level_fee_lines', 'level_fee_installments',
  'classroom_fee_lines', 'classroom_fee_installments',
  'payment_allocations', 'subject_school_year_availability',
  'classroom_periode_status', 'subject_templates', 'structure_templates', 'appreciation_templates'
);

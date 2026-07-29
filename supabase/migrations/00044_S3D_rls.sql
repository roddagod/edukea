-- =========================================================================
-- Migration 00044 — RLS policies (S3D fondations)
--
-- Toutes les nouvelles tables sont scopées par école. On réutilise les
-- helpers existants : get_parent_family_id, get_parent_student_ids,
-- get_parent_school_id, get_school_staff_school_id, is_admin.
-- =========================================================================

ALTER TABLE student_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_fee_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_fee_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_fee_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_fee_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_school_year_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_periode_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE structure_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE appreciation_templates ENABLE ROW LEVEL SECURITY;

-- student_types
CREATE POLICY student_types_school_staff_all ON student_types
  FOR ALL TO authenticated
  USING (is_admin() OR school_id = get_school_staff_school_id())
  WITH CHECK (is_admin() OR school_id = get_school_staff_school_id());

CREATE POLICY student_types_parent_read ON student_types
  FOR SELECT TO authenticated
  USING (school_id = get_parent_school_id());

-- bulletin_versions
CREATE POLICY bulletin_versions_read ON bulletin_versions
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM bulletins b JOIN classrooms cr ON cr.id = b.classroom_id
      JOIN levels l ON l.id = cr.level_id JOIN cycles c ON c.id = l.cycle_id
      WHERE b.id = bulletin_versions.bulletin_id
        AND (c.school_id = get_school_staff_school_id() OR b.student_id IN (SELECT * FROM get_parent_student_ids()))
    )
  );

-- notes_audit
CREATE POLICY notes_audit_staff_read ON notes_audit
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM notes n JOIN evaluations e ON e.id = n.evaluation_id
      JOIN classroom_subjects cs ON cs.id = e.classroom_subject_id
      JOIN classrooms cr ON cr.id = cs.classroom_id
      JOIN levels l ON l.id = cr.level_id JOIN cycles c ON c.id = l.cycle_id
      WHERE n.id = notes_audit.note_id AND c.school_id = get_school_staff_school_id()
    )
  );

-- teacher_invitations
CREATE POLICY teacher_invitations_staff_all ON teacher_invitations
  FOR ALL TO authenticated
  USING (is_admin() OR school_id = get_school_staff_school_id())
  WITH CHECK (is_admin() OR school_id = get_school_staff_school_id());

-- level_fee_lines
CREATE POLICY level_fee_lines_all ON level_fee_lines
  FOR ALL TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM levels l JOIN cycles c ON c.id = l.cycle_id
      WHERE l.id = level_fee_lines.level_id
        AND (c.school_id = get_school_staff_school_id() OR c.school_id = get_parent_school_id())
    )
  );

CREATE POLICY level_fee_installments_all ON level_fee_installments
  FOR ALL TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM levels l JOIN cycles c ON c.id = l.cycle_id
      WHERE l.id = level_fee_installments.level_id
        AND (c.school_id = get_school_staff_school_id() OR c.school_id = get_parent_school_id())
    )
  );

-- classroom_fee_*
CREATE POLICY classroom_fee_lines_all ON classroom_fee_lines
  FOR ALL TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM classrooms cr JOIN levels l ON l.id = cr.level_id JOIN cycles c ON c.id = l.cycle_id
      WHERE cr.id = classroom_fee_lines.classroom_id
        AND (c.school_id = get_school_staff_school_id() OR c.school_id = get_parent_school_id())
    )
  );

CREATE POLICY classroom_fee_installments_all ON classroom_fee_installments
  FOR ALL TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM classrooms cr JOIN levels l ON l.id = cr.level_id JOIN cycles c ON c.id = l.cycle_id
      WHERE cr.id = classroom_fee_installments.classroom_id
        AND (c.school_id = get_school_staff_school_id() OR c.school_id = get_parent_school_id())
    )
  );

-- payment_allocations
CREATE POLICY payment_allocations_read ON payment_allocations
  FOR SELECT TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM ledger_transactions lt WHERE lt.id = payment_allocations.payment_tx_id
        AND (lt.school_id = get_school_staff_school_id() OR lt.school_id = get_parent_school_id())
    )
  );

CREATE POLICY payment_allocations_insert ON payment_allocations
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM ledger_transactions lt WHERE lt.id = payment_allocations.payment_tx_id
        AND lt.school_id = get_school_staff_school_id()
    )
  );

-- subject_school_year_availability
CREATE POLICY ssya_staff_all ON subject_school_year_availability
  FOR ALL TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM subjects s
      WHERE s.id = subject_school_year_availability.subject_id
        AND s.school_id = get_school_staff_school_id()
    )
  );

CREATE POLICY ssya_read ON subject_school_year_availability
  FOR SELECT TO authenticated
  USING (true);

-- classroom_periode_status
CREATE POLICY cps_staff_all ON classroom_periode_status
  FOR ALL TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM classrooms cr JOIN levels l ON l.id = cr.level_id JOIN cycles c ON c.id = l.cycle_id
      WHERE cr.id = classroom_periode_status.classroom_id
        AND c.school_id = get_school_staff_school_id()
    )
  );

-- Templates : lecture publique + write staff
CREATE POLICY subject_templates_read ON subject_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY structure_templates_read ON structure_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY appreciation_templates_read ON appreciation_templates
  FOR SELECT TO authenticated
  USING (school_id IS NULL OR school_id = get_school_staff_school_id() OR school_id = get_parent_school_id());

CREATE POLICY appreciation_templates_staff_all ON appreciation_templates
  FOR ALL TO authenticated
  USING (is_admin() OR school_id = get_school_staff_school_id())
  WITH CHECK (is_admin() OR school_id = get_school_staff_school_id());

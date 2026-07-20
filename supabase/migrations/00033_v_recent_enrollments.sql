-- ============================================================
-- Vue : dernières inscriptions du hub /dashboard/enrollment
-- Liste les SSYL récents créés (élève, classe, montant facturé,
-- type Nouveau/Réinscription) pour affichage dans le hub.
-- ============================================================

CREATE OR REPLACE VIEW v_recent_enrollments AS
SELECT
  ssyl.id                                            AS ssyl_id,
  ssyl.school_id,
  ssyl.school_year_id,
  ssyl.created_at,
  ssyl.is_first_register,
  ssyl.student_id,
  TRIM(BOTH ' ' FROM (COALESCE(st.lastname,'') || ' ' || COALESCE(st.firstname,''))) AS student_name,
  st.matricule,
  cl.name                                            AS classroom_name,
  ssyl.school_fees_total                             AS billed_total,
  CASE WHEN ssyl.is_first_register = 1 THEN 'new' ELSE 'reenroll' END AS enrollment_type
FROM student_school_year_loggings ssyl
LEFT JOIN students   st ON st.id = ssyl.student_id
LEFT JOIN classrooms cl ON cl.id = ssyl.classroom_id
WHERE ssyl.deleted_at IS NULL;

GRANT SELECT ON v_recent_enrollments TO authenticated;

-- ============================================================
-- v_recovery_students : liste elèves pour le module Recouvrement
--
-- Un row par (élève × année scolaire) avec :
--   - identité (nom, matricule, classe, cycle)
--   - facturation : billed_initial (opening balance)
--   - collecté : billed_initial - receivable_balance
--   - restant : receivable_balance (from ledger)
--   - statut : solde / debute / impaye
--
-- La vue s'appuie sur `v_ledger_account_balance` et `v_student_receivable`
-- déjà déployées. RLS des tables sous-jacentes (schools, students, ssyl,
-- classrooms, ledger_*) filtre naturellement au périmètre du user.
-- ============================================================

CREATE OR REPLACE VIEW v_recovery_students AS
WITH opening_per_student AS (
  SELECT
    a.school_id,
    a.school_year_id,
    a.student_ssyl_id,
    a.id AS receivable_account_id,
    COALESCE(SUM(CASE WHEN e.direction = 'debit' THEN e.amount ELSE 0 END), 0) AS billed_initial
  FROM ledger_accounts a
  LEFT JOIN ledger_entries e ON e.account_id = a.id
  LEFT JOIN ledger_transactions t ON t.id = e.transaction_id AND t.ref_type = 'opening' AND t.status = 'posted'
  WHERE a.kind = 'student_receivable' AND a.student_ssyl_id IS NOT NULL
  GROUP BY a.school_id, a.school_year_id, a.student_ssyl_id, a.id
)
SELECT
  ssyl.id                  AS ssyl_id,
  ssyl.school_id,
  ssyl.school_year_id,
  ssyl.student_id,
  st.firstname             AS student_firstname,
  st.lastname              AS student_lastname,
  TRIM(BOTH ' ' FROM (COALESCE(st.lastname, '') || ' ' || COALESCE(st.firstname, ''))) AS student_name,
  st.matricule,
  st.sex                   AS student_sex,
  cl.id                    AS classroom_id,
  cl.name                  AS classroom_name,
  lv.name                  AS level_name,
  cy.name                  AS cycle_name,
  COALESCE(ops.billed_initial, 0)                          AS billed_initial,
  COALESCE(rec.receivable_balance, 0)                      AS remaining,
  COALESCE(ops.billed_initial, 0) - COALESCE(rec.receivable_balance, 0) AS collected,
  CASE
    WHEN COALESCE(rec.receivable_balance, 0) <= 0                                            THEN 'solde'
    WHEN COALESCE(ops.billed_initial, 0) > 0 AND rec.receivable_balance >= ops.billed_initial THEN 'impaye'
    ELSE 'debute'
  END AS status,
  ops.receivable_account_id,
  ssyl.registration_date,
  ssyl.created_at,
  ssyl.updated_at
FROM student_school_year_loggings ssyl
LEFT JOIN students   st ON st.id = ssyl.student_id
LEFT JOIN classrooms cl ON cl.id = ssyl.classroom_id
LEFT JOIN levels     lv ON lv.id = cl.level_id
LEFT JOIN cycles     cy ON cy.id = lv.cycle_id
LEFT JOIN opening_per_student ops ON ops.student_ssyl_id = ssyl.id
LEFT JOIN v_student_receivable rec ON rec.student_ssyl_id = ssyl.id
WHERE ssyl.deleted_at IS NULL;

GRANT SELECT ON v_recovery_students TO authenticated;

-- Index utiles sur les tables sous-jacentes pour accélérer la vue
CREATE INDEX IF NOT EXISTS idx_ssyl_school_year ON student_school_year_loggings(school_id, school_year_id);

-- =========================================================================
-- Migration 00045 — Backfill écoles legacy (sync MySQL) (S3D fondations)
--
-- One-off idempotent : marque la data synchronisée comme non-native,
-- crée les student_types par défaut pour les écoles legacy qui n'en ont pas
-- (le trigger on_school_created ne s'est jamais déclenché pour elles),
-- crée les périodes par défaut de l'année la plus récente si absentes.
-- =========================================================================

-- 1. Marquer la data existante comme non-native (par date de création)
UPDATE cycles SET created_natively = false WHERE created_natively = true AND created_at < '2026-07-01';
UPDATE levels SET created_natively = false WHERE created_natively = true AND created_at < '2026-07-01';
UPDATE classrooms SET created_natively = false WHERE created_natively = true AND created_at < '2026-07-01';

-- 2. Seed student_types pour les écoles legacy (idempotent via ON CONFLICT)
INSERT INTO student_types (school_id, code, label, "order", is_default)
SELECT s.id, 'not_affected', 'Élève non-affecté', 1, true
FROM schools s
WHERE NOT EXISTS (
  SELECT 1 FROM student_types st WHERE st.school_id = s.id AND st.code = 'not_affected'
)
ON CONFLICT (school_id, code) DO NOTHING;

INSERT INTO student_types (school_id, code, label, "order", is_default)
SELECT s.id, 'affected', 'Élève affecté d''État', 2, false
FROM schools s
WHERE NOT EXISTS (
  SELECT 1 FROM student_types st WHERE st.school_id = s.id AND st.code = 'affected'
)
ON CONFLICT (school_id, code) DO NOTHING;

INSERT INTO student_types (school_id, code, label, "order", is_default)
SELECT s.id, 'social_case', 'Cas social', 3, false
FROM schools s
WHERE NOT EXISTS (
  SELECT 1 FROM student_types st WHERE st.school_id = s.id AND st.code = 'social_case'
)
ON CONFLICT (school_id, code) DO NOTHING;

-- 3. Set periode_type sur l'année la plus récente de chaque école
UPDATE school_years sy
SET periode_type = 'trimestre'
WHERE periode_type IS NULL
  AND id IN (
    SELECT DISTINCT ON (sy2.school_id) sy2.id
    FROM school_years sy2
    WHERE sy2.deleted_at IS NULL
    ORDER BY sy2.school_id, sy2.date_start DESC NULLS LAST
  );

-- 4. Créer periodes T1/T2/T3 par défaut pour l'année la plus récente si absentes
WITH current_years AS (
  SELECT DISTINCT ON (sy.school_id) sy.id, sy.school_id, sy.date_start, sy.date_end
  FROM school_years sy
  WHERE sy.deleted_at IS NULL
  ORDER BY sy.school_id, sy.date_start DESC NULLS LAST
)
INSERT INTO periodes (school_id, school_year_id, name, type, "order", start_date, end_date, is_published)
SELECT
  cy.school_id, cy.id, 'Trimestre 1', 'trimestre', 1,
  cy.date_start::date,
  (cy.date_start + INTERVAL '3 months')::date,
  false
FROM current_years cy
WHERE NOT EXISTS (
  SELECT 1 FROM periodes p WHERE p.school_year_id = cy.id
);

WITH current_years AS (
  SELECT DISTINCT ON (sy.school_id) sy.id, sy.school_id, sy.date_start, sy.date_end
  FROM school_years sy
  WHERE sy.deleted_at IS NULL
  ORDER BY sy.school_id, sy.date_start DESC NULLS LAST
)
INSERT INTO periodes (school_id, school_year_id, name, type, "order", start_date, end_date, is_published)
SELECT
  cy.school_id, cy.id, 'Trimestre 2', 'trimestre', 2,
  (cy.date_start + INTERVAL '3 months')::date,
  (cy.date_start + INTERVAL '6 months')::date,
  false
FROM current_years cy
WHERE (SELECT COUNT(*) FROM periodes p WHERE p.school_year_id = cy.id) = 1;

WITH current_years AS (
  SELECT DISTINCT ON (sy.school_id) sy.id, sy.school_id, sy.date_start, sy.date_end
  FROM school_years sy
  WHERE sy.deleted_at IS NULL
  ORDER BY sy.school_id, sy.date_start DESC NULLS LAST
)
INSERT INTO periodes (school_id, school_year_id, name, type, "order", start_date, end_date, is_published)
SELECT
  cy.school_id, cy.id, 'Trimestre 3', 'trimestre', 3,
  (cy.date_start + INTERVAL '6 months')::date,
  cy.date_end::date,
  false
FROM current_years cy
WHERE (SELECT COUNT(*) FROM periodes p WHERE p.school_year_id = cy.id) = 2;

-- 5. Marquer les students au type par défaut de leur école
UPDATE students st SET student_type_id = (
  SELECT stype.id FROM student_types stype
  WHERE stype.school_id = st.school_id AND stype.is_default = true LIMIT 1
) WHERE st.student_type_id IS NULL AND st.school_id IS NOT NULL;

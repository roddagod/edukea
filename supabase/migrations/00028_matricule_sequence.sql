-- ============================================================
-- Matricule sequence generator
-- Adds schools.matricule_prefix + function next_matricule(school_id, year_id).
-- Format : <PREFIX>-<YYYY>-<NNNN> ex : AKD-2025-0421
-- ============================================================

ALTER TABLE schools ADD COLUMN IF NOT EXISTS matricule_prefix TEXT;

-- Backfill : prefixes courants basés sur les noms d'écoles connus
UPDATE schools SET matricule_prefix = 'AKD' WHERE name = 'Collège Akonda Divo' AND matricule_prefix IS NULL;
UPDATE schools SET matricule_prefix = 'AKG' WHERE name = 'Collège Akonda Général' AND matricule_prefix IS NULL;
UPDATE schools SET matricule_prefix = 'HAR' WHERE name = 'Collège Harmony N''douci2' AND matricule_prefix IS NULL;
UPDATE schools SET matricule_prefix = 'PEL' WHERE name = 'Groupe Scolaire Prim''Elite' AND matricule_prefix IS NULL;

CREATE OR REPLACE FUNCTION next_matricule(p_school_id TEXT, p_school_year_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT;
  v_year_short TEXT;
  v_seq INT;
  v_candidate TEXT;
BEGIN
  SELECT COALESCE(matricule_prefix, UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 3)))
    INTO v_prefix FROM schools WHERE id = p_school_id;
  IF v_prefix IS NULL THEN
    RAISE EXCEPTION 'next_matricule : school % introuvable', p_school_id;
  END IF;

  SELECT SUBSTRING(name FROM 1 FOR 4) INTO v_year_short FROM school_years WHERE id = p_school_year_id;
  IF v_year_short IS NULL THEN
    RAISE EXCEPTION 'next_matricule : school_year % introuvable', p_school_year_id;
  END IF;

  -- Trouver le prochain seq disponible pour ce préfixe × année
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(matricule FROM v_prefix || '-' || v_year_short || '-(\d+)$') AS INT)),
    0
  ) + 1
    INTO v_seq
  FROM students
  WHERE school_id = p_school_id
    AND matricule ~ ('^' || v_prefix || '-' || v_year_short || '-\d+$');

  v_candidate := v_prefix || '-' || v_year_short || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN v_candidate;
END $$;

GRANT EXECUTE ON FUNCTION next_matricule(TEXT, TEXT) TO authenticated;

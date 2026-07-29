-- =========================================================================
-- Migration 00049 — Échéances par mois + année offset (S3D.2 UX)
--
-- Remplace due_date_offset_days par due_month + due_year_offset.
-- Modèle plus intuitif : "septembre 2026" au lieu de "jour 30 après début".
-- =========================================================================

-- 1. Ajouter les nouvelles colonnes
ALTER TABLE level_fee_installments
  ADD COLUMN IF NOT EXISTS due_month INT CHECK (due_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS due_year_offset INT NOT NULL DEFAULT 0 CHECK (due_year_offset IN (0, 1));

-- 2. Migrer la data existante depuis due_date_offset_days
-- Approximation : sy.date_start + offset days → mois/année de cette date
-- Pour chaque installment, on doit joindre school_years via level → cycle → school → current year
UPDATE level_fee_installments lfi
SET
  due_month = EXTRACT(MONTH FROM (sy.date_start::date + (lfi.due_date_offset_days || ' days')::interval))::int,
  due_year_offset = CASE
    WHEN EXTRACT(YEAR FROM (sy.date_start::date + (lfi.due_date_offset_days || ' days')::interval))::int > EXTRACT(YEAR FROM sy.date_start)::int
    THEN 1 ELSE 0
  END
FROM levels l
JOIN cycles c ON c.id = l.cycle_id
CROSS JOIN LATERAL (
  SELECT sy2.date_start FROM school_years sy2
  WHERE sy2.school_id = c.school_id AND sy2.deleted_at IS NULL
  ORDER BY sy2.date_start DESC NULLS LAST LIMIT 1
) sy
WHERE l.id = lfi.level_id AND lfi.due_month IS NULL AND lfi.due_date_offset_days IS NOT NULL;

-- Fallback pour installments sans data : due_month = 9 (septembre), due_year_offset = 0
UPDATE level_fee_installments SET due_month = 9, due_year_offset = 0
WHERE due_month IS NULL;

-- 3. NOT NULL constraint sur due_month
ALTER TABLE level_fee_installments ALTER COLUMN due_month SET NOT NULL;

-- 4. Idem pour classroom_fee_installments (échéances par classe = surcharge du calendrier)
ALTER TABLE classroom_fee_installments
  ADD COLUMN IF NOT EXISTS due_month INT CHECK (due_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS due_year_offset INT NOT NULL DEFAULT 0 CHECK (due_year_offset IN (0, 1));

-- Migrer classroom_fee_installments : due_date déjà stockée directement, extract month/year
UPDATE classroom_fee_installments cfi
SET
  due_month = EXTRACT(MONTH FROM cfi.due_date)::int,
  due_year_offset = CASE
    WHEN EXTRACT(YEAR FROM cfi.due_date)::int > EXTRACT(YEAR FROM sy.date_start)::int
    THEN 1 ELSE 0
  END
FROM classrooms cr
JOIN levels l ON l.id = cr.level_id
JOIN cycles c ON c.id = l.cycle_id
CROSS JOIN LATERAL (
  SELECT sy2.date_start FROM school_years sy2
  WHERE sy2.school_id = c.school_id AND sy2.deleted_at IS NULL
  ORDER BY sy2.date_start DESC NULLS LAST LIMIT 1
) sy
WHERE cr.id = cfi.classroom_id AND cfi.due_month IS NULL;

ALTER TABLE classroom_fee_installments ALTER COLUMN due_month SET NOT NULL;

-- 5. Mise à jour du template école : réécrire schools.default_fee_template
UPDATE schools SET default_fee_template = '{
  "lines": [
    { "category": "inscription", "label": "Inscription", "amount": 25000, "order": 1, "is_optional": false },
    { "category": "tuition",     "label": "Scolarité annuelle", "amount": 150000, "order": 2, "is_optional": false },
    { "category": "insurance",   "label": "Assurance", "amount": 5000, "order": 3, "is_optional": false }
  ],
  "installments": [
    { "order": 1, "label": "Inscription", "category": "inscription", "due_month": 9, "due_year_offset": 0, "amount_percentage": 100 },
    { "order": 2, "label": "1re tranche scolarité", "category": "tuition", "due_month": 11, "due_year_offset": 0, "amount_percentage": 40 },
    { "order": 3, "label": "2e tranche scolarité",  "category": "tuition", "due_month": 1, "due_year_offset": 1, "amount_percentage": 30 },
    { "order": 4, "label": "3e tranche scolarité",  "category": "tuition", "due_month": 4, "due_year_offset": 1, "amount_percentage": 30 }
  ]
}'::jsonb;

-- 6. Recréer la vue v_classroom_effective_installments avec la nouvelle logique
CREATE OR REPLACE VIEW v_classroom_effective_installments AS
  SELECT
    cfi.classroom_id,
    cfi.student_type_id,
    cfi."order",
    cfi.label,
    cfi.category,
    cfi.due_date,
    cfi.amount,
    'classroom_override'::text AS source
  FROM classroom_fee_installments cfi
  UNION ALL
  SELECT
    cr.id AS classroom_id,
    lfi.student_type_id,
    lfi."order",
    lfi.label,
    lfi.category,
    make_date(
      EXTRACT(YEAR FROM sy.date_start)::int + lfi.due_year_offset,
      lfi.due_month,
      15
    ) AS due_date,
    COALESCE(
      lfi.amount,
      (SELECT SUM(lfl2.amount) * lfi.amount_percentage / 100.0
       FROM level_fee_lines lfl2
       WHERE lfl2.level_id = lfi.level_id
         AND lfl2.student_type_id = lfi.student_type_id
         AND lfl2.category = lfi.category)
    ) AS amount,
    'level'::text AS source
  FROM classrooms cr
  JOIN level_fee_installments lfi ON lfi.level_id = cr.level_id
  CROSS JOIN LATERAL (
    SELECT sy2.date_start FROM school_years sy2
    JOIN cycles c ON c.school_id = sy2.school_id
    JOIN levels l ON l.cycle_id = c.id AND l.id = cr.level_id
    WHERE sy2.deleted_at IS NULL
    ORDER BY sy2.date_start DESC NULLS LAST LIMIT 1
  ) sy
  WHERE NOT EXISTS (
    SELECT 1 FROM classroom_fee_installments cfi2
    WHERE cfi2.classroom_id = cr.id
      AND cfi2.student_type_id = lfi.student_type_id
      AND cfi2.overrides_level_installment_id = lfi.id
  );

-- 7. Recréer trigger_on_level_created pour utiliser le nouveau shape
CREATE OR REPLACE FUNCTION trigger_on_level_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_school_id TEXT;
  v_type RECORD;
  v_template JSONB;
  v_line JSONB;
  v_installment JSONB;
BEGIN
  SELECT school_id INTO v_school_id FROM cycles WHERE id = NEW.cycle_id;
  SELECT default_fee_template INTO v_template FROM schools WHERE id = v_school_id;

  FOR v_type IN SELECT id FROM student_types WHERE school_id = v_school_id LOOP
    FOR v_line IN SELECT * FROM jsonb_array_elements(v_template->'lines') LOOP
      INSERT INTO level_fee_lines
        (level_id, student_type_id, category, label, amount, "order", is_optional)
      VALUES (
        NEW.id, v_type.id,
        v_line->>'category', v_line->>'label',
        (v_line->>'amount')::NUMERIC,
        (v_line->>'order')::INT,
        COALESCE((v_line->>'is_optional')::BOOLEAN, false)
      )
      ON CONFLICT DO NOTHING;
    END LOOP;

    FOR v_installment IN SELECT * FROM jsonb_array_elements(v_template->'installments') LOOP
      INSERT INTO level_fee_installments
        (level_id, student_type_id, "order", label, category, due_month, due_year_offset, amount, amount_percentage)
      VALUES (
        NEW.id, v_type.id,
        (v_installment->>'order')::INT, v_installment->>'label', v_installment->>'category',
        (v_installment->>'due_month')::INT,
        COALESCE((v_installment->>'due_year_offset')::INT, 0),
        (v_installment->>'amount')::NUMERIC,
        (v_installment->>'amount_percentage')::NUMERIC
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  RETURN NEW;
END $$;

-- 8. Recréer hydrate_fees_from_school_template pour utiliser le nouveau shape
CREATE OR REPLACE FUNCTION hydrate_fees_from_school_template(p_school_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_template JSONB;
  v_line JSONB;
  v_installment JSONB;
  v_level RECORD;
  v_type RECORD;
  v_lines_created INT := 0;
  v_installments_created INT := 0;
  v_combos_hydrated INT := 0;
BEGIN
  SELECT default_fee_template INTO v_template FROM schools WHERE id = p_school_id;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'hydrate_fees : école % introuvable ou template null', p_school_id;
  END IF;

  FOR v_level IN
    SELECT l.id FROM levels l
    JOIN cycles c ON c.id = l.cycle_id
    WHERE c.school_id = p_school_id AND l.deleted_at IS NULL
  LOOP
    FOR v_type IN
      SELECT st.id FROM student_types st WHERE st.school_id = p_school_id
    LOOP
      IF EXISTS (SELECT 1 FROM level_fee_lines WHERE level_id = v_level.id AND student_type_id = v_type.id) THEN
        CONTINUE;
      END IF;

      FOR v_line IN SELECT * FROM jsonb_array_elements(v_template->'lines') LOOP
        INSERT INTO level_fee_lines (level_id, student_type_id, category, label, amount, "order", is_optional)
        VALUES (
          v_level.id, v_type.id,
          v_line->>'category', v_line->>'label',
          (v_line->>'amount')::NUMERIC,
          (v_line->>'order')::INT,
          COALESCE((v_line->>'is_optional')::BOOLEAN, false)
        )
        ON CONFLICT DO NOTHING;
        v_lines_created := v_lines_created + 1;
      END LOOP;

      FOR v_installment IN SELECT * FROM jsonb_array_elements(v_template->'installments') LOOP
        INSERT INTO level_fee_installments (level_id, student_type_id, "order", label, category, due_month, due_year_offset, amount, amount_percentage)
        VALUES (
          v_level.id, v_type.id,
          (v_installment->>'order')::INT,
          v_installment->>'label',
          v_installment->>'category',
          (v_installment->>'due_month')::INT,
          COALESCE((v_installment->>'due_year_offset')::INT, 0),
          (v_installment->>'amount')::NUMERIC,
          (v_installment->>'amount_percentage')::NUMERIC
        )
        ON CONFLICT DO NOTHING;
        v_installments_created := v_installments_created + 1;
      END LOOP;

      v_combos_hydrated := v_combos_hydrated + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'combos_hydrated', v_combos_hydrated,
    'lines_created', v_lines_created,
    'installments_created', v_installments_created
  );
END $$;

-- 9. Drop l'ancienne colonne (après migration data)
ALTER TABLE level_fee_installments DROP COLUMN IF EXISTS due_date_offset_days;

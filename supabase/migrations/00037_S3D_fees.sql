-- =========================================================================
-- Migration 00037 — Infrastructure frais + échéances + ventilation (S3D fondations)
-- =========================================================================

-- Template école (utilisé pour hydrater les niveaux à la création)
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS default_fee_template JSONB NOT NULL DEFAULT '{
    "lines": [
      { "category": "inscription", "label": "Inscription", "amount": 25000, "order": 1, "is_optional": false },
      { "category": "tuition",     "label": "Scolarité annuelle", "amount": 150000, "order": 2, "is_optional": false },
      { "category": "insurance",   "label": "Assurance", "amount": 5000, "order": 3, "is_optional": false }
    ],
    "installments": [
      { "order": 1, "label": "Inscription", "category": "inscription", "due_date_offset_days": 0, "amount_percentage": 100 },
      { "order": 2, "label": "1re tranche scolarité", "category": "tuition", "due_date_offset_days": 30,  "amount_percentage": 40 },
      { "order": 3, "label": "2e tranche scolarité",  "category": "tuition", "due_date_offset_days": 120, "amount_percentage": 30 },
      { "order": 4, "label": "3e tranche scolarité",  "category": "tuition", "due_date_offset_days": 210, "amount_percentage": 30 }
    ]
  }'::jsonb;

-- Config primaire par (niveau × type d'élève)
CREATE TABLE IF NOT EXISTS level_fee_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id TEXT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  student_type_id UUID NOT NULL REFERENCES student_types(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(level_id, student_type_id, "order")
);

CREATE INDEX IF NOT EXISTS idx_level_fee_lines_level ON level_fee_lines(level_id);
CREATE INDEX IF NOT EXISTS idx_level_fee_lines_type ON level_fee_lines(student_type_id);

CREATE TABLE IF NOT EXISTS level_fee_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id TEXT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  student_type_id UUID NOT NULL REFERENCES student_types(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  due_date_offset_days INTEGER NOT NULL DEFAULT 0,
  amount NUMERIC,
  amount_percentage NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(level_id, student_type_id, "order"),
  CHECK (amount IS NOT NULL OR amount_percentage IS NOT NULL)
);

-- Override par (classe × type)
CREATE TABLE IF NOT EXISTS classroom_fee_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  student_type_id UUID NOT NULL REFERENCES student_types(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0,
  overrides_level_line_id UUID REFERENCES level_fee_lines(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, student_type_id, "order")
);

CREATE INDEX IF NOT EXISTS idx_classroom_fee_lines_classroom ON classroom_fee_lines(classroom_id);

CREATE TABLE IF NOT EXISTS classroom_fee_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  student_type_id UUID NOT NULL REFERENCES student_types(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  overrides_level_installment_id UUID REFERENCES level_fee_installments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, student_type_id, "order")
);

CREATE INDEX IF NOT EXISTS idx_classroom_fee_installments_classroom
  ON classroom_fee_installments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_fee_installments_due_date
  ON classroom_fee_installments(due_date);

-- Ventilation automatique des paiements
CREATE TABLE IF NOT EXISTS payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_tx_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE CASCADE,
  fee_installment_id UUID REFERENCES classroom_fee_installments(id) ON DELETE SET NULL,
  allocated_amount BIGINT NOT NULL,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(payment_tx_id, fee_installment_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_tx
  ON payment_allocations(payment_tx_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_installment
  ON payment_allocations(fee_installment_id);

COMMENT ON TABLE payment_allocations IS
  'Ventilation d''un paiement sur les échéances. fee_installment_id NULL = allocation surplus (trop-perçu). Alimentée par allocate_payment_to_installments().';

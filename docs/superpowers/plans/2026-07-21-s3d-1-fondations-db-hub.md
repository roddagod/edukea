# S3D.1 — Fondations DB + Squelette Hub Rentrée — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** Poser toutes les fondations DB du module Notes/Bulletins (migrations, views, functions, RLS, seeds) et livrer un Hub Rentrée cliquable avec checklist en 8 étapes affichant le statut correct de chaque étape (sans que les sous-écrans soient encore fonctionnels).

**Architecture :** 11 migrations SQL Supabase séquentielles (00035 → 00045), 1 backfill legacy one-off (00046), régénération des types TypeScript, 1 hook partagé `usePedagogySetupStatus`, 1 page hub `/dashboard/pedagogy` avec composant checklist, intégration dans la sidebar `apps/school` derrière un `<RoleGate>`. Valeur au ship : le manager se connecte, voit le hub, comprend les 8 étapes de rentrée à venir avec statut à jour en temps réel.

**Tech Stack :** Supabase (PostgreSQL 15 + Auth + Storage + RLS), Next.js 15 (App Router + Turbopack), TypeScript, TanStack Query v5, @edukea/shared, @edukea/ui (shadcn/ui), Tailwind, Vitest + React Testing Library.

**Spec source :** `docs/superpowers/specs/2026-07-20-notes-bulletins-design.md` (dernier commit `27133ec`).

---

## Structure de fichiers créés/modifiés

**Nouvelles migrations SQL** (`supabase/migrations/`) :
- `00035_S3D_student_types.sql` — table `student_types` + FK sur `students` + trigger seed école
- `00036_S3D_bulletins_state_machine.sql` — colonnes state machine sur `bulletins`, tables `bulletin_versions` et `notes_audit`, extension `notes`
- `00037_S3D_fees.sql` — `default_fee_template` sur schools + tables `level_fee_lines`/`level_fee_installments`/`classroom_fee_lines`/`classroom_fee_installments`/`payment_allocations`
- `00038_S3D_school_branding.sql` — colonnes branding sur `schools` + `bulletin_config JSONB`
- `00039_S3D_pedagogy_setup.sql` — `teacher_invitations`, `classrooms.principal_teacher_id`, `created_natively` sur cycles/levels/classrooms, `school_years.periode_type`, `teacher_profiles.signature_url`, extensions `student_school_year_loggings`
- `00040_S3D_templates.sql` — `subject_templates`, `structure_templates`, `appreciation_templates` + seed data ivoirien
- `00041_S3D_availability_status.sql` — `subject_school_year_availability`, `classroom_periode_status`
- `00042_S3D_views.sql` — les 9 vues SQL (`v_pedagogy_setup_status`, `v_provisional_averages`, etc.)
- `00043_S3D_functions.sql` — fonctions SQL (`advance_bulletin_status`, `allocate_payment_to_installments`, `on_level_created` trigger, etc.)
- `00044_S3D_rls.sql` — RLS policies pour toutes les nouvelles tables
- `00045_S3D_backfill_legacy.sql` — one-off idempotent pour les 3 écoles legacy synchronisées

**Régénération types** :
- `packages/shared/src/types/database.types.ts` — via `supabase gen types typescript`

**Hook partagé** (`packages/shared/src/hooks/`) :
- `usePedagogySetupStatus.ts` — nouveau hook, retourne le statut des 8 étapes du hub
- Ajout barrel export dans `packages/shared/src/hooks/index.ts`

**App school** (`apps/school/src/app/(dashboard)/dashboard/pedagogy/`) :
- `page.tsx` — page hub Rentrée (server component qui hydrate le hook)
- `loading.tsx` — skeleton
- `_components/PedagogyChecklist.tsx` — composant client interactif
- `_components/PedagogyStepCard.tsx` — carte individuelle d'étape avec badge statut

**Sidebar** (`apps/school/src/components/layout/sidebar-nav.tsx`) :
- Modifier : ajouter item "Rentrée" derrière `<RoleGate roles={['manager']}>`

**Tests** (`apps/school/src/tests/` et `packages/shared/src/hooks/__tests__/`) :
- `usePedagogySetupStatus.test.ts` — hook test avec mocks Supabase
- `PedagogyChecklist.test.tsx` — component test (8 items, statuts, navigation)
- `pedagogy.migration.test.ts` — smoke test que les migrations sont bien appliquées (Vitest + Supabase client node)

---

## Prérequis de la session

**Avant de commencer** :

- Être sur la branche `main` avec working tree propre (ou une feature branch fraîche `feat/s3d-1-fondations`)
- Supabase CLI installé (`supabase --version` → ≥ 1.190)
- pnpm ≥ 10.22 (le monorepo est en pnpm workspaces)
- Variables d'environnement présentes dans `.env.local` de la racine :
  - `SUPABASE_PROJECT_ID=ejwqvahlnmysxeerqrrv`
  - `SUPABASE_DB_URL=postgresql://postgres.ejwqvahlnmysxeerqrrv:***@aws-1-eu-north-1.pooler.supabase.com:5432/postgres`
- Node ≥ 20.10

**Vérification initiale à faire** :

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
git status                                    # working tree clean
git branch --show-current                     # main
pnpm --version                                # ≥ 10.22
supabase --version                            # ≥ 1.190
ls supabase/migrations/ | tail -5             # confirme 00034 en dernier
pnpm install                                  # deps à jour
```

---

## Task 1 : Créer la feature branch et vérifier la baseline

**Files :** N/A (git only)

- [ ] **Step 1 : Créer la branche**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
git checkout -b feat/s3d-1-fondations
```

- [ ] **Step 2 : Vérifier la baseline pnpm**

```bash
pnpm install
pnpm --filter @edukea/shared build 2>&1 | tail -20
```

Expected : build passes, no TS errors sur `@edukea/shared`.

- [ ] **Step 3 : Vérifier la connexion Supabase**

```bash
supabase status 2>&1 | head -10
```

Expected : liste des services locaux OU message "Supabase local not started" (OK — on va bosser en remote pour ce plan).

- [ ] **Step 4 : Baseline migrations**

```bash
ls supabase/migrations/ | wc -l
```

Expected : `34` (les 34 migrations existantes).

- [ ] **Step 5 : Commit baseline**

Rien à commit à cette étape, on continue.

---

## Task 2 : Migration 00035 — Table `student_types`

**Files :**
- Create : `supabase/migrations/00035_S3D_student_types.sql`
- Test : `supabase/migrations/00035_S3D_student_types.test.sql` (verification query)

- [ ] **Step 1 : Écrire la verification query (test qui doit échouer avant migration)**

Créer `supabase/migrations/00035_S3D_student_types.test.sql` :

```sql
-- Verification queries for migration 00035
-- Should return 0 rows / errors BEFORE migration is applied
SELECT
  'student_types table exists' AS assertion,
  COUNT(*) = 1 AS pass
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'student_types';

SELECT
  'students.student_type_id column exists' AS assertion,
  COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'student_type_id';

SELECT
  'on_school_created trigger exists' AS assertion,
  COUNT(*) = 1 AS pass
FROM information_schema.triggers
WHERE trigger_name = 'on_school_created_seed_student_types';
```

- [ ] **Step 2 : Vérifier que les assertions échouent (schéma pas encore appliqué)**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00035_S3D_student_types.test.sql
```

Expected : 3 lignes, toutes avec `pass = false`.

- [ ] **Step 3 : Écrire la migration**

Créer `supabase/migrations/00035_S3D_student_types.sql` :

```sql
-- =========================================================================
-- Migration 00035 — Types d'élèves (S3D fondations)
--
-- Introduit une table `student_types` définie librement par école (au lieu
-- d'un enum figé). Séed 3 types standards ivoiriens à la création d'école
-- via trigger. Ajoute FK sur `students.student_type_id`.
-- =========================================================================

CREATE TABLE IF NOT EXISTS student_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, code)
);

-- Un seul is_default par école (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_types_one_default_per_school
  ON student_types(school_id) WHERE is_default = true;

-- FK sur students (nullable jusqu'à la première inscription)
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS student_type_id UUID REFERENCES student_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_student_type_id ON students(student_type_id);

-- Trigger seed automatique à la création d'école
CREATE OR REPLACE FUNCTION seed_default_student_types()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO student_types (school_id, code, label, "order", is_default) VALUES
    (NEW.id, 'not_affected', 'Élève non-affecté', 1, true),
    (NEW.id, 'affected',     'Élève affecté d''État', 2, false),
    (NEW.id, 'social_case',  'Cas social', 3, false)
  ON CONFLICT (school_id, code) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_school_created_seed_student_types ON schools;
CREATE TRIGGER on_school_created_seed_student_types
  AFTER INSERT ON schools
  FOR EACH ROW
  EXECUTE FUNCTION seed_default_student_types();

COMMENT ON TABLE student_types IS
  'Types d''élèves définis librement par école (ex: affecté / non-affecté / cas social pour CI). Impacte la grille tarifaire (level_fee_lines) et l''affichage bulletin.';
```

- [ ] **Step 4 : Appliquer la migration**

```bash
supabase db push --db-url "$SUPABASE_DB_URL"
```

Expected : `Applied migration 00035_S3D_student_types.sql`.

- [ ] **Step 5 : Vérifier que les assertions passent**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00035_S3D_student_types.test.sql
```

Expected : 3 lignes, toutes avec `pass = true`.

- [ ] **Step 6 : Vérifier le seed des écoles existantes**

```bash
psql "$SUPABASE_DB_URL" -c "SELECT school_id, COUNT(*) FROM student_types GROUP BY school_id;"
```

Expected : les écoles existantes n'ont **pas** de student_types (trigger ne se déclenche que sur INSERT nouveau). Backfill séparé en Task 12.

- [ ] **Step 7 : Commit**

```bash
git add supabase/migrations/00035_S3D_student_types.sql \
        supabase/migrations/00035_S3D_student_types.test.sql
git commit -m "feat(db): 00035 student_types table + FK on students (S3D fondations)"
```

---

## Task 3 : Migration 00036 — State machine des bulletins + audit

**Files :**
- Create : `supabase/migrations/00036_S3D_bulletins_state_machine.sql`
- Create : `supabase/migrations/00036_S3D_bulletins_state_machine.test.sql`

- [ ] **Step 1 : Écrire la verification query**

Créer `supabase/migrations/00036_S3D_bulletins_state_machine.test.sql` :

```sql
SELECT 'bulletins.status column exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'bulletins' AND column_name = 'status';

SELECT 'bulletins.current_version column exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'bulletins' AND column_name = 'current_version';

SELECT 'bulletins.annual_average column exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'bulletins' AND column_name = 'annual_average';

SELECT 'bulletin_versions table exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables
WHERE table_name = 'bulletin_versions';

SELECT 'notes_audit table exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables
WHERE table_name = 'notes_audit';

SELECT 'notes.is_exempted column exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'notes' AND column_name = 'is_exempted';
```

- [ ] **Step 2 : Vérifier que les assertions échouent**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00036_S3D_bulletins_state_machine.test.sql
```

Expected : 6 lignes toutes en `pass = false`.

- [ ] **Step 3 : Écrire la migration**

Créer `supabase/migrations/00036_S3D_bulletins_state_machine.sql` :

```sql
-- =========================================================================
-- Migration 00036 — State machine bulletins + audit trail (S3D fondations)
-- =========================================================================

-- Extension de bulletins avec la state machine + traçabilité
ALTER TABLE bulletins
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready_censeur', 'ready_director', 'published')),
  ADD COLUMN IF NOT EXISTS finalized_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS annual_average NUMERIC;

CREATE INDEX IF NOT EXISTS idx_bulletins_status ON bulletins(status);
CREATE INDEX IF NOT EXISTS idx_bulletins_classroom_status
  ON bulletins(classroom_id, status);

-- Historique des publications / re-publications
CREATE TABLE IF NOT EXISTS bulletin_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulletin_id UUID NOT NULL REFERENCES bulletins(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason_for_edit TEXT,
  UNIQUE(bulletin_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_bulletin_versions_bulletin
  ON bulletin_versions(bulletin_id);

-- Audit modifications de notes (post-publi)
CREATE TABLE IF NOT EXISTS notes_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  old_score NUMERIC,
  new_score NUMERIC,
  old_is_absent BOOLEAN,
  new_is_absent BOOLEAN,
  old_is_exempted BOOLEAN,
  new_is_exempted BOOLEAN,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_notes_audit_note ON notes_audit(note_id);
CREATE INDEX IF NOT EXISTS idx_notes_audit_changed_at ON notes_audit(changed_at DESC);

-- Extensions notes
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS is_exempted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN bulletins.status IS
  'State machine : draft → ready_censeur → ready_director → published. Transition via advance_bulletin_status().';
```

- [ ] **Step 4 : Appliquer**

```bash
supabase db push --db-url "$SUPABASE_DB_URL"
```

- [ ] **Step 5 : Vérifier les assertions**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00036_S3D_bulletins_state_machine.test.sql
```

Expected : 6 `pass = true`.

- [ ] **Step 6 : Commit**

```bash
git add supabase/migrations/00036_S3D_bulletins_state_machine.sql \
        supabase/migrations/00036_S3D_bulletins_state_machine.test.sql
git commit -m "feat(db): 00036 bulletins state machine + notes_audit + bulletin_versions (S3D fondations)"
```

---

## Task 4 : Migration 00037 — Infrastructure des frais

**Files :**
- Create : `supabase/migrations/00037_S3D_fees.sql`
- Create : `supabase/migrations/00037_S3D_fees.test.sql`

- [ ] **Step 1 : Écrire la verification query**

Créer `supabase/migrations/00037_S3D_fees.test.sql` :

```sql
SELECT 'schools.default_fee_template exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.columns
WHERE table_name = 'schools' AND column_name = 'default_fee_template';

SELECT 'level_fee_lines exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'level_fee_lines';

SELECT 'level_fee_installments exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'level_fee_installments';

SELECT 'classroom_fee_lines exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'classroom_fee_lines';

SELECT 'classroom_fee_installments exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'classroom_fee_installments';

SELECT 'payment_allocations exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'payment_allocations';
```

- [ ] **Step 2 : Vérifier échec**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00037_S3D_fees.test.sql
```

Expected : 6 `pass = false`.

- [ ] **Step 3 : Écrire la migration**

Créer `supabase/migrations/00037_S3D_fees.sql` :

```sql
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
```

- [ ] **Step 4 : Appliquer**

```bash
supabase db push --db-url "$SUPABASE_DB_URL"
```

- [ ] **Step 5 : Vérifier**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00037_S3D_fees.test.sql
```

Expected : 6 `pass = true`.

- [ ] **Step 6 : Commit**

```bash
git add supabase/migrations/00037_S3D_fees.sql \
        supabase/migrations/00037_S3D_fees.test.sql
git commit -m "feat(db): 00037 fees infrastructure (level_fee_lines + installments + payment_allocations) (S3D fondations)"
```

---

## Task 5 : Migration 00038 — Branding école + bulletin_config

**Files :**
- Create : `supabase/migrations/00038_S3D_school_branding.sql`
- Create : `supabase/migrations/00038_S3D_school_branding.test.sql`

- [ ] **Step 1 : Verification query**

Créer `00038_S3D_school_branding.test.sql` :

```sql
SELECT c.column_name, COUNT(*) = 1 AS pass
FROM information_schema.columns c
WHERE c.table_name = 'schools' AND c.column_name IN (
  'display_name', 'motto', 'address', 'postal_address', 'phone', 'email',
  'accreditation_number', 'accent_color', 'logo_url', 'stamp_url',
  'director_signature_url', 'bulletin_config', 'structure_seeded_from'
)
GROUP BY c.column_name;
```

- [ ] **Step 2 : Vérifier échec (0 lignes)**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00038_S3D_school_branding.test.sql
```

Expected : 0 lignes (aucune colonne n'existe encore).

- [ ] **Step 3 : Écrire la migration**

Créer `00038_S3D_school_branding.sql` :

```sql
-- =========================================================================
-- Migration 00038 — Branding école + bulletin_config (S3D fondations)
-- =========================================================================

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS motto TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS postal_address TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS accreditation_number TEXT,
  ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT '#E97423',
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS stamp_url TEXT,
  ADD COLUMN IF NOT EXISTS director_signature_url TEXT,
  ADD COLUMN IF NOT EXISTS structure_seeded_from TEXT,
  ADD COLUMN IF NOT EXISTS default_max_score NUMERIC NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS bulletin_config JSONB NOT NULL DEFAULT '{
    "show_class_stats": true,
    "show_rank": true,
    "show_absences": false,
    "show_student_type": false,
    "mention_thresholds": {
      "excellent": 16,
      "bien": 14,
      "assez_bien": 12,
      "passable": 10
    },
    "mention_labels": {
      "excellent": "Excellent",
      "bien": "Bien",
      "assez_bien": "Assez bien",
      "passable": "Passable",
      "insuffisant": "Insuffisant"
    },
    "legal_footer": ""
  }'::jsonb;

COMMENT ON COLUMN schools.bulletin_config IS
  'Config bulletin JSONB : toggles show_*, seuils mention, libellés, footer légal. Les libellés types d''élèves viennent de student_types.label (pas ici).';
```

- [ ] **Step 4 : Appliquer**

```bash
supabase db push --db-url "$SUPABASE_DB_URL"
```

- [ ] **Step 5 : Vérifier**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00038_S3D_school_branding.test.sql
```

Expected : 13 lignes, toutes en `pass = true`.

- [ ] **Step 6 : Commit**

```bash
git add supabase/migrations/00038_S3D_school_branding.sql \
        supabase/migrations/00038_S3D_school_branding.test.sql
git commit -m "feat(db): 00038 schools branding + bulletin_config JSONB (S3D fondations)"
```

---

## Task 6 : Migration 00039 — Setup pédagogique (enseignants + classes + année)

**Files :**
- Create : `supabase/migrations/00039_S3D_pedagogy_setup.sql`
- Create : `supabase/migrations/00039_S3D_pedagogy_setup.test.sql`

- [ ] **Step 1 : Verification query**

Créer `00039_S3D_pedagogy_setup.test.sql` :

```sql
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
```

- [ ] **Step 2 : Vérifier échec**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00039_S3D_pedagogy_setup.test.sql
```

Expected : 7 lignes `pass = false`.

- [ ] **Step 3 : Écrire la migration**

Créer `00039_S3D_pedagogy_setup.sql` :

```sql
-- =========================================================================
-- Migration 00039 — Setup pédagogique (enseignants + classes + année) (S3D fondations)
-- =========================================================================

-- Flag SaaS-native pour les données legacy sync
ALTER TABLE cycles
  ADD COLUMN IF NOT EXISTS created_natively BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE levels
  ADD COLUMN IF NOT EXISTS created_natively BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE classrooms
  ADD COLUMN IF NOT EXISTS created_natively BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS principal_teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_classrooms_principal_teacher
  ON classrooms(principal_teacher_id);

-- Type de période au niveau année
ALTER TABLE school_years
  ADD COLUMN IF NOT EXISTS periode_type TEXT
    CHECK (periode_type IN ('trimestre', 'semestre'));

-- Signature scannée du prof (pour PDF bulletin)
ALTER TABLE teacher_profiles
  ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Invitations enseignants (email + magic link)
CREATE TABLE IF NOT EXISTS teacher_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  personnel_id TEXT REFERENCES personnel(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  token TEXT UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  UNIQUE(school_id, email)
);

CREATE INDEX IF NOT EXISTS idx_teacher_invitations_school
  ON teacher_invitations(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_invitations_email
  ON teacher_invitations(email);

-- Extensions inscription (impact bulletin)
ALTER TABLE student_school_year_loggings
  ADD COLUMN IF NOT EXISTS is_redoublant BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lv2_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mat_secondaire_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS eps_exemption BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ssyl_lv2 ON student_school_year_loggings(lv2_subject_id);
```

- [ ] **Step 4 : Appliquer + vérifier + commit**

```bash
supabase db push --db-url "$SUPABASE_DB_URL"
psql "$SUPABASE_DB_URL" -f supabase/migrations/00039_S3D_pedagogy_setup.test.sql
```

Expected : 7 `pass = true`.

```bash
git add supabase/migrations/00039_S3D_pedagogy_setup.sql \
        supabase/migrations/00039_S3D_pedagogy_setup.test.sql
git commit -m "feat(db): 00039 teacher invitations + classroom principal + ssyl extensions (S3D fondations)"
```

---

## Task 7 : Migration 00040 — Templates ivoiriens séedés

**Files :**
- Create : `supabase/migrations/00040_S3D_templates.sql`
- Create : `supabase/migrations/00040_S3D_templates.test.sql`

- [ ] **Step 1 : Verification query**

Créer `00040_S3D_templates.test.sql` :

```sql
SELECT 'subject_templates table exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'subject_templates';

SELECT 'structure_templates table exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'structure_templates';

SELECT 'appreciation_templates table exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'appreciation_templates';

SELECT 'structure_templates seeded for ivorien_college' AS assertion, COUNT(*) > 0 AS pass
FROM structure_templates WHERE template_key = 'ivorien_college';

SELECT 'subject_templates seeded for ivorien_college' AS assertion, COUNT(*) > 0 AS pass
FROM subject_templates WHERE cycle_code = 'ivorien_college';

SELECT 'appreciation_templates seeded globally' AS assertion, COUNT(*) >= 10 AS pass
FROM appreciation_templates WHERE school_id IS NULL;
```

- [ ] **Step 2 : Vérifier échec**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00040_S3D_templates.test.sql
```

Expected : 6 `pass = false`.

- [ ] **Step 3 : Écrire la migration**

Créer `00040_S3D_templates.sql` :

```sql
-- =========================================================================
-- Migration 00040 — Templates ivoiriens séedés (S3D fondations)
--
-- Trois tables de références :
--   - structure_templates : niveaux par cycle (Prim/Coll/Lyc)
--   - subject_templates   : matières par cycle avec coefficients par défaut
--   - appreciation_templates : phrases types profs (10 séedées globalement)
-- =========================================================================

CREATE TABLE IF NOT EXISTS structure_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL,
  cycle_code TEXT NOT NULL,
  cycle_name TEXT NOT NULL,
  level_code TEXT NOT NULL,
  level_name TEXT NOT NULL,
  level_order INTEGER NOT NULL,
  UNIQUE(template_key, level_code)
);

CREATE TABLE IF NOT EXISTS subject_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_code TEXT NOT NULL,
  name TEXT NOT NULL,
  default_coefficient NUMERIC NOT NULL DEFAULT 1,
  default_group_name TEXT NOT NULL DEFAULT 'Général',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_secondary BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(cycle_code, name)
);

CREATE TABLE IF NOT EXISTS appreciation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  text TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appreciation_templates_school
  ON appreciation_templates(school_id);

COMMENT ON COLUMN appreciation_templates.school_id IS
  'NULL = template global séedé disponible pour toutes les écoles ; non-null = template custom école.';

-- ============ SEEDS ============

-- Structure template : Ivorien Collège (6e → 3e)
INSERT INTO structure_templates (template_key, cycle_code, cycle_name, level_code, level_name, level_order) VALUES
  ('ivorien_college', 'college', 'Collège', '6eme', '6ème', 1),
  ('ivorien_college', 'college', 'Collège', '5eme', '5ème', 2),
  ('ivorien_college', 'college', 'Collège', '4eme', '4ème', 3),
  ('ivorien_college', 'college', 'Collège', '3eme', '3ème', 4)
ON CONFLICT DO NOTHING;

-- Structure template : Ivorien Primaire (CP1 → CM2)
INSERT INTO structure_templates (template_key, cycle_code, cycle_name, level_code, level_name, level_order) VALUES
  ('ivorien_primaire', 'primaire', 'Primaire', 'cp1', 'CP1', 1),
  ('ivorien_primaire', 'primaire', 'Primaire', 'cp2', 'CP2', 2),
  ('ivorien_primaire', 'primaire', 'Primaire', 'ce1', 'CE1', 3),
  ('ivorien_primaire', 'primaire', 'Primaire', 'ce2', 'CE2', 4),
  ('ivorien_primaire', 'primaire', 'Primaire', 'cm1', 'CM1', 5),
  ('ivorien_primaire', 'primaire', 'Primaire', 'cm2', 'CM2', 6)
ON CONFLICT DO NOTHING;

-- Structure template : Ivorien Lycée (2nde → Tle)
INSERT INTO structure_templates (template_key, cycle_code, cycle_name, level_code, level_name, level_order) VALUES
  ('ivorien_lycee', 'lycee', 'Lycée', '2nde', '2nde', 1),
  ('ivorien_lycee', 'lycee', 'Lycée', '1ere', '1ère', 2),
  ('ivorien_lycee', 'lycee', 'Lycée', 'terminale', 'Terminale', 3)
ON CONFLICT DO NOTHING;

-- Structure template : Ivorien Maternelle
INSERT INTO structure_templates (template_key, cycle_code, cycle_name, level_code, level_name, level_order) VALUES
  ('ivorien_maternelle', 'maternelle', 'Maternelle', 'petite', 'Petite section', 1),
  ('ivorien_maternelle', 'maternelle', 'Maternelle', 'moyenne', 'Moyenne section', 2),
  ('ivorien_maternelle', 'maternelle', 'Maternelle', 'grande', 'Grande section', 3)
ON CONFLICT DO NOTHING;

-- Subject templates Collège
INSERT INTO subject_templates (cycle_code, name, default_coefficient, default_group_name, "order", is_secondary) VALUES
  ('ivorien_college', 'Français', 4, 'Fondamentales', 1, false),
  ('ivorien_college', 'Mathématiques', 4, 'Fondamentales', 2, false),
  ('ivorien_college', 'Anglais LV1', 3, 'Langues', 3, false),
  ('ivorien_college', 'Espagnol LV2', 2, 'Langues', 4, true),
  ('ivorien_college', 'Allemand LV2', 2, 'Langues', 5, true),
  ('ivorien_college', 'Histoire-Géographie', 3, 'Sciences humaines', 6, false),
  ('ivorien_college', 'Physique-Chimie', 3, 'Sciences', 7, false),
  ('ivorien_college', 'Sciences de la Vie et de la Terre', 2, 'Sciences', 8, false),
  ('ivorien_college', 'Éducation Civique et Morale', 1, 'Éveil', 9, false),
  ('ivorien_college', 'EPS', 1, 'Éveil', 10, false),
  ('ivorien_college', 'Arts Plastiques', 1, 'Éveil', 11, true),
  ('ivorien_college', 'Musique', 1, 'Éveil', 12, true)
ON CONFLICT DO NOTHING;

-- Subject templates Primaire
INSERT INTO subject_templates (cycle_code, name, default_coefficient, default_group_name, "order", is_secondary) VALUES
  ('ivorien_primaire', 'Français', 4, 'Fondamentales', 1, false),
  ('ivorien_primaire', 'Mathématiques', 4, 'Fondamentales', 2, false),
  ('ivorien_primaire', 'Éveil scientifique', 2, 'Éveil', 3, false),
  ('ivorien_primaire', 'Éducation Civique et Morale', 1, 'Éveil', 4, false),
  ('ivorien_primaire', 'Anglais', 2, 'Langues', 5, true),
  ('ivorien_primaire', 'EPS', 1, 'Éveil', 6, false),
  ('ivorien_primaire', 'Arts', 1, 'Éveil', 7, true),
  ('ivorien_primaire', 'Écriture', 1, 'Fondamentales', 8, false)
ON CONFLICT DO NOTHING;

-- Subject templates Lycée
INSERT INTO subject_templates (cycle_code, name, default_coefficient, default_group_name, "order", is_secondary) VALUES
  ('ivorien_lycee', 'Français', 4, 'Fondamentales', 1, false),
  ('ivorien_lycee', 'Mathématiques', 5, 'Fondamentales', 2, false),
  ('ivorien_lycee', 'Anglais LV1', 3, 'Langues', 3, false),
  ('ivorien_lycee', 'Espagnol LV2', 2, 'Langues', 4, true),
  ('ivorien_lycee', 'Allemand LV2', 2, 'Langues', 5, true),
  ('ivorien_lycee', 'Histoire-Géographie', 3, 'Sciences humaines', 6, false),
  ('ivorien_lycee', 'Physique-Chimie', 4, 'Sciences', 7, false),
  ('ivorien_lycee', 'Sciences de la Vie et de la Terre', 3, 'Sciences', 8, false),
  ('ivorien_lycee', 'Philosophie', 3, 'Sciences humaines', 9, false),
  ('ivorien_lycee', 'EPS', 1, 'Éveil', 10, false)
ON CONFLICT DO NOTHING;

-- Appreciation templates (globaux, disponibles à toutes les écoles)
INSERT INTO appreciation_templates (school_id, label, text, "order") VALUES
  (NULL, 'Excellent trimestre',    'Excellent trimestre, poursuivez ainsi.', 1),
  (NULL, 'Très bon travail',       'Très bon travail, continuez sur cette lancée.', 2),
  (NULL, 'Bon élève',              'Bon élève, sérieux et appliqué.', 3),
  (NULL, 'Bien mais peut mieux',   'Bien mais peut mieux faire.', 4),
  (NULL, 'Doit s''appliquer',      'Doit s''appliquer davantage.', 5),
  (NULL, 'En baisse',              'Résultats en baisse ce trimestre, un ressaisissement est nécessaire.', 6),
  (NULL, 'Élève brillant',         'Élève brillant, félicitations.', 7),
  (NULL, 'Participation active',   'Participation active en classe, félicitations.', 8),
  (NULL, 'Insuffisant',            'Résultats insuffisants, un effort important est attendu.', 9),
  (NULL, 'Absences perturbantes',  'Les absences répétées perturbent la scolarité.', 10)
ON CONFLICT DO NOTHING;
```

- [ ] **Step 4 : Appliquer + vérifier + commit**

```bash
supabase db push --db-url "$SUPABASE_DB_URL"
psql "$SUPABASE_DB_URL" -f supabase/migrations/00040_S3D_templates.test.sql
```

Expected : 6 `pass = true`.

```bash
git add supabase/migrations/00040_S3D_templates.sql \
        supabase/migrations/00040_S3D_templates.test.sql
git commit -m "feat(db): 00040 templates ivoiriens séedés (structure + subjects + appreciations) (S3D fondations)"
```

---

## Task 8 : Migration 00041 — Disponibilité matières + statut période classe

**Files :**
- Create : `supabase/migrations/00041_S3D_availability_status.sql`
- Create : `supabase/migrations/00041_S3D_availability_status.test.sql`

- [ ] **Step 1 : Verification query**

Créer `00041_S3D_availability_status.test.sql` :

```sql
SELECT 'subject_school_year_availability exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'subject_school_year_availability';

SELECT 'classroom_periode_status exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.tables WHERE table_name = 'classroom_periode_status';
```

- [ ] **Step 2 : Vérifier échec**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00041_S3D_availability_status.test.sql
```

Expected : 2 `pass = false`.

- [ ] **Step 3 : Écrire la migration**

Créer `00041_S3D_availability_status.sql` :

```sql
-- =========================================================================
-- Migration 00041 — Disponibilité matières par année + statut clôture période (S3D fondations)
-- =========================================================================

-- Toggle par année pour les matières optionnelles (LV2, musique, arts)
CREATE TABLE IF NOT EXISTS subject_school_year_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  school_year_id TEXT NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(subject_id, school_year_id)
);

CREATE INDEX IF NOT EXISTS idx_ssya_year
  ON subject_school_year_availability(school_year_id);

-- Override calendrier + verrou notes par (classe × période)
CREATE TABLE IF NOT EXISTS classroom_periode_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  periode_id UUID NOT NULL REFERENCES periodes(id) ON DELETE CASCADE,
  actual_end_date DATE,
  notes_locked BOOLEAN NOT NULL DEFAULT false,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  closure_wizard_run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, periode_id)
);

CREATE INDEX IF NOT EXISTS idx_cps_classroom ON classroom_periode_status(classroom_id);
CREATE INDEX IF NOT EXISTS idx_cps_periode ON classroom_periode_status(periode_id);
```

- [ ] **Step 4 : Appliquer + vérifier + commit**

```bash
supabase db push --db-url "$SUPABASE_DB_URL"
psql "$SUPABASE_DB_URL" -f supabase/migrations/00041_S3D_availability_status.test.sql
```

Expected : 2 `pass = true`.

```bash
git add supabase/migrations/00041_S3D_availability_status.sql \
        supabase/migrations/00041_S3D_availability_status.test.sql
git commit -m "feat(db): 00041 subject availability per year + classroom periode status (S3D fondations)"
```

---

## Task 9 : Migration 00042 — Vues SQL

**Files :**
- Create : `supabase/migrations/00042_S3D_views.sql`
- Create : `supabase/migrations/00042_S3D_views.test.sql`

- [ ] **Step 1 : Verification query**

Créer `00042_S3D_views.test.sql` :

```sql
SELECT view_name, COUNT(*) = 1 AS pass
FROM information_schema.views
WHERE table_schema = 'public' AND view_name IN (
  'v_pedagogy_setup_status',
  'v_provisional_averages',
  'v_note_entry_progress',
  'v_class_statistics',
  'v_bulletin_history',
  'v_period_closure_overview',
  'v_classroom_effective_fees',
  'v_classroom_effective_installments',
  'v_ssyl_installment_status'
) GROUP BY view_name;

-- Smoke test : chaque vue doit être queryable (retourne peut-être 0 lignes)
SELECT 'v_pedagogy_setup_status queryable' AS assertion, true AS pass
FROM v_pedagogy_setup_status LIMIT 1;
```

- [ ] **Step 2 : Vérifier échec**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00042_S3D_views.test.sql
```

Expected : 0 lignes + erreur "relation v_pedagogy_setup_status does not exist".

- [ ] **Step 3 : Écrire la migration**

Créer `00042_S3D_views.sql` :

```sql
-- =========================================================================
-- Migration 00042 — Vues SQL (S3D fondations)
-- =========================================================================

-- 1. Statut de la rentrée pédagogique par école (source du hub checklist)
CREATE OR REPLACE VIEW v_pedagogy_setup_status AS
SELECT
  s.id AS school_id,
  sy.id AS school_year_id,
  sy.name AS school_year_name,
  sy.periode_type,
  -- Étape 1 : année active
  (sy.is_current = true AND sy.start_date IS NOT NULL AND sy.end_date IS NOT NULL) AS step_year_done,
  -- Étape 2a : barème école (default_max_score toujours défini via DEFAULT)
  (s.default_max_score IS NOT NULL) AS step_grading_done,
  -- Étape 2b : personnalisation bulletin (facultative)
  (s.logo_url IS NOT NULL OR s.director_signature_url IS NOT NULL) AS step_bulletin_customized,
  -- Étape 2c : types d'élèves définis
  (SELECT COUNT(*) FROM student_types st WHERE st.school_id = s.id) AS student_types_count,
  -- Étape 2d : structure école
  (SELECT COUNT(*) FROM levels l JOIN cycles c ON c.id = l.cycle_id WHERE c.school_id = s.id) AS levels_count,
  (SELECT COUNT(*) FROM classrooms cr JOIN levels l ON l.id = cr.level_id JOIN cycles c ON c.id = l.cycle_id WHERE c.school_id = s.id) AS classrooms_count,
  -- Étape 2e : périodes
  (SELECT COUNT(*) FROM periodes p WHERE p.school_id = s.id AND p.school_year_id = sy.id) AS periodes_count,
  -- Étape 2f : matières
  (SELECT COUNT(*) FROM subjects sub WHERE sub.school_id = s.id) AS subjects_count,
  -- Étape 2g : frais (au moins une ligne par (niveau × type))
  (SELECT COUNT(*) FROM level_fee_lines lfl JOIN levels l ON l.id = lfl.level_id JOIN cycles c ON c.id = l.cycle_id WHERE c.school_id = s.id) AS fee_lines_count,
  -- Étape 2h : enseignants + affectations
  (SELECT COUNT(*) FROM teacher_profiles tp WHERE tp.school_id = s.id) AS teachers_count,
  (SELECT COUNT(*) FROM classroom_subjects cs JOIN classrooms cr ON cr.id = cs.classroom_id JOIN levels l ON l.id = cr.level_id JOIN cycles c ON c.id = l.cycle_id WHERE c.school_id = s.id AND cs.teacher_id IS NOT NULL) AS classroom_subjects_with_teacher_count,
  (SELECT COUNT(*) FROM classrooms cr JOIN levels l ON l.id = cr.level_id JOIN cycles c ON c.id = l.cycle_id WHERE c.school_id = s.id AND cr.principal_teacher_id IS NOT NULL) AS classrooms_with_principal_count
FROM schools s
LEFT JOIN school_years sy ON sy.school_id = s.id AND sy.is_current = true;

COMMENT ON VIEW v_pedagogy_setup_status IS
  'Statut agrégé des 8 étapes de la rentrée pédagogique par école. Consommé par usePedagogySetupStatus() pour le hub /pedagogy.';

-- 2. Moyennes provisoires (calculées à la volée sur notes publiées)
CREATE OR REPLACE VIEW v_provisional_averages AS
SELECT
  ssyl.student_id,
  ssyl.classroom_id,
  e.periode_id,
  cs.subject_id,
  COALESCE(cs.coefficient_override, sub.coefficient) AS coefficient,
  SUM(n.score * e.weight) / NULLIF(SUM(e.weight), 0) AS provisional_subject_avg,
  COUNT(*) AS notes_count,
  MAX(e.date) AS latest_note_date
FROM student_school_year_loggings ssyl
JOIN classroom_subjects cs ON cs.classroom_id = ssyl.classroom_id
JOIN evaluations e ON e.classroom_subject_id = cs.id AND e.is_published = true
JOIN notes n ON n.evaluation_id = e.id AND n.student_id = ssyl.student_id
JOIN subjects sub ON sub.id = cs.subject_id
WHERE n.is_absent = false AND n.is_exempted = false AND n.score IS NOT NULL
GROUP BY ssyl.student_id, ssyl.classroom_id, e.periode_id,
         cs.subject_id, cs.coefficient_override, sub.coefficient;

-- 3. Progrès de saisie (matrice classe × matière × période)
CREATE OR REPLACE VIEW v_note_entry_progress AS
SELECT
  cs.classroom_id,
  cs.subject_id,
  e.periode_id,
  COUNT(DISTINCT e.id) AS total_evaluations,
  COUNT(DISTINCT e.id) FILTER (WHERE e.is_published) AS published_evaluations,
  COUNT(DISTINCT n.student_id) AS students_with_notes,
  (SELECT COUNT(*) FROM student_school_year_loggings ssyl
    WHERE ssyl.classroom_id = cs.classroom_id) AS total_students
FROM classroom_subjects cs
LEFT JOIN evaluations e ON e.classroom_subject_id = cs.id
LEFT JOIN notes n ON n.evaluation_id = e.id
GROUP BY cs.classroom_id, cs.subject_id, e.periode_id;

-- 4. Statistiques classe par matière (histogramme, quartiles)
CREATE OR REPLACE VIEW v_class_statistics AS
SELECT
  bs.subject_id,
  b.classroom_id,
  b.periode_id,
  AVG(bs.average) AS class_average,
  MIN(bs.average) AS min_average,
  MAX(bs.average) AS max_average,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY bs.average) AS median,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY bs.average) AS q1,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY bs.average) AS q3,
  COUNT(*) AS student_count
FROM bulletin_subjects bs
JOIN bulletins b ON b.id = bs.bulletin_id
WHERE bs.average IS NOT NULL
GROUP BY bs.subject_id, b.classroom_id, b.periode_id;

-- 5. Historique bulletins d'un élève sur l'année
CREATE OR REPLACE VIEW v_bulletin_history AS
SELECT
  b.student_id,
  b.classroom_id,
  p.school_year_id,
  p.id AS periode_id,
  p.name AS periode_name,
  p."order" AS periode_order,
  b.average AS general_average,
  b.rank,
  b.total_students,
  b.status,
  b.current_version,
  bs.subject_id,
  bs.average AS subject_average,
  bs.rank AS subject_rank
FROM bulletins b
JOIN periodes p ON p.id = b.periode_id
LEFT JOIN bulletin_subjects bs ON bs.bulletin_id = b.id
WHERE b.status = 'published';

-- 6. Overview de clôture période (agrégat pour hub bulletins)
CREATE OR REPLACE VIEW v_period_closure_overview AS
SELECT
  p.school_id,
  p.id AS periode_id,
  p.name AS periode_name,
  cr.id AS classroom_id,
  cr.name AS classroom_name,
  l.name AS level_name,
  COALESCE(cps.notes_locked, false) AS notes_locked,
  cps.actual_end_date,
  COUNT(b.id) FILTER (WHERE b.status = 'draft') AS bulletins_draft,
  COUNT(b.id) FILTER (WHERE b.status = 'ready_censeur') AS bulletins_ready_censeur,
  COUNT(b.id) FILTER (WHERE b.status = 'ready_director') AS bulletins_ready_director,
  COUNT(b.id) FILTER (WHERE b.status = 'published') AS bulletins_published,
  (SELECT COUNT(*) FROM student_school_year_loggings ssyl WHERE ssyl.classroom_id = cr.id) AS total_students
FROM periodes p
CROSS JOIN classrooms cr
JOIN levels l ON l.id = cr.level_id
JOIN cycles c ON c.id = l.cycle_id
LEFT JOIN classroom_periode_status cps ON cps.classroom_id = cr.id AND cps.periode_id = p.id
LEFT JOIN bulletins b ON b.classroom_id = cr.id AND b.periode_id = p.id
WHERE c.school_id = p.school_id
GROUP BY p.school_id, p.id, p.name, cr.id, cr.name, l.name, cps.notes_locked, cps.actual_end_date;

-- 7. Résolution frais effectifs par (classe × type d'élève)
CREATE OR REPLACE VIEW v_classroom_effective_fees AS
  -- Overrides classe
  SELECT
    cfl.classroom_id,
    cfl.student_type_id,
    cfl.category,
    cfl.label,
    cfl.amount,
    cfl."order",
    'classroom_override'::text AS source
  FROM classroom_fee_lines cfl
  UNION ALL
  -- Lignes niveau non-overridées
  SELECT
    cr.id AS classroom_id,
    lfl.student_type_id,
    lfl.category,
    lfl.label,
    lfl.amount,
    lfl."order",
    'level'::text AS source
  FROM classrooms cr
  JOIN level_fee_lines lfl ON lfl.level_id = cr.level_id
  WHERE NOT EXISTS (
    SELECT 1 FROM classroom_fee_lines cfl2
    WHERE cfl2.classroom_id = cr.id
      AND cfl2.student_type_id = lfl.student_type_id
      AND cfl2.overrides_level_line_id = lfl.id
  );

-- 8. Résolution échéances effectives par (classe × type d'élève)
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
    (sy.start_date + (lfi.due_date_offset_days || ' days')::interval)::date AS due_date,
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
    SELECT sy2.start_date FROM school_years sy2
    JOIN cycles c ON c.school_id = sy2.school_id
    JOIN levels l ON l.cycle_id = c.id AND l.id = cr.level_id
    WHERE sy2.is_current = true LIMIT 1
  ) sy
  WHERE NOT EXISTS (
    SELECT 1 FROM classroom_fee_installments cfi2
    WHERE cfi2.classroom_id = cr.id
      AND cfi2.student_type_id = lfi.student_type_id
      AND cfi2.overrides_level_installment_id = lfi.id
  );

-- 9. Statut par tranche pour un élève (source du wizard fees + reçu + parent)
CREATE OR REPLACE VIEW v_ssyl_installment_status AS
SELECT
  ssyl.id AS ssyl_id,
  cfi.id AS installment_id,
  cfi.label,
  cfi.category,
  cfi.due_date,
  cfi.amount AS amount_due,
  COALESCE(SUM(pa.allocated_amount), 0) AS amount_paid,
  CASE
    WHEN COALESCE(SUM(pa.allocated_amount), 0) >= cfi.amount THEN 'paid'
    WHEN COALESCE(SUM(pa.allocated_amount), 0) > 0 THEN 'partial'
    WHEN cfi.due_date < CURRENT_DATE THEN 'overdue'
    WHEN cfi.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due'
    ELSE 'future'
  END AS status
FROM student_school_year_loggings ssyl
JOIN students st ON st.id = ssyl.student_id
JOIN classroom_fee_installments cfi
  ON cfi.classroom_id = ssyl.classroom_id
 AND cfi.student_type_id = st.student_type_id
LEFT JOIN payment_allocations pa ON pa.fee_installment_id = cfi.id
GROUP BY ssyl.id, cfi.id, cfi.label, cfi.category, cfi.due_date, cfi.amount;

COMMENT ON VIEW v_ssyl_installment_status IS
  'Statut de chaque échéance d''un élève : paid / partial / due / overdue / future. Utilisée par wizard inscription, reçu paiement, parent app, recouvrement.';
```

- [ ] **Step 4 : Appliquer**

```bash
supabase db push --db-url "$SUPABASE_DB_URL"
```

- [ ] **Step 5 : Vérifier**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00042_S3D_views.test.sql
```

Expected : 9 lignes `pass = true` pour l'existence + le smoke test OK.

- [ ] **Step 6 : Commit**

```bash
git add supabase/migrations/00042_S3D_views.sql \
        supabase/migrations/00042_S3D_views.test.sql
git commit -m "feat(db): 00042 9 vues SQL (pedagogy status, provisional avg, bulletin history, fees, etc.) (S3D fondations)"
```

---

## Task 10 : Migration 00043 — Fonctions SQL (state machine + ventilation)

**Files :**
- Create : `supabase/migrations/00043_S3D_functions.sql`
- Create : `supabase/migrations/00043_S3D_functions.test.sql`

- [ ] **Step 1 : Verification query**

Créer `00043_S3D_functions.test.sql` :

```sql
SELECT p.proname, COUNT(*) = 1 AS pass
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN (
  'advance_bulletin_status',
  'allocate_payment_to_installments',
  'seed_pedagogy_for_school',
  'seed_structure_for_school',
  'close_period_for_classrooms',
  'compute_annual_average',
  'apply_level_fees_to_classrooms',
  'trigger_on_level_created'
) GROUP BY p.proname;
```

- [ ] **Step 2 : Vérifier échec**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00043_S3D_functions.test.sql
```

Expected : 0 lignes.

- [ ] **Step 3 : Écrire la migration**

Créer `00043_S3D_functions.sql` :

```sql
-- =========================================================================
-- Migration 00043 — Fonctions SQL (state machine bulletins + ventilation paiements) (S3D fondations)
-- =========================================================================

-- 1. State machine bulletin
CREATE OR REPLACE FUNCTION advance_bulletin_status(
  p_bulletin_id UUID,
  p_target_status TEXT,
  p_actor_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_bulletin RECORD;
  v_missing_appreciations INT;
  v_snapshot JSONB;
  v_new_version INT;
BEGIN
  -- Verrou pessimiste pour éviter les accès concurrents
  SELECT * INTO v_bulletin FROM bulletins WHERE id = p_bulletin_id FOR UPDATE;

  IF v_bulletin.id IS NULL THEN
    RAISE EXCEPTION 'advance_bulletin_status : bulletin % introuvable', p_bulletin_id;
  END IF;

  -- Transitions autorisées
  IF NOT (
    (v_bulletin.status = 'draft'          AND p_target_status = 'ready_censeur') OR
    (v_bulletin.status = 'ready_censeur'  AND p_target_status = 'ready_director') OR
    (v_bulletin.status = 'ready_director' AND p_target_status = 'published') OR
    (v_bulletin.status = 'published'      AND p_target_status = 'draft') -- ré-ouverture
  ) THEN
    RAISE EXCEPTION 'Transition non autorisée : % → %', v_bulletin.status, p_target_status;
  END IF;

  -- Guard : appréciations obligatoires avant ready_censeur
  IF p_target_status = 'ready_censeur' THEN
    SELECT COUNT(*) INTO v_missing_appreciations
    FROM bulletin_subjects bs
    WHERE bs.bulletin_id = p_bulletin_id
      AND (bs.teacher_appreciation IS NULL OR bs.teacher_appreciation = '');

    IF v_missing_appreciations > 0 AND p_reason IS NULL THEN
      RAISE EXCEPTION 'Appréciations manquantes (% matières). Fournir une raison pour override directeur.', v_missing_appreciations;
    END IF;
  END IF;

  -- Guard : ré-ouverture requiert raison
  IF p_target_status = 'draft' AND (p_reason IS NULL OR p_reason = '') THEN
    RAISE EXCEPTION 'Ré-ouverture requiert une raison écrite.';
  END IF;

  -- Update statut + tracking acteur
  UPDATE bulletins SET
    status = p_target_status,
    updated_at = now(),
    finalized_by = CASE WHEN p_target_status = 'ready_censeur' THEN p_actor_id ELSE finalized_by END,
    finalized_at = CASE WHEN p_target_status = 'ready_censeur' THEN now() ELSE finalized_at END,
    validated_by = CASE WHEN p_target_status = 'ready_director' THEN p_actor_id ELSE validated_by END,
    validated_at = CASE WHEN p_target_status = 'ready_director' THEN now() ELSE validated_at END,
    published_by = CASE WHEN p_target_status = 'published' THEN p_actor_id ELSE published_by END,
    published_at = CASE WHEN p_target_status = 'published' THEN now() ELSE published_at END
  WHERE id = p_bulletin_id;

  -- À la publication : snapshot dans bulletin_versions
  IF p_target_status = 'published' THEN
    v_new_version := v_bulletin.current_version;

    SELECT jsonb_build_object(
      'bulletin', row_to_json(b),
      'subjects', (SELECT jsonb_agg(row_to_json(bs)) FROM bulletin_subjects bs WHERE bs.bulletin_id = b.id)
    ) INTO v_snapshot
    FROM bulletins b WHERE b.id = p_bulletin_id;

    INSERT INTO bulletin_versions (bulletin_id, version_number, snapshot, published_by, reason_for_edit)
    VALUES (p_bulletin_id, v_new_version, v_snapshot, p_actor_id, p_reason);
  END IF;

  -- À la ré-ouverture : incrémenter version pour la prochaine publi
  IF p_target_status = 'draft' AND v_bulletin.status = 'published' THEN
    UPDATE bulletins SET current_version = current_version + 1 WHERE id = p_bulletin_id;
  END IF;

  RETURN p_bulletin_id;
END $$;

GRANT EXECUTE ON FUNCTION advance_bulletin_status(UUID, TEXT, UUID, TEXT) TO authenticated;

-- 2. Ventilation automatique des paiements sur les échéances (FIFO due_date)
CREATE OR REPLACE FUNCTION allocate_payment_to_installments(
  p_ssyl_id TEXT,
  p_payment_tx_id UUID,
  p_amount BIGINT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_installment RECORD;
  v_payment_left BIGINT := p_amount;
  v_to_allocate BIGINT;
  v_remaining BIGINT;
  v_breakdown JSONB := '[]'::jsonb;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'allocate_payment : montant doit être > 0';
  END IF;

  -- Éviter double-ventilation (idempotence)
  IF EXISTS (SELECT 1 FROM payment_allocations WHERE payment_tx_id = p_payment_tx_id) THEN
    RAISE NOTICE 'Payment tx % déjà ventilé, skip', p_payment_tx_id;
    RETURN v_breakdown;
  END IF;

  -- Loop sur les échéances non-soldées, tri due_date ASC
  FOR v_installment IN
    SELECT
      vsi.installment_id,
      vsi.amount_due,
      vsi.amount_paid,
      vsi.amount_due - vsi.amount_paid AS remaining_due
    FROM v_ssyl_installment_status vsi
    WHERE vsi.ssyl_id = p_ssyl_id
      AND vsi.status IN ('overdue', 'due', 'partial', 'future')
      AND (vsi.amount_due - vsi.amount_paid) > 0
    ORDER BY vsi.due_date ASC
  LOOP
    EXIT WHEN v_payment_left <= 0;

    v_to_allocate := LEAST(v_payment_left, v_installment.remaining_due::BIGINT);

    INSERT INTO payment_allocations (payment_tx_id, fee_installment_id, allocated_amount)
    VALUES (p_payment_tx_id, v_installment.installment_id, v_to_allocate);

    v_breakdown := v_breakdown || jsonb_build_object(
      'installment_id', v_installment.installment_id,
      'allocated', v_to_allocate,
      'remaining_after', v_installment.remaining_due - v_to_allocate
    );

    v_payment_left := v_payment_left - v_to_allocate;
  END LOOP;

  -- Surplus (trop-perçu) : allocation NULL
  IF v_payment_left > 0 THEN
    INSERT INTO payment_allocations (payment_tx_id, fee_installment_id, allocated_amount)
    VALUES (p_payment_tx_id, NULL, v_payment_left);

    v_breakdown := v_breakdown || jsonb_build_object(
      'installment_id', NULL,
      'allocated', v_payment_left,
      'note', 'surplus'
    );
  END IF;

  RETURN v_breakdown;
END $$;

GRANT EXECUTE ON FUNCTION allocate_payment_to_installments(TEXT, UUID, BIGINT) TO authenticated;

-- 3. Seed pédagogie depuis template
CREATE OR REPLACE FUNCTION seed_pedagogy_for_school(
  p_school_id TEXT,
  p_cycle_code TEXT
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_group_id UUID;
  v_group_name TEXT;
  v_template RECORD;
  v_count INT := 0;
BEGIN
  FOR v_template IN
    SELECT * FROM subject_templates WHERE cycle_code = p_cycle_code ORDER BY "order"
  LOOP
    -- Récupérer ou créer le groupe
    SELECT id INTO v_group_id FROM subject_groups
    WHERE school_id = p_school_id AND name = v_template.default_group_name LIMIT 1;

    IF v_group_id IS NULL THEN
      INSERT INTO subject_groups (school_id, name, "order")
      VALUES (p_school_id, v_template.default_group_name, v_count)
      RETURNING id INTO v_group_id;
    END IF;

    -- Insérer la matière
    INSERT INTO subjects (school_id, group_id, name, coefficient)
    VALUES (p_school_id, v_group_id, v_template.name, v_template.default_coefficient)
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION seed_pedagogy_for_school(TEXT, TEXT) TO authenticated;

-- 4. Seed structure depuis template
CREATE OR REPLACE FUNCTION seed_structure_for_school(
  p_school_id TEXT,
  p_template_key TEXT
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cycle_id TEXT;
  v_template RECORD;
  v_count INT := 0;
BEGIN
  -- Créer le cycle si absent (basé sur cycle_code du template)
  FOR v_template IN
    SELECT DISTINCT cycle_code, cycle_name FROM structure_templates WHERE template_key = p_template_key
  LOOP
    SELECT id INTO v_cycle_id FROM cycles
    WHERE school_id = p_school_id AND name = v_template.cycle_name LIMIT 1;

    IF v_cycle_id IS NULL THEN
      -- Assume cycles.id is TEXT (based on existing schema pattern)
      v_cycle_id := p_school_id || '-' || v_template.cycle_code;
      INSERT INTO cycles (id, school_id, name)
      VALUES (v_cycle_id, p_school_id, v_template.cycle_name)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Créer les niveaux
  FOR v_template IN
    SELECT * FROM structure_templates WHERE template_key = p_template_key ORDER BY level_order
  LOOP
    SELECT id INTO v_cycle_id FROM cycles
    WHERE school_id = p_school_id AND name = v_template.cycle_name LIMIT 1;

    INSERT INTO levels (id, school_id, cycle_id, name, "order")
    VALUES (
      p_school_id || '-' || v_template.level_code,
      p_school_id,
      v_cycle_id,
      v_template.level_name,
      v_template.level_order
    )
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  -- Marquer l'école comme séedée
  UPDATE schools SET structure_seeded_from = p_template_key WHERE id = p_school_id;

  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION seed_structure_for_school(TEXT, TEXT) TO authenticated;

-- 5. Clôture batch d'une période sur plusieurs classes
CREATE OR REPLACE FUNCTION close_period_for_classrooms(
  p_periode_id UUID,
  p_classroom_ids TEXT[],
  p_actor_id UUID,
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_classroom_id TEXT;
  v_wizard_run_id UUID := gen_random_uuid();
  v_count INT := 0;
BEGIN
  FOREACH v_classroom_id IN ARRAY p_classroom_ids LOOP
    INSERT INTO classroom_periode_status
      (classroom_id, periode_id, actual_end_date, notes_locked, locked_at, locked_by, closure_wizard_run_id)
    VALUES
      (v_classroom_id, p_periode_id, p_end_date, true, now(), p_actor_id, v_wizard_run_id)
    ON CONFLICT (classroom_id, periode_id) DO UPDATE SET
      actual_end_date = EXCLUDED.actual_end_date,
      notes_locked = true,
      locked_at = now(),
      locked_by = p_actor_id,
      closure_wizard_run_id = v_wizard_run_id;

    -- Trigger compute_bulletin() (fonction existante)
    PERFORM compute_bulletin(v_classroom_id, p_periode_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION close_period_for_classrooms(UUID, TEXT[], UUID, DATE) TO authenticated;

-- 6. Calcul moyenne annuelle
CREATE OR REPLACE FUNCTION compute_annual_average(p_bulletin_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_bulletin RECORD;
  v_annual NUMERIC;
BEGIN
  SELECT b.*, p.school_year_id
  INTO v_bulletin
  FROM bulletins b
  JOIN periodes p ON p.id = b.periode_id
  WHERE b.id = p_bulletin_id;

  -- Moyenne simple des périodes publiées de l'année pour cet élève
  SELECT AVG(b2.average)
  INTO v_annual
  FROM bulletins b2
  JOIN periodes p2 ON p2.id = b2.periode_id
  WHERE b2.student_id = v_bulletin.student_id
    AND p2.school_year_id = v_bulletin.school_year_id
    AND b2.status = 'published'
    AND b2.average IS NOT NULL;

  UPDATE bulletins SET annual_average = ROUND(v_annual, 2)
  WHERE id = p_bulletin_id;

  RETURN v_annual;
END $$;

GRANT EXECUTE ON FUNCTION compute_annual_average(UUID) TO authenticated;

-- 7. Propagation frais niveau → classes
CREATE OR REPLACE FUNCTION apply_level_fees_to_classrooms(
  p_level_id TEXT,
  p_student_type_id UUID DEFAULT NULL
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count INT;
BEGIN
  -- Delete les overrides qui n'ont pas de "custom" (i.e., overrides_level_line_id pas null → override existant, sinon custom classe)
  WITH deleted AS (
    DELETE FROM classroom_fee_lines cfl
    WHERE cfl.classroom_id IN (SELECT id FROM classrooms WHERE level_id = p_level_id)
      AND cfl.overrides_level_line_id IS NOT NULL
      AND (p_student_type_id IS NULL OR cfl.student_type_id = p_student_type_id)
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM deleted;

  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION apply_level_fees_to_classrooms(TEXT, UUID) TO authenticated;

-- 8. Trigger : à la création d'un niveau, hydrater fee_lines + installments pour chaque student_type de l'école
CREATE OR REPLACE FUNCTION trigger_on_level_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_school_id TEXT;
  v_type RECORD;
  v_template JSONB;
  v_line JSONB;
  v_installment JSONB;
  v_order INT;
BEGIN
  SELECT school_id INTO v_school_id FROM cycles WHERE id = NEW.cycle_id;

  SELECT default_fee_template INTO v_template FROM schools WHERE id = v_school_id;

  FOR v_type IN SELECT id FROM student_types WHERE school_id = v_school_id LOOP
    v_order := 0;
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
      v_order := v_order + 1;
    END LOOP;

    FOR v_installment IN SELECT * FROM jsonb_array_elements(v_template->'installments') LOOP
      INSERT INTO level_fee_installments
        (level_id, student_type_id, "order", label, category, due_date_offset_days, amount, amount_percentage)
      VALUES (
        NEW.id, v_type.id,
        (v_installment->>'order')::INT, v_installment->>'label', v_installment->>'category',
        (v_installment->>'due_date_offset_days')::INT,
        (v_installment->>'amount')::NUMERIC,
        (v_installment->>'amount_percentage')::NUMERIC
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_level_created ON levels;
CREATE TRIGGER on_level_created
  AFTER INSERT ON levels
  FOR EACH ROW
  EXECUTE FUNCTION trigger_on_level_created();
```

- [ ] **Step 4 : Appliquer**

```bash
supabase db push --db-url "$SUPABASE_DB_URL"
```

- [ ] **Step 5 : Vérifier**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00043_S3D_functions.test.sql
```

Expected : 8 lignes `pass = true`.

- [ ] **Step 6 : Commit**

```bash
git add supabase/migrations/00043_S3D_functions.sql \
        supabase/migrations/00043_S3D_functions.test.sql
git commit -m "feat(db): 00043 SQL functions (advance_bulletin_status, allocate_payment, seed_*, close_period) (S3D fondations)"
```

---

## Task 11 : Migration 00044 — RLS policies

**Files :**
- Create : `supabase/migrations/00044_S3D_rls.sql`
- Create : `supabase/migrations/00044_S3D_rls.test.sql`

- [ ] **Step 1 : Verification query**

Créer `00044_S3D_rls.test.sql` :

```sql
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN (
  'student_types', 'bulletin_versions', 'notes_audit', 'teacher_invitations',
  'level_fee_lines', 'level_fee_installments',
  'classroom_fee_lines', 'classroom_fee_installments',
  'payment_allocations', 'subject_school_year_availability',
  'classroom_periode_status', 'subject_templates', 'structure_templates', 'appreciation_templates'
);
```

- [ ] **Step 2 : Vérifier échec (RLS pas encore activée)**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00044_S3D_rls.test.sql
```

Expected : la plupart en `rls_enabled = false`.

- [ ] **Step 3 : Écrire la migration**

Créer `00044_S3D_rls.sql` :

```sql
-- =========================================================================
-- Migration 00044 — RLS policies (S3D fondations)
--
-- Toutes les nouvelles tables sont scopées par école. On réutilise les
-- helpers existants : get_parent_family_id, get_parent_student_ids,
-- get_parent_school_id, get_school_staff_school_id, is_admin.
-- =========================================================================

-- Enable RLS sur toutes les nouvelles tables
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

-- Policies

-- student_types : staff école R/W, parent lecture (pour affichage bulletin)
CREATE POLICY student_types_school_staff_all ON student_types
  FOR ALL TO authenticated
  USING (is_admin() OR school_id = get_school_staff_school_id())
  WITH CHECK (is_admin() OR school_id = get_school_staff_school_id());

CREATE POLICY student_types_parent_read ON student_types
  FOR SELECT TO authenticated
  USING (school_id = get_parent_school_id());

-- bulletin_versions : staff école R, parent R (pour ses enfants uniquement)
CREATE POLICY bulletin_versions_read ON bulletin_versions
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM bulletins b JOIN classrooms cr ON cr.id = b.classroom_id
      JOIN levels l ON l.id = cr.level_id JOIN cycles c ON c.id = l.cycle_id
      WHERE b.id = bulletin_versions.bulletin_id
        AND (c.school_id = get_school_staff_school_id() OR b.student_id = ANY(get_parent_student_ids()))
    )
  );

-- notes_audit : staff école R uniquement (audit trail)
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

-- teacher_invitations : staff école R/W
CREATE POLICY teacher_invitations_staff_all ON teacher_invitations
  FOR ALL TO authenticated
  USING (is_admin() OR school_id = get_school_staff_school_id())
  WITH CHECK (is_admin() OR school_id = get_school_staff_school_id());

-- level_fee_* : staff école R/W, parent R (échéancier)
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

-- classroom_fee_* : idem
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

-- payment_allocations : staff école R, parent R (ses paiements)
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

-- subject_school_year_availability : staff école R/W, tous R
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

-- classroom_periode_status : staff école R/W
CREATE POLICY cps_staff_all ON classroom_periode_status
  FOR ALL TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM classrooms cr JOIN levels l ON l.id = cr.level_id JOIN cycles c ON c.id = l.cycle_id
      WHERE cr.id = classroom_periode_status.classroom_id
        AND c.school_id = get_school_staff_school_id()
    )
  );

-- Templates (structure/subject/appreciation) : lecture publique
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
```

- [ ] **Step 4 : Appliquer**

```bash
supabase db push --db-url "$SUPABASE_DB_URL"
```

- [ ] **Step 5 : Vérifier**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00044_S3D_rls.test.sql
```

Expected : 14 lignes toutes en `rls_enabled = true`.

- [ ] **Step 6 : Commit**

```bash
git add supabase/migrations/00044_S3D_rls.sql \
        supabase/migrations/00044_S3D_rls.test.sql
git commit -m "feat(db): 00044 RLS policies sur les 14 nouvelles tables S3D (S3D fondations)"
```

---

## Task 12 : Migration 00045 — Backfill écoles legacy

**Files :**
- Create : `supabase/migrations/00045_S3D_backfill_legacy.sql`

- [ ] **Step 1 : Écrire la migration (idempotente)**

Créer `00045_S3D_backfill_legacy.sql` :

```sql
-- =========================================================================
-- Migration 00045 — Backfill écoles legacy (sync MySQL) (S3D fondations)
--
-- One-off idempotent : marque la data synchronisée comme non-native,
-- crée les student_types par défaut pour les écoles legacy qui n'en ont pas
-- (le trigger on_school_created ne s'est jamais déclenché pour elles),
-- crée les périodes par défaut de l'année en cours si absentes.
-- =========================================================================

-- 1. Marquer la data existante comme non-native
UPDATE cycles SET created_natively = false WHERE created_natively = true AND created_at < '2026-07-01';
UPDATE levels SET created_natively = false WHERE created_natively = true AND created_at < '2026-07-01';
UPDATE classrooms SET created_natively = false WHERE created_natively = true AND created_at < '2026-07-01';

-- 2. Seed student_types pour les écoles legacy
INSERT INTO student_types (school_id, code, label, "order", is_default)
SELECT s.id, 'not_affected', 'Élève non-affecté', 1, true
FROM schools s
WHERE NOT EXISTS (
  SELECT 1 FROM student_types st WHERE st.school_id = s.id
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

-- 3. Créer periodes T1/T2/T3 par défaut pour l'année en cours des écoles legacy
INSERT INTO periodes (school_id, school_year_id, name, type, "order", start_date, end_date, is_published)
SELECT
  sy.school_id, sy.id, 'Trimestre 1', 'trimestre', 1,
  sy.start_date,
  sy.start_date + INTERVAL '3 months',
  false
FROM school_years sy
WHERE sy.is_current = true
  AND NOT EXISTS (
    SELECT 1 FROM periodes p WHERE p.school_year_id = sy.id
  )
ON CONFLICT DO NOTHING;

INSERT INTO periodes (school_id, school_year_id, name, type, "order", start_date, end_date, is_published)
SELECT
  sy.school_id, sy.id, 'Trimestre 2', 'trimestre', 2,
  sy.start_date + INTERVAL '3 months',
  sy.start_date + INTERVAL '6 months',
  false
FROM school_years sy
WHERE sy.is_current = true
  AND (SELECT COUNT(*) FROM periodes p WHERE p.school_year_id = sy.id) = 1
ON CONFLICT DO NOTHING;

INSERT INTO periodes (school_id, school_year_id, name, type, "order", start_date, end_date, is_published)
SELECT
  sy.school_id, sy.id, 'Trimestre 3', 'trimestre', 3,
  sy.start_date + INTERVAL '6 months',
  sy.end_date,
  false
FROM school_years sy
WHERE sy.is_current = true
  AND (SELECT COUNT(*) FROM periodes p WHERE p.school_year_id = sy.id) = 2
ON CONFLICT DO NOTHING;

-- 4. Set periode_type sur school_years qui n'en ont pas
UPDATE school_years SET periode_type = 'trimestre' WHERE periode_type IS NULL AND is_current = true;

-- 5. Marquer les students au type par défaut de leur école
UPDATE students st SET student_type_id = (
  SELECT stype.id FROM student_types stype
  WHERE stype.school_id = st.school_id AND stype.is_default = true LIMIT 1
) WHERE st.student_type_id IS NULL AND st.school_id IS NOT NULL;
```

Note : cette migration `Bombshell` fait des choses lourdes. À exécuter avec précaution — probablement en une session dédiée pour l'inspecter avant application.

- [ ] **Step 2 : Appliquer (avec dry-run recommandé)**

```bash
# Dry-run visuel : voir combien de rows seraient impactées
psql "$SUPABASE_DB_URL" -c "SELECT COUNT(*) FROM schools;"
psql "$SUPABASE_DB_URL" -c "SELECT COUNT(*) FROM student_types;"
psql "$SUPABASE_DB_URL" -c "SELECT COUNT(*) FROM periodes;"

# Application
supabase db push --db-url "$SUPABASE_DB_URL"
```

- [ ] **Step 3 : Vérifier post-backfill**

```bash
# Chaque école doit avoir >= 3 student_types
psql "$SUPABASE_DB_URL" -c "SELECT school_id, COUNT(*) FROM student_types GROUP BY school_id;"

# Chaque année en cours doit avoir 3 periodes
psql "$SUPABASE_DB_URL" -c "SELECT school_year_id, COUNT(*) FROM periodes GROUP BY school_year_id;"
```

Expected : chaque école a 3 types minimum, chaque année 3 périodes.

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/00045_S3D_backfill_legacy.sql
git commit -m "feat(db): 00045 backfill écoles legacy (student_types + periodes par défaut) (S3D fondations)"
```

---

## Task 13 : Régénérer les types TypeScript

**Files :**
- Modify : `packages/shared/src/types/database.types.ts`

- [ ] **Step 1 : Régénérer via Supabase CLI**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
supabase gen types typescript --project-id ejwqvahlnmysxeerqrrv \
  > packages/shared/src/types/database.types.ts
```

- [ ] **Step 2 : Vérifier que les nouvelles tables sont présentes**

```bash
grep -E "student_types|bulletin_versions|level_fee_lines|payment_allocations" \
  packages/shared/src/types/database.types.ts | head -10
```

Expected : chaque type est bien exporté (Row / Insert / Update).

- [ ] **Step 3 : Vérifier que le build shared passe**

```bash
pnpm --filter @edukea/shared build 2>&1 | tail -20
```

Expected : compilation TS sans erreur.

- [ ] **Step 4 : Commit**

```bash
git add packages/shared/src/types/database.types.ts
git commit -m "chore(shared): regen database.types after S3D migrations (S3D fondations)"
```

---

## Task 14 : Hook `usePedagogySetupStatus`

**Files :**
- Create : `packages/shared/src/hooks/usePedagogySetupStatus.ts`
- Create : `packages/shared/src/hooks/__tests__/usePedagogySetupStatus.test.ts`
- Modify : `packages/shared/src/hooks/index.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `packages/shared/src/hooks/__tests__/usePedagogySetupStatus.test.ts` :

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePedagogySetupStatus } from '../usePedagogySetupStatus';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('usePedagogySetupStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when schoolId is undefined', () => {
    const { result } = renderHook(() => usePedagogySetupStatus(undefined), { wrapper });
    expect(result.current.data).toBeUndefined();
  });

  it('fetches v_pedagogy_setup_status for a given schoolId', async () => {
    const mockRow = {
      school_id: 'school-1',
      school_year_id: 'sy-1',
      school_year_name: '2026-2027',
      periode_type: 'trimestre',
      step_year_done: true,
      step_grading_done: true,
      step_bulletin_customized: false,
      student_types_count: 3,
      levels_count: 4,
      classrooms_count: 12,
      periodes_count: 3,
      subjects_count: 12,
      fee_lines_count: 45,
      teachers_count: 15,
      classroom_subjects_with_teacher_count: 40,
      classrooms_with_principal_count: 8,
    };

    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
      }),
    });
    (supabase.from as any).mockReturnValue({ select: selectMock });

    const { result } = renderHook(() => usePedagogySetupStatus('school-1'), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.school_id).toBe('school-1');
    expect(result.current.data?.student_types_count).toBe(3);
    expect(supabase.from).toHaveBeenCalledWith('v_pedagogy_setup_status');
  });

  it('returns computed step statuses (fait / partiel / à faire / verrouillé / facultatif)', async () => {
    const mockRow = {
      school_id: 'school-1',
      school_year_id: 'sy-1',
      school_year_name: '2026-2027',
      periode_type: 'trimestre',
      step_year_done: true,
      step_grading_done: true,
      step_bulletin_customized: false,
      student_types_count: 3,
      levels_count: 0,  // structure pas faite
      classrooms_count: 0,
      periodes_count: 3,
      subjects_count: 0, // subjects pas faits (bloqué par structure)
      fee_lines_count: 0,
      teachers_count: 0,
      classroom_subjects_with_teacher_count: 0,
      classrooms_with_principal_count: 0,
    };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => usePedagogySetupStatus('school-1'), { wrapper });

    await waitFor(() => expect(result.current.steps).toBeDefined());
    const steps = result.current.steps!;
    expect(steps.year.status).toBe('done');
    expect(steps.grading.status).toBe('done');
    expect(steps.bulletin_customization.status).toBe('optional');
    expect(steps.student_types.status).toBe('done');
    expect(steps.structure.status).toBe('todo');
    expect(steps.periods.status).toBe('done');
    expect(steps.subjects.status).toBe('locked'); // dépend de structure
    expect(steps.fees.status).toBe('locked');     // dépend de types + structure
    expect(steps.teachers_assignments.status).toBe('locked');
  });
});
```

- [ ] **Step 2 : Lancer le test, vérifier qu'il échoue**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
pnpm --filter @edukea/shared test usePedagogySetupStatus 2>&1 | tail -30
```

Expected : erreur "Cannot find module '../usePedagogySetupStatus'".

- [ ] **Step 3 : Écrire le hook**

Créer `packages/shared/src/hooks/usePedagogySetupStatus.ts` :

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type StepStatus = 'done' | 'partial' | 'todo' | 'locked' | 'optional';

export interface PedagogySetupStatus {
  school_id: string;
  school_year_id: string | null;
  school_year_name: string | null;
  periode_type: 'trimestre' | 'semestre' | null;
  step_year_done: boolean;
  step_grading_done: boolean;
  step_bulletin_customized: boolean;
  student_types_count: number;
  levels_count: number;
  classrooms_count: number;
  periodes_count: number;
  subjects_count: number;
  fee_lines_count: number;
  teachers_count: number;
  classroom_subjects_with_teacher_count: number;
  classrooms_with_principal_count: number;
}

export interface PedagogyStep {
  key: string;
  order: number;
  label: string;
  status: StepStatus;
  detail: string;
  route: string;
}

export interface PedagogyStepsMap {
  year: PedagogyStep;
  grading: PedagogyStep;
  bulletin_customization: PedagogyStep;
  student_types: PedagogyStep;
  structure: PedagogyStep;
  periods: PedagogyStep;
  subjects: PedagogyStep;
  fees: PedagogyStep;
  teachers_assignments: PedagogyStep;
}

function computeSteps(data: PedagogySetupStatus): PedagogyStepsMap {
  const structureDone = data.levels_count > 0 && data.classrooms_count > 0;
  const typesDone = data.student_types_count >= 1;
  const subjectsDone = data.subjects_count > 0;

  return {
    year: {
      key: 'year',
      order: 1,
      label: 'Année scolaire',
      status: data.step_year_done ? 'done' : 'todo',
      detail: data.school_year_name ?? 'À créer',
      route: '/dashboard/pedagogy/school-year',
    },
    grading: {
      key: 'grading',
      order: 2,
      label: 'Barème école',
      status: data.step_grading_done ? 'done' : 'todo',
      detail: 'Notation sur /20 (défaut)',
      route: '/dashboard/pedagogy/grading',
    },
    bulletin_customization: {
      key: 'bulletin_customization',
      order: 3,
      label: 'Personnalisation bulletin',
      status: data.step_bulletin_customized ? 'done' : 'optional',
      detail: data.step_bulletin_customized ? 'Logo + signatures uploadés' : 'Facultatif',
      route: '/dashboard/pedagogy/bulletin-template',
    },
    student_types: {
      key: 'student_types',
      order: 4,
      label: "Types d'élèves",
      status: typesDone ? 'done' : 'todo',
      detail: `${data.student_types_count} type(s) défini(s)`,
      route: '/dashboard/pedagogy/student-types',
    },
    structure: {
      key: 'structure',
      order: 5,
      label: 'Structure école',
      status: structureDone ? 'done' : 'todo',
      detail: `${data.levels_count} niveaux · ${data.classrooms_count} classes`,
      route: '/dashboard/pedagogy/structure',
    },
    periods: {
      key: 'periods',
      order: 6,
      label: "Périodes de l'année",
      status: !data.step_year_done ? 'locked'
            : data.periodes_count === 0 ? 'todo'
            : data.periode_type === 'trimestre' && data.periodes_count < 3 ? 'partial'
            : data.periode_type === 'semestre' && data.periodes_count < 2 ? 'partial'
            : 'done',
      detail: `${data.periodes_count} période(s) configurée(s)`,
      route: '/dashboard/pedagogy/periods',
    },
    subjects: {
      key: 'subjects',
      order: 7,
      label: 'Matières & coefficients',
      status: !structureDone ? 'locked'
            : subjectsDone ? 'done'
            : 'todo',
      detail: subjectsDone ? `${data.subjects_count} matières` : 'À définir (templates dispo)',
      route: '/dashboard/pedagogy/subjects',
    },
    fees: {
      key: 'fees',
      order: 8,
      label: 'Frais & échéances',
      status: !(typesDone && structureDone) ? 'locked'
            : data.fee_lines_count === 0 ? 'todo'
            : 'done',
      detail: `${data.fee_lines_count} lignes de frais`,
      route: '/dashboard/pedagogy/fees',
    },
    teachers_assignments: {
      key: 'teachers_assignments',
      order: 9,
      label: 'Enseignants & affectations',
      status: !(structureDone && subjectsDone) ? 'locked'
            : data.teachers_count === 0 ? 'todo'
            : data.classroom_subjects_with_teacher_count === 0 ? 'partial'
            : data.classrooms_with_principal_count < data.classrooms_count ? 'partial'
            : 'done',
      detail: `${data.teachers_count} enseignants · ${data.classroom_subjects_with_teacher_count} affectations · ${data.classrooms_with_principal_count} profs principaux`,
      route: '/dashboard/pedagogy/teachers',
    },
  };
}

export function usePedagogySetupStatus(schoolId: string | undefined) {
  const query = useQuery<PedagogySetupStatus | null>({
    queryKey: ['pedagogy-setup-status', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data, error } = await supabase
        .from('v_pedagogy_setup_status')
        .select('*')
        .eq('school_id', schoolId)
        .single();
      if (error) throw error;
      return data as PedagogySetupStatus;
    },
    enabled: !!schoolId,
  });

  return {
    ...query,
    steps: query.data ? computeSteps(query.data) : undefined,
  };
}
```

- [ ] **Step 4 : Lancer le test à nouveau, vérifier qu'il passe**

```bash
pnpm --filter @edukea/shared test usePedagogySetupStatus 2>&1 | tail -20
```

Expected : 3 tests passent.

- [ ] **Step 5 : Ajouter le barrel export**

Modifier `packages/shared/src/hooks/index.ts` — ajouter la ligne :

```typescript
export * from './usePedagogySetupStatus';
```

- [ ] **Step 6 : Vérifier le build**

```bash
pnpm --filter @edukea/shared build 2>&1 | tail -20
```

Expected : compilation OK.

- [ ] **Step 7 : Commit**

```bash
git add packages/shared/src/hooks/usePedagogySetupStatus.ts \
        packages/shared/src/hooks/__tests__/usePedagogySetupStatus.test.ts \
        packages/shared/src/hooks/index.ts
git commit -m "feat(shared): usePedagogySetupStatus hook + step computation (S3D fondations)"
```

---

## Task 15 : Composant `PedagogyStepCard`

**Files :**
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/_components/PedagogyStepCard.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/_components/__tests__/PedagogyStepCard.test.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer le fichier de test :

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PedagogyStepCard } from '../PedagogyStepCard';
import type { PedagogyStep } from '@edukea/shared';

const baseStep: PedagogyStep = {
  key: 'year',
  order: 1,
  label: 'Année scolaire',
  status: 'done',
  detail: '2026-2027 · démarrée le 9 sept',
  route: '/dashboard/pedagogy/school-year',
};

describe('PedagogyStepCard', () => {
  it('renders label, detail and status badge for done step', () => {
    render(<PedagogyStepCard step={baseStep} />);
    expect(screen.getByText('Année scolaire')).toBeInTheDocument();
    expect(screen.getByText(/2026-2027/)).toBeInTheDocument();
    expect(screen.getByText(/fait/i)).toBeInTheDocument();
  });

  it('renders locked state as disabled with specific badge', () => {
    render(<PedagogyStepCard step={{ ...baseStep, status: 'locked' }} />);
    expect(screen.getByText(/verrouillé/i)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders optional state with muted styling', () => {
    render(<PedagogyStepCard step={{ ...baseStep, status: 'optional' }} />);
    expect(screen.getByText(/facultatif/i)).toBeInTheDocument();
  });

  it('shows the step order number', () => {
    render(<PedagogyStepCard step={{ ...baseStep, order: 3 }} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2 : Lancer le test, vérifier qu'il échoue**

```bash
pnpm --filter @edukea/school test PedagogyStepCard 2>&1 | tail -15
```

Expected : "Cannot find module '../PedagogyStepCard'".

- [ ] **Step 3 : Écrire le composant**

Créer `apps/school/src/app/(dashboard)/dashboard/pedagogy/_components/PedagogyStepCard.tsx` :

```tsx
'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, Clock, Lock, MinusCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PedagogyStep, StepStatus } from '@edukea/shared';

const STATUS_CONFIG: Record<StepStatus, {
  label: string;
  icon: typeof CheckCircle2;
  badgeClass: string;
  cardClass: string;
  disabled: boolean;
}> = {
  done: {
    label: 'Fait',
    icon: CheckCircle2,
    badgeClass: 'bg-green-100 text-green-700',
    cardClass: 'border-green-200',
    disabled: false,
  },
  partial: {
    label: 'Partiel',
    icon: Clock,
    badgeClass: 'bg-amber-100 text-amber-700',
    cardClass: 'border-amber-200',
    disabled: false,
  },
  todo: {
    label: 'À faire',
    icon: Circle,
    badgeClass: 'bg-slate-100 text-slate-700',
    cardClass: 'border-slate-200',
    disabled: false,
  },
  locked: {
    label: 'Verrouillé',
    icon: Lock,
    badgeClass: 'bg-slate-50 text-slate-400',
    cardClass: 'border-slate-100 opacity-60',
    disabled: true,
  },
  optional: {
    label: 'Facultatif',
    icon: MinusCircle,
    badgeClass: 'bg-slate-100 text-slate-500',
    cardClass: 'border-slate-200',
    disabled: false,
  },
};

interface Props {
  step: PedagogyStep;
}

export function PedagogyStepCard({ step }: Props) {
  const config = STATUS_CONFIG[step.status];
  const Icon = config.icon;

  const inner = (
    <div className={cn(
      'flex items-center gap-4 rounded-xl border bg-white p-4 transition-shadow',
      !config.disabled && 'hover:shadow-md',
      config.cardClass,
    )}>
      <div className={cn(
        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-semibold',
        config.badgeClass,
      )}>
        {step.order}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{step.label}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{step.detail}</p>
      </div>
      <span className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium',
        config.badgeClass,
      )}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
      {!config.disabled && <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300" />}
    </div>
  );

  if (config.disabled) {
    return <div aria-disabled="true" role="link">{inner}</div>;
  }

  return <Link href={step.route} className="block">{inner}</Link>;
}
```

- [ ] **Step 4 : Lancer le test à nouveau**

```bash
pnpm --filter @edukea/school test PedagogyStepCard 2>&1 | tail -20
```

Expected : 4 tests passent.

- [ ] **Step 5 : Commit**

```bash
git add apps/school/src/app/\(dashboard\)/dashboard/pedagogy/_components/PedagogyStepCard.tsx \
        apps/school/src/app/\(dashboard\)/dashboard/pedagogy/_components/__tests__/PedagogyStepCard.test.tsx
git commit -m "feat(school): PedagogyStepCard component with 5 status states (S3D fondations)"
```

---

## Task 16 : Composant `PedagogyChecklist`

**Files :**
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/_components/PedagogyChecklist.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/_components/__tests__/PedagogyChecklist.test.tsx`

- [ ] **Step 1 : Écrire le test**

Créer le test :

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PedagogyChecklist } from '../PedagogyChecklist';

vi.mock('@edukea/shared', async () => {
  const actual = await vi.importActual<any>('@edukea/shared');
  return {
    ...actual,
    usePedagogySetupStatus: () => ({
      data: { school_id: 'school-1', school_year_name: '2026-2027' },
      steps: {
        year: { key: 'year', order: 1, label: 'Année scolaire', status: 'done', detail: '2026-2027', route: '/dashboard/pedagogy/school-year' },
        grading: { key: 'grading', order: 2, label: 'Barème école', status: 'done', detail: '/20', route: '/dashboard/pedagogy/grading' },
        bulletin_customization: { key: 'bulletin_customization', order: 3, label: 'Personnalisation bulletin', status: 'optional', detail: 'Facultatif', route: '/dashboard/pedagogy/bulletin-template' },
        student_types: { key: 'student_types', order: 4, label: "Types d'élèves", status: 'done', detail: '3 types', route: '/dashboard/pedagogy/student-types' },
        structure: { key: 'structure', order: 5, label: 'Structure école', status: 'todo', detail: '0 niveaux', route: '/dashboard/pedagogy/structure' },
        periods: { key: 'periods', order: 6, label: "Périodes", status: 'done', detail: '3 périodes', route: '/dashboard/pedagogy/periods' },
        subjects: { key: 'subjects', order: 7, label: 'Matières', status: 'locked', detail: 'À définir', route: '/dashboard/pedagogy/subjects' },
        fees: { key: 'fees', order: 8, label: 'Frais & échéances', status: 'locked', detail: '0 lignes', route: '/dashboard/pedagogy/fees' },
        teachers_assignments: { key: 'teachers_assignments', order: 9, label: 'Enseignants & affectations', status: 'locked', detail: '0 enseignants', route: '/dashboard/pedagogy/teachers' },
      },
      isLoading: false,
    }),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('PedagogyChecklist', () => {
  it('renders the school year in header', () => {
    render(<PedagogyChecklist schoolId="school-1" />, { wrapper });
    expect(screen.getByText(/2026-2027/)).toBeInTheDocument();
  });

  it('renders all 9 steps in correct order', () => {
    render(<PedagogyChecklist schoolId="school-1" />, { wrapper });
    const stepLabels = [
      'Année scolaire',
      'Barème école',
      'Personnalisation bulletin',
      "Types d'élèves",
      'Structure école',
      'Périodes',
      'Matières',
      'Frais & échéances',
      'Enseignants & affectations',
    ];
    stepLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('displays progress counter (fait/total)', () => {
    render(<PedagogyChecklist schoolId="school-1" />, { wrapper });
    // 4 done (year, grading, student_types, periods) + 1 optional non-fait = 4 fait sur 8 obligatoires (facultatif exclu)
    expect(screen.getByText(/4\s*\/\s*8/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2 : Vérifier échec**

```bash
pnpm --filter @edukea/school test PedagogyChecklist 2>&1 | tail -15
```

Expected : "Cannot find module '../PedagogyChecklist'".

- [ ] **Step 3 : Écrire le composant**

Créer `apps/school/src/app/(dashboard)/dashboard/pedagogy/_components/PedagogyChecklist.tsx` :

```tsx
'use client';

import { usePedagogySetupStatus } from '@edukea/shared';
import { PedagogyStepCard } from './PedagogyStepCard';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  schoolId: string;
}

export function PedagogyChecklist({ schoolId }: Props) {
  const { data, steps, isLoading } = usePedagogySetupStatus(schoolId);

  if (isLoading || !steps) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const orderedSteps = Object.values(steps).sort((a, b) => a.order - b.order);

  // Compteur de progression : les 'done' sur les obligatoires (exclut 'optional')
  const mandatorySteps = orderedSteps.filter((s) => s.status !== 'optional');
  const doneCount = mandatorySteps.filter((s) => s.status === 'done').length;
  const totalMandatory = mandatorySteps.length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Rentrée pédagogique
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Année {data?.school_year_name ?? '—'} · Configurez les étapes ci-dessous
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-600">
              {doneCount} <span className="text-base font-normal text-slate-400">/ {totalMandatory}</span>
            </p>
            <p className="text-xs text-slate-500">étapes complétées</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {orderedSteps.map((step) => (
          <PedagogyStepCard key={step.key} step={step} />
        ))}
      </div>

      <p className="pt-2 text-center text-xs text-slate-500">
        Une fois les {totalMandatory} étapes marquées « Fait », le module Notes/Bulletins s'active.
      </p>
    </div>
  );
}
```

- [ ] **Step 4 : Lancer le test à nouveau**

```bash
pnpm --filter @edukea/school test PedagogyChecklist 2>&1 | tail -20
```

Expected : 3 tests passent.

- [ ] **Step 5 : Commit**

```bash
git add apps/school/src/app/\(dashboard\)/dashboard/pedagogy/_components/PedagogyChecklist.tsx \
        apps/school/src/app/\(dashboard\)/dashboard/pedagogy/_components/__tests__/PedagogyChecklist.test.tsx
git commit -m "feat(school): PedagogyChecklist component with progress counter (S3D fondations)"
```

---

## Task 17 : Page hub `/dashboard/pedagogy`

**Files :**
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/page.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/loading.tsx`

- [ ] **Step 1 : Créer la page (server component)**

Créer `apps/school/src/app/(dashboard)/dashboard/pedagogy/page.tsx` :

```tsx
import { PageHeader } from '@/components/layout/page-header';
import { PedagogyChecklist } from './_components/PedagogyChecklist';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Rentrée pédagogique — Edukea',
};

export default async function PedagogyPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: staff } = await supabase
    .from('school_staff_profiles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .single();

  if (!staff) redirect('/auth/no-access');
  if (staff.role !== 'manager') redirect('/dashboard');

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Rentrée pédagogique"
        description="Point de départ pour paramétrer votre année scolaire"
      />
      <PedagogyChecklist schoolId={staff.school_id} />
    </div>
  );
}
```

- [ ] **Step 2 : Créer le skeleton loading**

Créer `apps/school/src/app/(dashboard)/dashboard/pedagogy/loading.tsx` :

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Vérifier que la page compile**

```bash
pnpm --filter @edukea/school build 2>&1 | tail -20
```

Expected : build success.

- [ ] **Step 4 : Commit**

```bash
git add apps/school/src/app/\(dashboard\)/dashboard/pedagogy/page.tsx \
        apps/school/src/app/\(dashboard\)/dashboard/pedagogy/loading.tsx
git commit -m "feat(school): /dashboard/pedagogy hub page (server component + auth guard) (S3D fondations)"
```

---

## Task 18 : Intégration sidebar (item "Rentrée" pour manager)

**Files :**
- Modify : `apps/school/src/components/layout/sidebar-nav.tsx`

- [ ] **Step 1 : Lire la sidebar actuelle**

```bash
cat apps/school/src/components/layout/sidebar-nav.tsx
```

Identifier la structure du fichier — probablement un array `NAV_ITEMS` avec des objets `{ label, href, icon, roles? }`.

- [ ] **Step 2 : Ajouter l'item "Rentrée"**

Trouver le array `NAV_ITEMS` (ou équivalent) et ajouter, avant l'item "Notes" ou "Bulletins" (ou en dernier si ceux-ci n'existent pas encore) :

```tsx
{
  label: 'Rentrée',
  href: '/dashboard/pedagogy',
  icon: GraduationCap, // depuis lucide-react
  roles: ['manager'],
},
```

Ajouter aussi l'import :

```tsx
import { GraduationCap } from 'lucide-react';
```

- [ ] **Step 3 : Vérifier que le guard rôles fonctionne**

Si le composant utilise déjà un filtre `.filter(item => !item.roles || item.roles.includes(userRole))`, rien à ajouter.

Sinon, ajouter le filtre au rendu :

```tsx
{NAV_ITEMS
  .filter((item) => !item.roles || item.roles.includes(userRole))
  .map((item) => ( ... ))}
```

- [ ] **Step 4 : Vérifier le build**

```bash
pnpm --filter @edukea/school build 2>&1 | tail -10
```

Expected : compilation OK.

- [ ] **Step 5 : Commit**

```bash
git add apps/school/src/components/layout/sidebar-nav.tsx
git commit -m "feat(school): sidebar item 'Rentrée' visible manager only (S3D fondations)"
```

---

## Task 19 : Smoke test end-to-end + milestone tag

**Files :** N/A

- [ ] **Step 1 : Démarrer le dev server**

Dans un terminal séparé :

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
pnpm --filter @edukea/school dev
```

Expected : app démarre sur http://localhost:4002.

- [ ] **Step 2 : Se connecter en tant que manager**

Ouvrir http://localhost:4002/auth/login dans un navigateur.
Saisir les credentials d'un compte staff avec `role='manager'` (créer un si absent via SQL Editor Supabase).

- [ ] **Step 3 : Naviguer vers /dashboard/pedagogy**

Vérifier :
- La sidebar montre l'item "Rentrée"
- Le hub s'affiche avec les 9 étapes (année, barème, personnalisation bulletin, types d'élèves, structure, périodes, matières, frais, enseignants)
- Le compteur de progression affiche X / 8 (facultatif exclu)
- Chaque carte a un statut cohérent avec l'état DB de l'école
- Cliquer sur une étape "verrouillée" ne navigue pas (aria-disabled)
- Cliquer sur une étape active navigue vers `/dashboard/pedagogy/<step>` (404 attendu pour l'instant — les sous-pages viendront en 3D.2/3D.3)

- [ ] **Step 4 : Tests unitaires globaux**

```bash
pnpm --filter @edukea/shared test 2>&1 | tail -10
pnpm --filter @edukea/school test 2>&1 | tail -10
```

Expected : tous les tests passent.

- [ ] **Step 5 : Vérifier lint**

```bash
pnpm --filter @edukea/school lint 2>&1 | tail -20
```

Expected : aucune erreur.

- [ ] **Step 6 : Merger sur main + tag milestone**

```bash
git checkout main
git merge feat/s3d-1-fondations --no-ff -m "merge: S3D.1 fondations DB + squelette hub"
git tag -a s3d.1 -m "milestone: S3D.1 fondations DB + squelette hub shipped"
```

- [ ] **Step 7 : (optionnel) Push distant**

```bash
git push origin main --tags
```

Ne PAS pousser sans confirmation utilisateur.

---

## Résumé livrables 3D.1

Au terme de cette phase :

- **11 migrations SQL** appliquées (00035 → 00045)
- **1 hook partagé** `usePedagogySetupStatus` avec typage complet + tests
- **3 composants React** (`PedagogyStepCard`, `PedagogyChecklist`, page hub) avec tests RTL
- **1 item sidebar** guardé par rôle manager
- **1 backfill legacy** appliqué aux écoles pilotes existantes
- **Types TypeScript** régénérés depuis le schéma Supabase
- **Milestone git tag** `s3d.1`

**Prochaine phase** : S3D.2 — Setup structure école (étapes 1, 2a, 3 du hub), qui rendra fonctionnels les liens du hub vers année scolaire / barème / structure.

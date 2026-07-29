# S3D.2 — MVP onboarding vertical — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** Rendre fonctionnel le hub Rentrée (5 écrans de config année + écran frais matriciels) et brancher le wizard S3B d'inscription existant sur le nouveau modèle pour un parcours utilisateur end-to-end (école configurée → élève inscrit avec paiement ventilé).

**Architecture :** 2 migrations SQL (1 vue + 2 RPCs), ~18 hooks partagés (reads + mutations), 7 pages Next.js (5 pour config année + 2 pour frais), refonte de 3 steps du wizard S3B existant. 3 phases séquentielles (3D.2.1 → .2 → .3), chacune shippable indépendamment.

**Tech Stack :** Supabase (PostgreSQL 15), Next.js 15 (App Router + Turbopack), TypeScript, TanStack Query v5, `@edukea/shared`, `@edukea/ui` (shadcn/ui-based), Tailwind, Vitest + React Testing Library.

**Spec source :** `docs/superpowers/specs/2026-07-29-s3d-2-mvp-onboarding-vertical-design.md` (commit `617f753`).

---

## Prérequis de la session

**Avant de commencer** :

- Être sur `main` avec tag `s3d.1` en place (S3D.1 shipped)
- Working tree propre (ou une feature branch fraîche `feat/s3d-2-mvp-vertical`)
- `.env.local` présent à la racine avec `SUPABASE_DB_URL` + `SUPABASE_PROJECT_ID`
- pnpm ≥ 10.22, Supabase CLI ≥ 2.109
- Node ≥ 20.10

**Vérification** :

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
git log --oneline -3
git tag | tail -3                          # doit contenir s3d.1
ls supabase/migrations/ | tail -3          # doit se terminer par 00045_S3D_backfill_legacy.sql
export $(grep -v '^#' .env.local | xargs)
psql "$SUPABASE_DB_URL" -c "SELECT COUNT(*) FROM student_types;"    # 12 attendus (backfill 00045)
```

**Rappel workflow** : le subagent écrit les fichiers SQL et les applique via `psql`. Les fichiers TypeScript utilisent `pnpm --filter @edukea/school` ou `@edukea/shared` pour build/test.

---

## Structure des fichiers créés/modifiés

**Nouvelles migrations** (`supabase/migrations/`) :
- `00046_S3D2_fees_overview.sql` — vue `v_fees_overview_matrix`
- `00047_S3D2_fees_rpcs.sql` — RPCs `generate_default_periodes` + `copy_fees_between_student_types`

**Nouveaux hooks partagés** (`packages/shared/src/hooks/`) :
- `useSchoolYears.ts`, `useCurrentSchoolYear.ts`, `usePeriodes.ts`, `useStudentTypes.ts`, `useSchoolStructure.ts`, `useStructureTemplates.ts` (Bloc 1 reads)
- Mutations Bloc 1 dans les mêmes fichiers ou séparés selon convention
- `useLevelFeeLines.ts`, `useLevelFeeInstallments.ts`, `useFeesOverviewMatrix.ts`, `useClassroomEffectiveFees.ts`, `useClassroomEffectiveInstallments.ts` (Bloc 2)
- Barrel export : `packages/shared/src/hooks/index.ts` mis à jour

**Pages école** (`apps/school/src/app/(dashboard)/dashboard/pedagogy/`) :
- `school-year/page.tsx`, `periods/page.tsx`, `grading/page.tsx`, `student-types/page.tsx`
- `structure/page.tsx` + `structure/_components/*` (master-detail)
- `fees/page.tsx` + `fees/_components/*`
- `fees/[levelId]/page.tsx` + `fees/[levelId]/_components/*`

**Wizard S3B modifié** (`apps/school/src/app/(dashboard)/dashboard/enrollment/new/`) :
- `_types.ts` — ajout invariant sur `typeStudentId` (déjà déclaré)
- `_steps/StepStudent.tsx` — dropdown type d'élève
- `_steps/StepClassroom.tsx` — warning si frais manquants
- `_steps/StepFeesPayment.tsx` — refonte complète
- Nouveaux composants : `FeesLinesTable.tsx`, `InstallmentsSchedule.tsx`, `PaymentAllocationSummary.tsx`

**Types TS régénérés** : `packages/shared/src/types/database.types.ts`

---

# Phase 3D.2.1 — Fondations DB + Bloc 1 (Config année standalone)

## Task 1 : Créer feature branch + baseline

**Files :** N/A

- [ ] **Step 1 : Créer la branche**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
git checkout main
git checkout -b feat/s3d-2-mvp-vertical
```

- [ ] **Step 2 : Vérifier la baseline DB**

```bash
export $(grep -v '^#' .env.local | xargs)
psql "$SUPABASE_DB_URL" -c "SELECT COUNT(*) AS student_types FROM student_types;"
psql "$SUPABASE_DB_URL" -c "SELECT COUNT(*) AS periodes FROM periodes;"
psql "$SUPABASE_DB_URL" -c "SELECT COUNT(*) AS level_fee_lines FROM level_fee_lines;"
```

Expected : 12 student_types (backfill 00045), 12 periodes (backfill 00045), 0 level_fee_lines (pas encore configurés).

---

## Task 2 : Migration 00046 — Vue `v_fees_overview_matrix`

**Files :**
- Create : `supabase/migrations/00046_S3D2_fees_overview.sql`
- Create : `supabase/migrations/00046_S3D2_fees_overview.test.sql`

- [ ] **Step 1 : Écrire la verification query**

Créer `supabase/migrations/00046_S3D2_fees_overview.test.sql` :

```sql
SELECT 'v_fees_overview_matrix exists' AS assertion, COUNT(*) = 1 AS pass
FROM information_schema.views
WHERE table_schema = 'public' AND view_name = 'v_fees_overview_matrix';

SELECT 'v_fees_overview_matrix queryable' AS assertion, true AS pass
FROM v_fees_overview_matrix LIMIT 1;
```

- [ ] **Step 2 : Verify fails**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00046_S3D2_fees_overview.test.sql
```

Expected : erreur "relation v_fees_overview_matrix does not exist".

- [ ] **Step 3 : Écrire la migration**

Créer `supabase/migrations/00046_S3D2_fees_overview.sql` :

```sql
-- =========================================================================
-- Migration 00046 — Vue overview matrice frais (S3D.2)
--
-- Une ligne par (niveau, type d'élève) avec totaux et compteurs.
-- Consommée par l'écran /pedagogy/fees pour afficher la matrice.
-- =========================================================================

CREATE OR REPLACE VIEW v_fees_overview_matrix AS
SELECT
  l.id AS level_id,
  l.name AS level_name,
  l."order" AS level_order,
  c.school_id,
  st.id AS student_type_id,
  st.code AS student_type_code,
  st.label AS student_type_label,
  st."order" AS student_type_order,
  COALESCE(SUM(lfl.amount) FILTER (WHERE lfl.is_optional = false), 0) AS total_mandatory,
  COALESCE(SUM(lfl.amount), 0) AS total_with_options,
  COUNT(DISTINCT lfl.id) AS lines_count,
  COUNT(DISTINCT lfi.id) AS installments_count
FROM levels l
JOIN cycles c ON c.id = l.cycle_id
CROSS JOIN student_types st
LEFT JOIN level_fee_lines lfl ON lfl.level_id = l.id AND lfl.student_type_id = st.id
LEFT JOIN level_fee_installments lfi ON lfi.level_id = l.id AND lfi.student_type_id = st.id
WHERE c.school_id = st.school_id
GROUP BY l.id, l.name, l."order", c.school_id, st.id, st.code, st.label, st."order";

COMMENT ON VIEW v_fees_overview_matrix IS
  'Overview matrice niveau × type d''élève. Une ligne par combinaison. lines_count = 0 → cellule vide dans le hub /pedagogy/fees.';
```

- [ ] **Step 4 : Appliquer**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00046_S3D2_fees_overview.sql
```

Expected : `CREATE VIEW`, `COMMENT`.

- [ ] **Step 5 : Verify passes + smoke test**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00046_S3D2_fees_overview.test.sql
psql "$SUPABASE_DB_URL" -c "SELECT school_id, COUNT(*) FROM v_fees_overview_matrix GROUP BY school_id;"
```

Expected : 2 pass=true + une ligne par école montrant nombre de (niveau × type) combos.

- [ ] **Step 6 : Commit**

```bash
git add supabase/migrations/00046_S3D2_fees_overview.sql supabase/migrations/00046_S3D2_fees_overview.test.sql
git commit -m "feat(db): 00046 v_fees_overview_matrix (S3D.2 fondations)"
```

---

## Task 3 : Migration 00047 — RPCs `generate_default_periodes` + `copy_fees_between_student_types`

**Files :**
- Create : `supabase/migrations/00047_S3D2_fees_rpcs.sql`
- Create : `supabase/migrations/00047_S3D2_fees_rpcs.test.sql`

- [ ] **Step 1 : Verification query**

Créer `00047_S3D2_fees_rpcs.test.sql` :

```sql
SELECT p.proname, COUNT(*) = 1 AS pass
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN (
  'generate_default_periodes',
  'copy_fees_between_student_types'
) GROUP BY p.proname;
```

- [ ] **Step 2 : Verify fails**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00047_S3D2_fees_rpcs.test.sql
```

Expected : 0 rows.

- [ ] **Step 3 : Écrire la migration**

Créer `supabase/migrations/00047_S3D2_fees_rpcs.sql` :

```sql
-- =========================================================================
-- Migration 00047 — RPCs pour Bloc 1 (périodes) et Bloc 2 (frais) (S3D.2)
-- =========================================================================

-- 1. Générer périodes T1/T2/T3 (trimestre) ou S1/S2 (semestre) auto depuis dates année
CREATE OR REPLACE FUNCTION generate_default_periodes(
  p_school_year_id TEXT
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_year RECORD;
  v_existing INT;
  v_count INT := 0;
  v_span_days INT;
BEGIN
  SELECT sy.id, sy.school_id, sy.date_start, sy.date_end, sy.periode_type
  INTO v_year
  FROM school_years sy WHERE sy.id = p_school_year_id AND sy.deleted_at IS NULL;

  IF v_year.id IS NULL THEN
    RAISE EXCEPTION 'generate_default_periodes : school_year % introuvable', p_school_year_id;
  END IF;

  IF v_year.periode_type IS NULL THEN
    RAISE EXCEPTION 'generate_default_periodes : periode_type non défini pour cette année';
  END IF;

  IF v_year.date_start IS NULL OR v_year.date_end IS NULL THEN
    RAISE EXCEPTION 'generate_default_periodes : dates non définies pour cette année';
  END IF;

  -- Idempotent : skip si déjà des périodes
  SELECT COUNT(*) INTO v_existing FROM periodes p WHERE p.school_year_id = v_year.id;
  IF v_existing > 0 THEN
    RAISE NOTICE 'generate_default_periodes : % périodes déjà présentes, skip', v_existing;
    RETURN 0;
  END IF;

  v_span_days := (v_year.date_end - v_year.date_start);

  IF v_year.periode_type = 'trimestre' THEN
    INSERT INTO periodes (school_id, school_year_id, name, type, "order", start_date, end_date, is_published) VALUES
      (v_year.school_id, v_year.id, 'Trimestre 1', 'trimestre', 1,
        v_year.date_start,
        v_year.date_start + (v_span_days / 3),
        false),
      (v_year.school_id, v_year.id, 'Trimestre 2', 'trimestre', 2,
        v_year.date_start + (v_span_days / 3) + 1,
        v_year.date_start + (2 * v_span_days / 3),
        false),
      (v_year.school_id, v_year.id, 'Trimestre 3', 'trimestre', 3,
        v_year.date_start + (2 * v_span_days / 3) + 1,
        v_year.date_end,
        false);
    v_count := 3;
  ELSIF v_year.periode_type = 'semestre' THEN
    INSERT INTO periodes (school_id, school_year_id, name, type, "order", start_date, end_date, is_published) VALUES
      (v_year.school_id, v_year.id, 'Semestre 1', 'semestre', 1,
        v_year.date_start,
        v_year.date_start + (v_span_days / 2),
        false),
      (v_year.school_id, v_year.id, 'Semestre 2', 'semestre', 2,
        v_year.date_start + (v_span_days / 2) + 1,
        v_year.date_end,
        false);
    v_count := 2;
  END IF;

  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION generate_default_periodes(TEXT) TO authenticated;

-- 2. Copier frais + échéances entre types d'élèves (même niveau)
CREATE OR REPLACE FUNCTION copy_fees_between_student_types(
  p_level_id TEXT,
  p_source_type_id UUID,
  p_target_type_id UUID
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_lines_copied INT;
  v_installments_copied INT;
BEGIN
  IF p_source_type_id = p_target_type_id THEN
    RAISE EXCEPTION 'copy_fees : source et target types identiques';
  END IF;

  -- Vider les lignes/échéances existantes du target (overwrite)
  DELETE FROM level_fee_lines
  WHERE level_id = p_level_id AND student_type_id = p_target_type_id;

  DELETE FROM level_fee_installments
  WHERE level_id = p_level_id AND student_type_id = p_target_type_id;

  -- Copier les lignes
  INSERT INTO level_fee_lines (level_id, student_type_id, category, label, amount, "order", is_optional)
  SELECT level_id, p_target_type_id, category, label, amount, "order", is_optional
  FROM level_fee_lines
  WHERE level_id = p_level_id AND student_type_id = p_source_type_id;
  GET DIAGNOSTICS v_lines_copied = ROW_COUNT;

  -- Copier les échéances
  INSERT INTO level_fee_installments (level_id, student_type_id, "order", label, category, due_date_offset_days, amount, amount_percentage)
  SELECT level_id, p_target_type_id, "order", label, category, due_date_offset_days, amount, amount_percentage
  FROM level_fee_installments
  WHERE level_id = p_level_id AND student_type_id = p_source_type_id;
  GET DIAGNOSTICS v_installments_copied = ROW_COUNT;

  RETURN v_lines_copied + v_installments_copied;
END $$;

GRANT EXECUTE ON FUNCTION copy_fees_between_student_types(TEXT, UUID, UUID) TO authenticated;
```

- [ ] **Step 4 : Appliquer**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00047_S3D2_fees_rpcs.sql
```

- [ ] **Step 5 : Vérifier**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/00047_S3D2_fees_rpcs.test.sql
```

Expected : 2 pass=true.

- [ ] **Step 6 : Commit**

```bash
git add supabase/migrations/00047_S3D2_fees_rpcs.sql supabase/migrations/00047_S3D2_fees_rpcs.test.sql
git commit -m "feat(db): 00047 RPCs generate_default_periodes + copy_fees_between_student_types (S3D.2)"
```

---

## Task 4 : Régénérer database.types.ts

**Files :**
- Modify : `packages/shared/src/types/database.types.ts`

- [ ] **Step 1 : Régen types**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
export $(grep -v '^#' .env.local | xargs)
supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > packages/shared/src/types/database.types.ts
```

- [ ] **Step 2 : Verify new view + RPCs présents**

```bash
grep -c "v_fees_overview_matrix\|generate_default_periodes\|copy_fees_between_student_types" packages/shared/src/types/database.types.ts
```

Expected : ≥ 3 refs.

- [ ] **Step 3 : Type-check shared**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
pnpm tsc --noEmit --project packages/shared/tsconfig.json 2>&1 | tail -5
```

Expected : no errors.

- [ ] **Step 4 : Commit**

```bash
git add packages/shared/src/types/database.types.ts
git commit -m "chore(shared): regen database.types after S3D.2 migrations"
```

---

## Task 5 : Hooks partagés Bloc 1 (lecture)

**Files :**
- Create : `packages/shared/src/hooks/useSchoolYears.ts`
- Create : `packages/shared/src/hooks/usePeriodes.ts`
- Create : `packages/shared/src/hooks/useStudentTypes.ts`
- Create : `packages/shared/src/hooks/useSchoolStructure.ts`
- Create : `packages/shared/src/hooks/useStructureTemplates.ts`
- Modify : `packages/shared/src/hooks/index.ts` (barrel export)

Note : `useCurrentSchoolYear` est déjà accessible via `usePedagogySetupStatus().data.school_year_id`, pas besoin d'un hook séparé.

- [ ] **Step 1 : Créer `useSchoolYears.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface SchoolYear {
  id: string;
  school_id: string;
  name: string;
  date_start: string | null;
  date_end: string | null;
  periode_type: 'trimestre' | 'semestre' | null;
  deleted_at: string | null;
  created_at: string;
}

export function useSchoolYears(schoolId: string | undefined) {
  return useQuery<SchoolYear[]>({
    queryKey: ['school-years', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from('school_years')
        .select('*')
        .eq('school_id', schoolId)
        .is('deleted_at', null)
        .order('date_start', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as SchoolYear[];
    },
    enabled: !!schoolId,
  });
}
```

- [ ] **Step 2 : Créer `usePeriodes.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface Periode {
  id: string;
  school_id: string;
  school_year_id: string;
  name: string;
  type: 'trimestre' | 'semestre' | null;
  order: number;
  start_date: string;
  end_date: string;
  is_published: boolean;
}

export function usePeriodes(schoolYearId: string | undefined) {
  return useQuery<Periode[]>({
    queryKey: ['periodes', schoolYearId],
    queryFn: async () => {
      if (!schoolYearId) return [];
      const { data, error } = await supabase
        .from('periodes')
        .select('*')
        .eq('school_year_id', schoolYearId)
        .order('order');
      if (error) throw error;
      return (data ?? []) as Periode[];
    },
    enabled: !!schoolYearId,
  });
}
```

- [ ] **Step 3 : Créer `useStudentTypes.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StudentType {
  id: string;
  school_id: string;
  code: string;
  label: string;
  order: number;
  is_default: boolean;
  created_at: string;
}

export function useStudentTypes(schoolId: string | undefined) {
  return useQuery<StudentType[]>({
    queryKey: ['student-types', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from('student_types')
        .select('*')
        .eq('school_id', schoolId)
        .order('order');
      if (error) throw error;
      return (data ?? []) as StudentType[];
    },
    enabled: !!schoolId,
  });
}
```

- [ ] **Step 4 : Créer `useSchoolStructure.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StructureCycle {
  id: string;
  school_id: string;
  name: string;
  levels: StructureLevel[];
}
export interface StructureLevel {
  id: string;
  school_id: string;
  cycle_id: string;
  name: string;
  order: number;
  classrooms: StructureClassroom[];
}
export interface StructureClassroom {
  id: string;
  school_id: string;
  level_id: string;
  name: string;
  principal_teacher_id: string | null;
}

export function useSchoolStructure(schoolId: string | undefined) {
  return useQuery<StructureCycle[]>({
    queryKey: ['school-structure', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const [cyclesRes, levelsRes, classroomsRes] = await Promise.all([
        supabase.from('cycles').select('*').eq('school_id', schoolId).order('name'),
        supabase.from('levels').select('*').eq('school_id', schoolId).order('order'),
        supabase.from('classrooms').select('*').eq('school_id', schoolId).order('name'),
      ]);
      if (cyclesRes.error) throw cyclesRes.error;
      if (levelsRes.error) throw levelsRes.error;
      if (classroomsRes.error) throw classroomsRes.error;

      const classrooms = (classroomsRes.data ?? []) as StructureClassroom[];
      const levels = ((levelsRes.data ?? []) as StructureLevel[]).map((l) => ({
        ...l,
        classrooms: classrooms.filter((c) => c.level_id === l.id),
      }));
      return ((cyclesRes.data ?? []) as StructureCycle[]).map((c) => ({
        ...c,
        levels: levels.filter((l) => l.cycle_id === c.id),
      }));
    },
    enabled: !!schoolId,
  });
}
```

- [ ] **Step 5 : Créer `useStructureTemplates.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StructureTemplate {
  template_key: string;
  cycle_code: string;
  cycle_name: string;
  level_code: string;
  level_name: string;
  level_order: number;
}

export interface GroupedTemplate {
  template_key: string;
  cycle_name: string;
  levels: { code: string; name: string; order: number }[];
}

export function useStructureTemplates() {
  return useQuery<GroupedTemplate[]>({
    queryKey: ['structure-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('structure_templates')
        .select('*')
        .order('template_key')
        .order('level_order');
      if (error) throw error;

      const rows = (data ?? []) as StructureTemplate[];
      const grouped = new Map<string, GroupedTemplate>();
      for (const r of rows) {
        if (!grouped.has(r.template_key)) {
          grouped.set(r.template_key, { template_key: r.template_key, cycle_name: r.cycle_name, levels: [] });
        }
        grouped.get(r.template_key)!.levels.push({ code: r.level_code, name: r.level_name, order: r.level_order });
      }
      return Array.from(grouped.values());
    },
  });
}
```

- [ ] **Step 6 : Ajouter barrel exports**

Modifier `packages/shared/src/hooks/index.ts` — append :

```typescript
export * from './useSchoolYears';
export * from './usePeriodes';
export * from './useStudentTypes';
export * from './useSchoolStructure';
export * from './useStructureTemplates';
```

- [ ] **Step 7 : TS check**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
pnpm tsc --noEmit --project packages/shared/tsconfig.json 2>&1 | tail -5
```

Expected : no errors.

- [ ] **Step 8 : Commit**

```bash
git add packages/shared/src/hooks/useSchoolYears.ts \
        packages/shared/src/hooks/usePeriodes.ts \
        packages/shared/src/hooks/useStudentTypes.ts \
        packages/shared/src/hooks/useSchoolStructure.ts \
        packages/shared/src/hooks/useStructureTemplates.ts \
        packages/shared/src/hooks/index.ts
git commit -m "feat(shared): S3D.2 Bloc 1 read hooks (school_years, periodes, student_types, structure, templates)"
```

---

## Task 6 : Hooks partagés Bloc 1 (mutations)

**Files :**
- Create : `packages/shared/src/hooks/useSchoolYearMutations.ts`
- Create : `packages/shared/src/hooks/usePeriodeMutations.ts`
- Create : `packages/shared/src/hooks/useStudentTypeMutations.ts`
- Create : `packages/shared/src/hooks/useStructureMutations.ts`
- Create : `packages/shared/src/hooks/useSchoolBaremeMutation.ts`
- Modify : `packages/shared/src/hooks/index.ts`

- [ ] **Step 1 : Créer `useSchoolYearMutations.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { SchoolYear } from './useSchoolYears';

export interface SchoolYearInput {
  id?: string;
  school_id: string;
  name: string;
  date_start: string;
  date_end: string;
  periode_type: 'trimestre' | 'semestre';
}

export function useUpsertSchoolYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SchoolYearInput): Promise<SchoolYear> => {
      const { data, error } = await supabase
        .from('school_years')
        .upsert({
          id: input.id,
          school_id: input.school_id,
          name: input.name,
          date_start: input.date_start,
          date_end: input.date_end,
          periode_type: input.periode_type,
        })
        .select()
        .single();
      if (error) throw error;
      return data as SchoolYear;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['school-years', input.school_id] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', input.school_id] });
    },
  });
}

export function useDeleteSchoolYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schoolId }: { id: string; schoolId: string }) => {
      // Soft delete via deleted_at
      const { error } = await supabase
        .from('school_years')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['school-years', schoolId] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', schoolId] });
    },
  });
}
```

- [ ] **Step 2 : Créer `usePeriodeMutations.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface PeriodeInput {
  id?: string;
  school_id: string;
  school_year_id: string;
  name: string;
  type: 'trimestre' | 'semestre';
  order: number;
  start_date: string;
  end_date: string;
}

export function useUpsertPeriode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PeriodeInput) => {
      const { data, error } = await supabase
        .from('periodes')
        .upsert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['periodes', input.school_year_id] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', input.school_id] });
    },
  });
}

export function useDeletePeriode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; schoolYearId: string; schoolId: string }) => {
      const { error } = await supabase.from('periodes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { schoolYearId, schoolId }) => {
      qc.invalidateQueries({ queryKey: ['periodes', schoolYearId] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', schoolId] });
    },
  });
}

export function useGenerateDefaultPeriodes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ schoolYearId }: { schoolYearId: string; schoolId: string }): Promise<number> => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string, args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>)('generate_default_periodes', {
        p_school_year_id: schoolYearId,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    onSuccess: (_, { schoolYearId, schoolId }) => {
      qc.invalidateQueries({ queryKey: ['periodes', schoolYearId] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', schoolId] });
    },
  });
}
```

- [ ] **Step 3 : Créer `useStudentTypeMutations.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StudentTypeInput {
  id?: string;
  school_id: string;
  code: string;
  label: string;
  order: number;
  is_default: boolean;
}

export function useUpsertStudentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StudentTypeInput) => {
      // Si on met is_default=true, on doit d'abord décocher les autres
      if (input.is_default) {
        await supabase
          .from('student_types')
          .update({ is_default: false })
          .eq('school_id', input.school_id)
          .neq('id', input.id ?? '00000000-0000-0000-0000-000000000000');
      }
      const { data, error } = await supabase.from('student_types').upsert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['student-types', input.school_id] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', input.school_id] });
    },
  });
}

export function useDeleteStudentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; schoolId: string }) => {
      // Guard : bloquer si utilisé
      const { count } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('student_type_id', id);
      if ((count ?? 0) > 0) {
        throw new Error(`Impossible de supprimer : ${count} élève(s) utilisent ce type`);
      }
      const { error } = await supabase.from('student_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['student-types', schoolId] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', schoolId] });
    },
  });
}
```

- [ ] **Step 4 : Créer `useStructureMutations.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface CycleInput { id?: string; school_id: string; name: string; }
export interface LevelInput { id?: string; school_id: string; cycle_id: string; name: string; order: number; }
export interface ClassroomInput { id?: string; school_id: string; level_id: string; name: string; }

const invalidateStructure = (qc: ReturnType<typeof useQueryClient>, schoolId: string) => {
  qc.invalidateQueries({ queryKey: ['school-structure', schoolId] });
  qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', schoolId] });
};

export function useUpsertCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CycleInput) => {
      const payload = { id: input.id ?? crypto.randomUUID(), school_id: input.school_id, name: input.name };
      const { data, error } = await supabase.from('cycles').upsert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => invalidateStructure(qc, input.school_id),
  });
}

export function useDeleteCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; schoolId: string }) => {
      const { error } = await supabase.from('cycles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { schoolId }) => invalidateStructure(qc, schoolId),
  });
}

export function useUpsertLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LevelInput) => {
      const payload = {
        id: input.id ?? `${input.school_id}-${crypto.randomUUID().slice(0, 8)}`,
        school_id: input.school_id,
        cycle_id: input.cycle_id,
        name: input.name,
        order: input.order,
      };
      const { data, error } = await supabase.from('levels').upsert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => invalidateStructure(qc, input.school_id),
  });
}

export function useDeleteLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; schoolId: string }) => {
      const { error } = await supabase.from('levels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { schoolId }) => invalidateStructure(qc, schoolId),
  });
}

export function useUpsertClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClassroomInput) => {
      const payload = {
        id: input.id ?? `${input.school_id}-cr-${crypto.randomUUID().slice(0, 8)}`,
        school_id: input.school_id,
        level_id: input.level_id,
        name: input.name,
      };
      const { data, error } = await supabase.from('classrooms').upsert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => invalidateStructure(qc, input.school_id),
  });
}

export function useDeleteClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; schoolId: string }) => {
      const { error } = await supabase.from('classrooms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { schoolId }) => invalidateStructure(qc, schoolId),
  });
}

export function useSeedStructureFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ schoolId, templateKey }: { schoolId: string; templateKey: string }): Promise<number> => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string, args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>)('seed_structure_for_school', {
        p_school_id: schoolId,
        p_template_key: templateKey,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    onSuccess: (_, { schoolId }) => invalidateStructure(qc, schoolId),
  });
}
```

- [ ] **Step 5 : Créer `useSchoolBaremeMutation.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useUpdateSchoolBareme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ schoolId, maxScore }: { schoolId: string; maxScore: number }) => {
      const { error } = await supabase
        .from('schools')
        .update({ default_max_score: maxScore })
        .eq('id', schoolId);
      if (error) throw error;
    },
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', schoolId] });
    },
  });
}
```

- [ ] **Step 6 : Ajouter barrel exports**

Modifier `packages/shared/src/hooks/index.ts` — append :

```typescript
export * from './useSchoolYearMutations';
export * from './usePeriodeMutations';
export * from './useStudentTypeMutations';
export * from './useStructureMutations';
export * from './useSchoolBaremeMutation';
```

- [ ] **Step 7 : TS check**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
pnpm tsc --noEmit --project packages/shared/tsconfig.json 2>&1 | tail -5
```

Expected : no errors.

- [ ] **Step 8 : Commit**

```bash
git add packages/shared/src/hooks/useSchoolYearMutations.ts \
        packages/shared/src/hooks/usePeriodeMutations.ts \
        packages/shared/src/hooks/useStudentTypeMutations.ts \
        packages/shared/src/hooks/useStructureMutations.ts \
        packages/shared/src/hooks/useSchoolBaremeMutation.ts \
        packages/shared/src/hooks/index.ts
git commit -m "feat(shared): S3D.2 Bloc 1 mutation hooks (school_year, periode, student_type, structure, bareme)"
```

---

## Task 7 : Page `/pedagogy/school-year`

**Files :**
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/school-year/page.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/school-year/_components/SchoolYearList.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/school-year/_components/SchoolYearFormDialog.tsx`

- [ ] **Step 1 : Créer la page (server component)**

Créer `page.tsx` :

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { SchoolYearList } from './_components/SchoolYearList';

export const metadata = { title: 'Année scolaire — Rentrée' };

interface PageProps {
  searchParams: Promise<{ school?: string }>;
}

export default async function SchoolYearPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { school: requestedSchoolId } = await searchParams;

  const { data: ctxRaw } = await (supabase.rpc as unknown as (
    fn: string, args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>)('get_user_school_context', {
    p_requested_school_id: requestedSchoolId ?? null,
    p_requested_year_id: null,
  });

  const ctx = ctxRaw as { current_school: { id: string; name: string } | null } | null;
  if (!ctx?.current_school) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-1">
        <a href="/dashboard/pedagogy" className="text-xs text-slate-500 hover:text-orange-600">← Retour au Hub Rentrée</a>
        <h1 className="text-2xl font-semibold text-slate-900">Année scolaire</h1>
        <p className="text-sm text-slate-600">
          Configurez l'année active de {ctx.current_school.name}. Cette étape débloque : Périodes.
        </p>
      </div>
      <SchoolYearList schoolId={ctx.current_school.id} />
    </div>
  );
}
```

- [ ] **Step 2 : Créer `SchoolYearList.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useSchoolYears, useDeleteSchoolYear, type SchoolYear } from '@edukea/shared';
import { Button, Badge, Skeleton } from '@edukea/ui';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { SchoolYearFormDialog } from './SchoolYearFormDialog';

interface Props { schoolId: string; }

function isActive(y: SchoolYear): boolean {
  if (!y.date_start || !y.date_end) return false;
  const today = new Date().toISOString().slice(0, 10);
  return y.date_start <= today && today <= y.date_end;
}

export function SchoolYearList({ schoolId }: Props) {
  const { data: years, isLoading } = useSchoolYears(schoolId);
  const deleteYear = useDeleteSchoolYear();
  const [editing, setEditing] = useState<SchoolYear | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <Button onClick={() => setCreating(true)}>
        <Plus className="mr-2 h-4 w-4" /> Nouvelle année
      </Button>

      <div className="space-y-2">
        {(years ?? []).map((y) => (
          <div key={y.id} className="flex items-center gap-4 rounded-xl border bg-white p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900">{y.name}</p>
                {isActive(y) && <Badge>Active</Badge>}
                <span className="text-xs text-slate-500">
                  {y.periode_type ?? '—'} · {y.date_start ?? '?'} → {y.date_end ?? '?'}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditing(y)}><Pencil className="h-4 w-4" /></Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => {
                if (confirm(`Supprimer ${y.name} ? (soft-delete, réversible en SQL)`)) {
                  deleteYear.mutate({ id: y.id, schoolId });
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        {years?.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
            Aucune année scolaire configurée. Créez-en une pour commencer.
          </p>
        )}
      </div>

      {(editing || creating) && (
        <SchoolYearFormDialog
          schoolId={schoolId}
          year={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3 : Créer `SchoolYearFormDialog.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useUpsertSchoolYear, type SchoolYear } from '@edukea/shared';
import { Button, Input, Label } from '@edukea/ui';
import { X } from 'lucide-react';

interface Props {
  schoolId: string;
  year: SchoolYear | null;
  onClose: () => void;
}

function suggestName(): string {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

export function SchoolYearFormDialog({ schoolId, year, onClose }: Props) {
  const upsert = useUpsertSchoolYear();
  const [name, setName] = useState(year?.name ?? suggestName());
  const [dateStart, setDateStart] = useState(year?.date_start ?? '');
  const [dateEnd, setDateEnd] = useState(year?.date_end ?? '');
  const [periodeType, setPeriodeType] = useState<'trimestre' | 'semestre'>(year?.periode_type ?? 'trimestre');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (dateEnd <= dateStart) { setError('date_end doit être après date_start'); return; }
    try {
      await upsert.mutateAsync({
        id: year?.id, school_id: schoolId, name,
        date_start: dateStart, date_end: dateEnd, periode_type: periodeType,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{year ? 'Éditer' : 'Nouvelle'} année scolaire</h2>
          <button type="button" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div><Label>Nom</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Date début</Label><Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} required /></div>
            <div><Label>Date fin</Label><Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} required /></div>
          </div>
          <div>
            <Label>Type de période</Label>
            <div className="mt-1 flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" checked={periodeType === 'trimestre'} onChange={() => setPeriodeType('trimestre')} />
                Trimestres (T1/T2/T3)
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={periodeType === 'semestre'} onChange={() => setPeriodeType('semestre')} />
                Semestres (S1/S2)
              </label>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={upsert.isPending}>{upsert.isPending ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4 : TS check + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm tsc --noEmit --project apps/school/tsconfig.json 2>&1 | tail -5
git add "apps/school/src/app/(dashboard)/dashboard/pedagogy/school-year/"
git commit -m "feat(school): /pedagogy/school-year — CRUD année scolaire (S3D.2 Bloc 1)"
```

Expected : TS clean.

---

## Task 8 : Page `/pedagogy/periods`

**Files :**
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/periods/page.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/periods/_components/PeriodesEditor.tsx`

- [ ] **Step 1 : Créer la page**

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { PeriodesEditor } from './_components/PeriodesEditor';

export const metadata = { title: 'Périodes — Rentrée' };

interface PageProps { searchParams: Promise<{ school?: string }>; }

export default async function PeriodsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { school: requestedSchoolId } = await searchParams;

  const { data: ctxRaw } = await (supabase.rpc as unknown as (
    fn: string, args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>)('get_user_school_context', {
    p_requested_school_id: requestedSchoolId ?? null, p_requested_year_id: null,
  });
  const ctx = ctxRaw as { current_school: { id: string; name: string } | null } | null;
  if (!ctx?.current_school) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <a href="/dashboard/pedagogy" className="text-xs text-slate-500 hover:text-orange-600">← Retour au Hub Rentrée</a>
      <h1 className="text-2xl font-semibold">Périodes de l'année</h1>
      <p className="text-sm text-slate-600">Configurez les trimestres ou semestres. Cette étape débloque : Frais.</p>
      <PeriodesEditor schoolId={ctx.current_school.id} />
    </div>
  );
}
```

- [ ] **Step 2 : Créer `PeriodesEditor.tsx`**

```tsx
'use client';

import { usePedagogySetupStatus, usePeriodes, useUpsertPeriode, useDeletePeriode, useGenerateDefaultPeriodes } from '@edukea/shared';
import { Button, Input, Skeleton } from '@edukea/ui';
import { Trash2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props { schoolId: string; }

export function PeriodesEditor({ schoolId }: Props) {
  const { data: status, isLoading: statusLoading } = usePedagogySetupStatus(schoolId);
  const yearId = status?.school_year_id ?? undefined;
  const { data: periodes, isLoading: pLoading } = usePeriodes(yearId);
  const upsert = useUpsertPeriode();
  const del = useDeletePeriode();
  const gen = useGenerateDefaultPeriodes();

  if (statusLoading || pLoading) return <Skeleton className="h-32 w-full" />;

  if (!yearId) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
        Aucune année active. <a href="/dashboard/pedagogy/school-year" className="text-orange-600 underline">Créez d'abord une année</a>.
      </div>
    );
  }

  const expected = status?.periode_type === 'semestre' ? 2 : 3;
  const hasNone = (periodes?.length ?? 0) === 0;

  return (
    <div className="space-y-4">
      {hasNone && (
        <div className="rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 p-4 text-center">
          <p className="mb-3 text-sm text-slate-700">Aucune période configurée pour l'année {status?.school_year_name}.</p>
          <Button onClick={() => gen.mutate({ schoolYearId: yearId, schoolId })} disabled={gen.isPending}>
            <Sparkles className="mr-2 h-4 w-4" />
            Générer {expected} périodes par défaut
          </Button>
        </div>
      )}

      {(periodes ?? []).map((p) => (
        <div key={p.id} className="rounded-xl border bg-white p-4">
          <div className="grid grid-cols-6 gap-2 items-center">
            <Input
              className="col-span-2" value={p.name}
              onChange={(e) => upsert.mutate({ ...p, name: e.target.value, school_id: schoolId, type: (p.type ?? 'trimestre') as 'trimestre' | 'semestre' })}
            />
            <Input
              type="date" value={p.start_date}
              onChange={(e) => upsert.mutate({ ...p, start_date: e.target.value, school_id: schoolId, type: (p.type ?? 'trimestre') as 'trimestre' | 'semestre' })}
            />
            <Input
              type="date" value={p.end_date}
              onChange={(e) => upsert.mutate({ ...p, end_date: e.target.value, school_id: schoolId, type: (p.type ?? 'trimestre') as 'trimestre' | 'semestre' })}
            />
            <div className="text-sm text-slate-500">#{p.order}</div>
            <Button variant="ghost" size="sm" onClick={() => del.mutate({ id: p.id, schoolYearId: yearId, schoolId })}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3 : TS + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm tsc --noEmit --project apps/school/tsconfig.json 2>&1 | tail -5
git add "apps/school/src/app/(dashboard)/dashboard/pedagogy/periods/"
git commit -m "feat(school): /pedagogy/periods — CRUD périodes avec generate default (S3D.2 Bloc 1)"
```

---

## Task 9 : Page `/pedagogy/grading`

**Files :**
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/grading/page.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/grading/_components/GradingChooser.tsx`

- [ ] **Step 1 : Page + composant**

Créer `page.tsx` (mêmes pattern auth que Task 7-8) + `_components/GradingChooser.tsx` :

```tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase, useUpdateSchoolBareme } from '@edukea/shared';
import { Button, Skeleton } from '@edukea/ui';

interface Props { schoolId: string; }

const OPTIONS = [10, 20, 100] as const;

export function GradingChooser({ schoolId }: Props) {
  const [current, setCurrent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const update = useUpdateSchoolBareme();

  useEffect(() => {
    supabase.from('schools').select('default_max_score').eq('id', schoolId).single()
      .then(({ data }) => { setCurrent((data as { default_max_score: number } | null)?.default_max_score ?? 20); setLoading(false); });
  }, [schoolId]);

  if (loading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((v) => (
          <button
            key={v}
            onClick={() => { setCurrent(v); update.mutate({ schoolId, maxScore: v }); }}
            className={`rounded-xl border-2 p-6 text-center transition ${
              current === v ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-3xl font-bold text-slate-900">/{v}</div>
            <div className="mt-1 text-xs text-slate-500">Notation sur {v}</div>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Modifier le barème n'impacte pas les évaluations déjà saisies. Le nouveau barème s'appliquera aux nouvelles évaluations.
      </p>
    </div>
  );
}
```

Page `grading/page.tsx` (structure identique aux autres pages Bloc 1) importe `GradingChooser` et l'appelle avec `ctx.current_school.id`.

- [ ] **Step 2 : Commit**

```bash
git add "apps/school/src/app/(dashboard)/dashboard/pedagogy/grading/"
git commit -m "feat(school): /pedagogy/grading — barème école /10 /20 /100 (S3D.2 Bloc 1)"
```

---

## Task 10 : Page `/pedagogy/student-types`

**Files :**
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/student-types/page.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/student-types/_components/StudentTypesList.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/student-types/_components/StudentTypeFormDialog.tsx`

- [ ] **Step 1 : Page** — pattern auth identique aux précédentes, importe `StudentTypesList schoolId={ctx.current_school.id}`.

- [ ] **Step 2 : `StudentTypesList.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useStudentTypes, useDeleteStudentType, type StudentType } from '@edukea/shared';
import { Button, Skeleton } from '@edukea/ui';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { StudentTypeFormDialog } from './StudentTypeFormDialog';

interface Props { schoolId: string; }

export function StudentTypesList({ schoolId }: Props) {
  const { data: types, isLoading } = useStudentTypes(schoolId);
  const del = useDeleteStudentType();
  const [editing, setEditing] = useState<StudentType | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="space-y-4">
      <Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> Ajouter un type</Button>
      <div className="space-y-2">
        {(types ?? []).map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-xl border bg-white p-4">
            {t.is_default && <Star className="h-4 w-4 fill-orange-400 text-orange-400" />}
            <div className="flex-1">
              <p className="font-medium text-slate-900">{t.label}</p>
              <p className="text-xs text-slate-500">code: <code>{t.code}</code></p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /></Button>
            <Button
              variant="ghost" size="sm"
              onClick={async () => {
                if (!confirm(`Supprimer ${t.label} ?`)) return;
                try { await del.mutateAsync({ id: t.id, schoolId }); }
                catch (e) { alert(e instanceof Error ? e.message : 'Erreur'); }
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
      {(editing || creating) && (
        <StudentTypeFormDialog
          schoolId={schoolId} type={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3 : `StudentTypeFormDialog.tsx`** — modal similaire à `SchoolYearFormDialog` avec champs `code`, `label`, `is_default` (checkbox), `order` (number, défaut = max+1).

```tsx
'use client';

import { useState } from 'react';
import { useUpsertStudentType, useStudentTypes, type StudentType } from '@edukea/shared';
import { Button, Input, Label } from '@edukea/ui';
import { X } from 'lucide-react';

interface Props { schoolId: string; type: StudentType | null; onClose: () => void; }

export function StudentTypeFormDialog({ schoolId, type, onClose }: Props) {
  const { data: existing } = useStudentTypes(schoolId);
  const upsert = useUpsertStudentType();
  const [code, setCode] = useState(type?.code ?? '');
  const [label, setLabel] = useState(type?.label ?? '');
  const [isDefault, setIsDefault] = useState(type?.is_default ?? false);
  const nextOrder = type?.order ?? (Math.max(0, ...(existing ?? []).map((t) => t.order)) + 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsert.mutateAsync({
      id: type?.id, school_id: schoolId, code, label, order: nextOrder, is_default: isDefault,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{type ? 'Éditer' : 'Ajouter'} type d'élève</h2>
          <button type="button" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div><Label>Code (technique, ex: boursier)</Label><Input value={code} onChange={(e) => setCode(e.target.value)} required /></div>
          <div><Label>Libellé (affiché)</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} required /></div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            <span className="text-sm">Type par défaut (attribué automatiquement aux nouveaux élèves)</span>
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={upsert.isPending}>Enregistrer</Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4 : TS + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm tsc --noEmit --project apps/school/tsconfig.json 2>&1 | tail -5
git add "apps/school/src/app/(dashboard)/dashboard/pedagogy/student-types/"
git commit -m "feat(school): /pedagogy/student-types — CRUD types d'élèves avec guard cascade (S3D.2 Bloc 1)"
```

---

## Task 11 : Page `/pedagogy/structure` (master-detail)

**Files :**
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/structure/page.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/structure/_components/StructureLayout.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/structure/_components/StructureTree.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/structure/_components/StructureDetail.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/structure/_components/LoadTemplateDialog.tsx`

- [ ] **Step 1 : Page** — pattern auth, importe `<StructureLayout schoolId={...} />`.

- [ ] **Step 2 : `StructureLayout.tsx`** — orchestrateur avec state de sélection

```tsx
'use client';

import { useState } from 'react';
import { useSchoolStructure } from '@edukea/shared';
import { Skeleton, Button } from '@edukea/ui';
import { StructureTree } from './StructureTree';
import { StructureDetail } from './StructureDetail';
import { LoadTemplateDialog } from './LoadTemplateDialog';
import { Sparkles } from 'lucide-react';

export type SelectedNode =
  | { type: 'cycle'; id: string }
  | { type: 'level'; id: string }
  | { type: 'classroom'; id: string }
  | null;

interface Props { schoolId: string; }

export function StructureLayout({ schoolId }: Props) {
  const { data: structure, isLoading } = useSchoolStructure(schoolId);
  const [selected, setSelected] = useState<SelectedNode>(null);
  const [showTemplate, setShowTemplate] = useState(false);

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  const hasStructure = (structure?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          {structure?.reduce((n, c) => n + c.levels.length, 0)} niveaux · {' '}
          {structure?.reduce((n, c) => n + c.levels.reduce((m, l) => m + l.classrooms.length, 0), 0)} classes
        </div>
        <Button variant="outline" onClick={() => setShowTemplate(true)}>
          <Sparkles className="mr-2 h-4 w-4" /> Charger template
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
        <div className="rounded-xl border bg-white p-3">
          {hasStructure
            ? <StructureTree structure={structure!} selected={selected} onSelect={setSelected} />
            : <p className="text-sm text-slate-500 text-center py-8">Aucune structure. Chargez un template ou ajoutez un cycle manuellement.</p>
          }
        </div>
        <div className="rounded-xl border bg-white p-4">
          <StructureDetail schoolId={schoolId} structure={structure ?? []} selected={selected} onSelect={setSelected} />
        </div>
      </div>

      {showTemplate && <LoadTemplateDialog schoolId={schoolId} onClose={() => setShowTemplate(false)} />}
    </div>
  );
}
```

- [ ] **Step 3 : `StructureTree.tsx`** — panel gauche avec arborescence collapsible

```tsx
'use client';

import { useState } from 'react';
import type { StructureCycle } from '@edukea/shared';
import { ChevronRight, ChevronDown, Building2, Layers, DoorOpen } from 'lucide-react';
import type { SelectedNode } from './StructureLayout';

interface Props {
  structure: StructureCycle[];
  selected: SelectedNode;
  onSelect: (node: SelectedNode) => void;
}

export function StructureTree({ structure, selected, onSelect }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    const s = new Set(expanded);
    if (s.has(id)) s.delete(id); else s.add(id);
    setExpanded(s);
  };

  const nodeClass = (kind: string, id: string) => {
    const isSelected = selected?.type === kind && selected.id === id;
    return `flex items-center gap-2 rounded px-2 py-1 text-sm cursor-pointer ${
      isSelected ? 'bg-orange-100 text-orange-900 font-medium' : 'hover:bg-slate-50'
    }`;
  };

  return (
    <div className="space-y-1">
      {structure.map((cycle) => {
        const cycleExp = expanded.has(cycle.id);
        return (
          <div key={cycle.id}>
            <div className={nodeClass('cycle', cycle.id)} onClick={() => onSelect({ type: 'cycle', id: cycle.id })}>
              <button onClick={(e) => { e.stopPropagation(); toggle(cycle.id); }}>
                {cycleExp ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              <Building2 className="h-4 w-4 text-slate-500" />
              <span>{cycle.name}</span>
            </div>
            {cycleExp && cycle.levels.map((level) => {
              const levelExp = expanded.has(level.id);
              return (
                <div key={level.id} className="ml-6">
                  <div className={nodeClass('level', level.id)} onClick={() => onSelect({ type: 'level', id: level.id })}>
                    <button onClick={(e) => { e.stopPropagation(); toggle(level.id); }}>
                      {levelExp ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>
                    <Layers className="h-4 w-4 text-slate-500" />
                    <span>{level.name}</span>
                  </div>
                  {levelExp && level.classrooms.map((cr) => (
                    <div
                      key={cr.id}
                      className={`${nodeClass('classroom', cr.id)} ml-6`}
                      onClick={() => onSelect({ type: 'classroom', id: cr.id })}
                    >
                      <span className="w-3" />
                      <DoorOpen className="h-4 w-4 text-slate-500" />
                      <span>{cr.name}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4 : `StructureDetail.tsx`** — panel droit avec form contextuel

```tsx
'use client';

import { useState, useEffect } from 'react';
import type { StructureCycle } from '@edukea/shared';
import {
  useUpsertCycle, useDeleteCycle, useUpsertLevel, useDeleteLevel,
  useUpsertClassroom, useDeleteClassroom,
} from '@edukea/shared';
import { Button, Input, Label } from '@edukea/ui';
import { Plus, Trash2 } from 'lucide-react';
import type { SelectedNode } from './StructureLayout';

interface Props {
  schoolId: string;
  structure: StructureCycle[];
  selected: SelectedNode;
  onSelect: (n: SelectedNode) => void;
}

export function StructureDetail({ schoolId, structure, selected, onSelect }: Props) {
  const uc = useUpsertCycle(); const dc = useDeleteCycle();
  const ul = useUpsertLevel(); const dl = useDeleteLevel();
  const ur = useUpsertClassroom(); const dr = useDeleteClassroom();
  const [name, setName] = useState('');

  const findCycle = (id: string) => structure.find((c) => c.id === id);
  const findLevel = (id: string) => structure.flatMap((c) => c.levels).find((l) => l.id === id);
  const findClassroom = (id: string) => structure.flatMap((c) => c.levels).flatMap((l) => l.classrooms).find((cr) => cr.id === id);

  useEffect(() => {
    if (!selected) { setName(''); return; }
    if (selected.type === 'cycle') setName(findCycle(selected.id)?.name ?? '');
    if (selected.type === 'level') setName(findLevel(selected.id)?.name ?? '');
    if (selected.type === 'classroom') setName(findClassroom(selected.id)?.name ?? '');
  }, [selected, structure]);

  if (!selected) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Sélectionne un élément à gauche pour l'éditer, ou :</p>
        <Button onClick={async () => {
          const n = prompt('Nom du nouveau cycle (ex: Collège)');
          if (n) await uc.mutateAsync({ school_id: schoolId, name: n });
        }}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter un cycle
        </Button>
      </div>
    );
  }

  const saveName = async () => {
    if (selected.type === 'cycle') await uc.mutateAsync({ id: selected.id, school_id: schoolId, name });
    else if (selected.type === 'level') {
      const l = findLevel(selected.id)!;
      await ul.mutateAsync({ id: l.id, school_id: schoolId, cycle_id: l.cycle_id, name, order: l.order });
    } else if (selected.type === 'classroom') {
      const c = findClassroom(selected.id)!;
      await ur.mutateAsync({ id: c.id, school_id: schoolId, level_id: c.level_id, name });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Nom</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} />
      </div>
      <div className="flex gap-2">
        {selected.type === 'cycle' && (
          <Button variant="outline" onClick={async () => {
            const n = prompt('Nom du niveau (ex: 6ème)');
            if (n) {
              const cycle = findCycle(selected.id)!;
              const nextOrder = Math.max(0, ...cycle.levels.map((l) => l.order)) + 1;
              await ul.mutateAsync({ school_id: schoolId, cycle_id: cycle.id, name: n, order: nextOrder });
            }
          }}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter niveau
          </Button>
        )}
        {selected.type === 'level' && (
          <Button variant="outline" onClick={async () => {
            const n = prompt('Nom de la classe (ex: 6ème A)');
            if (n) await ur.mutateAsync({ school_id: schoolId, level_id: selected.id, name: n });
          }}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter classe
          </Button>
        )}
        <Button variant="ghost" onClick={async () => {
          if (!confirm(`Supprimer ${name} et tous ses enfants ? Cascade.`)) return;
          if (selected.type === 'cycle') await dc.mutateAsync({ id: selected.id, schoolId });
          else if (selected.type === 'level') await dl.mutateAsync({ id: selected.id, schoolId });
          else await dr.mutateAsync({ id: selected.id, schoolId });
          onSelect(null);
        }}>
          <Trash2 className="mr-2 h-4 w-4 text-red-500" /> Supprimer
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5 : `LoadTemplateDialog.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useStructureTemplates, useSeedStructureFromTemplate } from '@edukea/shared';
import { Button, Skeleton } from '@edukea/ui';
import { X } from 'lucide-react';

interface Props { schoolId: string; onClose: () => void; }

export function LoadTemplateDialog({ schoolId, onClose }: Props) {
  const { data: templates, isLoading } = useStructureTemplates();
  const seed = useSeedStructureFromTemplate();
  const [selected, setSelected] = useState<string | null>(null);

  const apply = async () => {
    if (!selected) return;
    await seed.mutateAsync({ schoolId, templateKey: selected });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Charger un template</h2>
          <button type="button" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        {isLoading ? <Skeleton className="h-40 w-full" /> : (
          <div className="space-y-2">
            {(templates ?? []).map((t) => (
              <label key={t.template_key} className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer ${
                selected === t.template_key ? 'border-orange-500 bg-orange-50' : 'border-slate-200'
              }`}>
                <input type="radio" checked={selected === t.template_key} onChange={() => setSelected(t.template_key)} />
                <div>
                  <p className="font-medium">{t.cycle_name}</p>
                  <p className="text-xs text-slate-500">{t.levels.map((l) => l.name).join(' · ')}</p>
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={apply} disabled={!selected || seed.isPending}>
            {seed.isPending ? 'Chargement…' : 'Appliquer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6 : TS + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm tsc --noEmit --project apps/school/tsconfig.json 2>&1 | tail -5
git add "apps/school/src/app/(dashboard)/dashboard/pedagogy/structure/"
git commit -m "feat(school): /pedagogy/structure — master-detail arborescence + template loader (S3D.2 Bloc 1)"
```

---

# Phase 3D.2.2 — Bloc 2 (Frais matriciels)

## Task 12 : Hooks partagés Bloc 2

**Files :**
- Create : `packages/shared/src/hooks/useLevelFeeLines.ts`
- Create : `packages/shared/src/hooks/useLevelFeeInstallments.ts`
- Create : `packages/shared/src/hooks/useFeesOverviewMatrix.ts`
- Create : `packages/shared/src/hooks/useClassroomEffectiveFees.ts`
- Create : `packages/shared/src/hooks/useClassroomEffectiveInstallments.ts`
- Create : `packages/shared/src/hooks/useFeeMutations.ts`
- Modify : `packages/shared/src/hooks/index.ts`

- [ ] **Step 1 : `useLevelFeeLines.ts` + mutations dans même fichier**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface LevelFeeLine {
  id: string;
  level_id: string;
  student_type_id: string;
  category: string;
  label: string;
  amount: number;
  order: number;
  is_optional: boolean;
}

export function useLevelFeeLines(levelId: string | undefined, studentTypeId: string | undefined) {
  return useQuery<LevelFeeLine[]>({
    queryKey: ['level-fee-lines', levelId, studentTypeId],
    queryFn: async () => {
      if (!levelId || !studentTypeId) return [];
      const { data, error } = await supabase
        .from('level_fee_lines')
        .select('*')
        .eq('level_id', levelId)
        .eq('student_type_id', studentTypeId)
        .order('order');
      if (error) throw error;
      return (data ?? []) as LevelFeeLine[];
    },
    enabled: !!levelId && !!studentTypeId,
  });
}

export interface LevelFeeLineInput {
  id?: string;
  level_id: string;
  student_type_id: string;
  category: string;
  label: string;
  amount: number;
  order: number;
  is_optional: boolean;
}

export function useUpsertLevelFeeLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LevelFeeLineInput) => {
      const { data, error } = await supabase.from('level_fee_lines').upsert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['level-fee-lines', input.level_id, input.student_type_id] });
      qc.invalidateQueries({ queryKey: ['fees-overview-matrix'] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status'] });
    },
  });
}

export function useDeleteLevelFeeLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; levelId: string; studentTypeId: string }) => {
      const { error } = await supabase.from('level_fee_lines').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { levelId, studentTypeId }) => {
      qc.invalidateQueries({ queryKey: ['level-fee-lines', levelId, studentTypeId] });
      qc.invalidateQueries({ queryKey: ['fees-overview-matrix'] });
    },
  });
}
```

- [ ] **Step 2 : `useLevelFeeInstallments.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface LevelFeeInstallment {
  id: string;
  level_id: string;
  student_type_id: string;
  order: number;
  label: string;
  category: string;
  due_date_offset_days: number;
  amount: number | null;
  amount_percentage: number | null;
}

export function useLevelFeeInstallments(levelId: string | undefined, studentTypeId: string | undefined) {
  return useQuery<LevelFeeInstallment[]>({
    queryKey: ['level-fee-installments', levelId, studentTypeId],
    queryFn: async () => {
      if (!levelId || !studentTypeId) return [];
      const { data, error } = await supabase
        .from('level_fee_installments')
        .select('*')
        .eq('level_id', levelId)
        .eq('student_type_id', studentTypeId)
        .order('order');
      if (error) throw error;
      return (data ?? []) as LevelFeeInstallment[];
    },
    enabled: !!levelId && !!studentTypeId,
  });
}

export interface LevelFeeInstallmentInput extends Omit<LevelFeeInstallment, 'id'> { id?: string; }

export function useUpsertLevelFeeInstallment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LevelFeeInstallmentInput) => {
      const { data, error } = await supabase.from('level_fee_installments').upsert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['level-fee-installments', input.level_id, input.student_type_id] });
    },
  });
}

export function useDeleteLevelFeeInstallment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; levelId: string; studentTypeId: string }) => {
      const { error } = await supabase.from('level_fee_installments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { levelId, studentTypeId }) => {
      qc.invalidateQueries({ queryKey: ['level-fee-installments', levelId, studentTypeId] });
    },
  });
}
```

- [ ] **Step 3 : `useFeesOverviewMatrix.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface FeesMatrixRow {
  level_id: string;
  level_name: string;
  level_order: number;
  school_id: string;
  student_type_id: string;
  student_type_code: string;
  student_type_label: string;
  student_type_order: number;
  total_mandatory: number;
  total_with_options: number;
  lines_count: number;
  installments_count: number;
}

export function useFeesOverviewMatrix(schoolId: string | undefined) {
  return useQuery<FeesMatrixRow[]>({
    queryKey: ['fees-overview-matrix', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from('v_fees_overview_matrix')
        .select('*')
        .eq('school_id', schoolId)
        .order('level_order')
        .order('student_type_order');
      if (error) throw error;
      return (data ?? []) as FeesMatrixRow[];
    },
    enabled: !!schoolId,
  });
}
```

- [ ] **Step 4 : `useClassroomEffectiveFees.ts` + `useClassroomEffectiveInstallments.ts`**

```typescript
// useClassroomEffectiveFees.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface EffectiveFee {
  classroom_id: string;
  student_type_id: string;
  category: string;
  label: string;
  amount: number;
  order: number;
  source: 'classroom_override' | 'level';
}

export function useClassroomEffectiveFees(classroomId: string | undefined, studentTypeId: string | undefined) {
  return useQuery<EffectiveFee[]>({
    queryKey: ['classroom-effective-fees', classroomId, studentTypeId],
    queryFn: async () => {
      if (!classroomId || !studentTypeId) return [];
      const { data, error } = await supabase
        .from('v_classroom_effective_fees')
        .select('*')
        .eq('classroom_id', classroomId)
        .eq('student_type_id', studentTypeId)
        .order('order');
      if (error) throw error;
      return (data ?? []) as EffectiveFee[];
    },
    enabled: !!classroomId && !!studentTypeId,
  });
}
```

```typescript
// useClassroomEffectiveInstallments.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface EffectiveInstallment {
  classroom_id: string;
  student_type_id: string;
  order: number;
  label: string;
  category: string;
  due_date: string;
  amount: number;
  source: 'classroom_override' | 'level';
}

export function useClassroomEffectiveInstallments(classroomId: string | undefined, studentTypeId: string | undefined) {
  return useQuery<EffectiveInstallment[]>({
    queryKey: ['classroom-effective-installments', classroomId, studentTypeId],
    queryFn: async () => {
      if (!classroomId || !studentTypeId) return [];
      const { data, error } = await supabase
        .from('v_classroom_effective_installments')
        .select('*')
        .eq('classroom_id', classroomId)
        .eq('student_type_id', studentTypeId)
        .order('order');
      if (error) throw error;
      return (data ?? []) as EffectiveInstallment[];
    },
    enabled: !!classroomId && !!studentTypeId,
  });
}
```

- [ ] **Step 5 : `useFeeMutations.ts` — copie + template**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useCopyFeesFromType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ levelId, sourceTypeId, targetTypeId }: {
      levelId: string; sourceTypeId: string; targetTypeId: string;
    }): Promise<number> => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string, args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>)('copy_fees_between_student_types', {
        p_level_id: levelId, p_source_type_id: sourceTypeId, p_target_type_id: targetTypeId,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    onSuccess: (_, { levelId, targetTypeId }) => {
      qc.invalidateQueries({ queryKey: ['level-fee-lines', levelId, targetTypeId] });
      qc.invalidateQueries({ queryKey: ['level-fee-installments', levelId, targetTypeId] });
      qc.invalidateQueries({ queryKey: ['fees-overview-matrix'] });
    },
  });
}
```

- [ ] **Step 6 : Barrel exports**

Ajouter à `packages/shared/src/hooks/index.ts` :

```typescript
export * from './useLevelFeeLines';
export * from './useLevelFeeInstallments';
export * from './useFeesOverviewMatrix';
export * from './useClassroomEffectiveFees';
export * from './useClassroomEffectiveInstallments';
export * from './useFeeMutations';
```

- [ ] **Step 7 : TS + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm tsc --noEmit --project packages/shared/tsconfig.json 2>&1 | tail -5
git add packages/shared/src/hooks/useLevelFeeLines.ts \
        packages/shared/src/hooks/useLevelFeeInstallments.ts \
        packages/shared/src/hooks/useFeesOverviewMatrix.ts \
        packages/shared/src/hooks/useClassroomEffectiveFees.ts \
        packages/shared/src/hooks/useClassroomEffectiveInstallments.ts \
        packages/shared/src/hooks/useFeeMutations.ts \
        packages/shared/src/hooks/index.ts
git commit -m "feat(shared): S3D.2 Bloc 2 hooks (fee_lines, installments, overview, effective, copy) (S3D.2)"
```

---

## Task 13 : Page `/pedagogy/fees` (overview matrice)

**Files :**
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/fees/page.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/fees/_components/FeesOverviewMatrix.tsx`

- [ ] **Step 1 : Page** (auth pattern identique).

- [ ] **Step 2 : `FeesOverviewMatrix.tsx`**

```tsx
'use client';

import { useFeesOverviewMatrix, useStudentTypes, type FeesMatrixRow } from '@edukea/shared';
import { Skeleton } from '@edukea/ui';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Props { schoolId: string; }

const XAF = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function FeesOverviewMatrix({ schoolId }: Props) {
  const { data: matrix, isLoading: mL } = useFeesOverviewMatrix(schoolId);
  const { data: types, isLoading: tL } = useStudentTypes(schoolId);

  if (mL || tL) return <Skeleton className="h-64 w-full" />;
  if (!matrix?.length) {
    return <p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
      Aucun niveau ou type d'élève. <Link href="/dashboard/pedagogy/structure" className="text-orange-600 underline">Configurez d'abord la structure</Link>.
    </p>;
  }

  // Pivot : lignes = niveaux, colonnes = types
  const levels = Array.from(new Map(matrix.map((r) => [r.level_id, { id: r.level_id, name: r.level_name, order: r.level_order }])).values())
    .sort((a, b) => a.order - b.order);

  const cell = (levelId: string, typeId: string): FeesMatrixRow | undefined =>
    matrix.find((r) => r.level_id === levelId && r.student_type_id === typeId);

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Niveau</th>
            {(types ?? []).map((t) => (
              <th key={t.id} className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">{t.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {levels.map((l) => (
            <tr key={l.id} className="border-b last:border-none hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link href={`/dashboard/pedagogy/fees/${l.id}`} className="font-medium text-slate-900 hover:text-orange-600">{l.name}</Link>
              </td>
              {(types ?? []).map((t) => {
                const c = cell(l.id, t.id);
                const empty = !c || c.lines_count === 0;
                return (
                  <td key={t.id} className="px-4 py-3">
                    <Link href={`/dashboard/pedagogy/fees/${l.id}?type=${t.id}`} className="inline-flex items-center gap-2">
                      {empty ? (
                        <>
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="text-sm text-slate-500">—</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-slate-900">{XAF.format(c.total_mandatory)}</span>
                        </>
                      )}
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3 : TS + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm tsc --noEmit --project apps/school/tsconfig.json 2>&1 | tail -5
git add "apps/school/src/app/(dashboard)/dashboard/pedagogy/fees/page.tsx" \
        "apps/school/src/app/(dashboard)/dashboard/pedagogy/fees/_components/"
git commit -m "feat(school): /pedagogy/fees overview matrice niveau × type (S3D.2 Bloc 2)"
```

---

## Task 14 : Page `/pedagogy/fees/[levelId]` (édition niveau)

**Files :**
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/fees/[levelId]/page.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/pedagogy/fees/[levelId]/_components/FeeLevelEditor.tsx`

- [ ] **Step 1 : Page** (auth pattern), reçoit `levelId` en params + éventuel `?type=<id>` en searchParams.

- [ ] **Step 2 : `FeeLevelEditor.tsx`**

```tsx
'use client';

import { useState, useEffect } from 'react';
import {
  useStudentTypes, useLevelFeeLines, useLevelFeeInstallments,
  useUpsertLevelFeeLine, useDeleteLevelFeeLine,
  useUpsertLevelFeeInstallment, useDeleteLevelFeeInstallment,
  useCopyFeesFromType,
  type LevelFeeLine, type LevelFeeInstallment,
} from '@edukea/shared';
import { Button, Input, Skeleton } from '@edukea/ui';
import { Plus, Trash2, Copy } from 'lucide-react';

interface Props { schoolId: string; levelId: string; initialTypeId?: string; }

const XAF = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const CATEGORIES = ['inscription', 'tuition', 'insurance', 'canteen', 'transport', 'other'] as const;

export function FeeLevelEditor({ schoolId, levelId, initialTypeId }: Props) {
  const { data: types } = useStudentTypes(schoolId);
  const [typeId, setTypeId] = useState<string | undefined>(initialTypeId);

  useEffect(() => {
    if (!typeId && types && types.length > 0) setTypeId(types[0].id);
  }, [types, typeId]);

  const { data: lines, isLoading: lL } = useLevelFeeLines(levelId, typeId);
  const { data: installments, isLoading: iL } = useLevelFeeInstallments(levelId, typeId);
  const upLine = useUpsertLevelFeeLine(); const delLine = useDeleteLevelFeeLine();
  const upInst = useUpsertLevelFeeInstallment(); const delInst = useDeleteLevelFeeInstallment();
  const copy = useCopyFeesFromType();

  if (!types || !typeId || lL || iL) return <Skeleton className="h-96 w-full" />;

  const totalMandatory = (lines ?? []).filter((l) => !l.is_optional).reduce((s, l) => s + l.amount, 0);
  const totalWithOptions = (lines ?? []).reduce((s, l) => s + l.amount, 0);

  const addLine = () => {
    const nextOrder = Math.max(0, ...(lines ?? []).map((l) => l.order)) + 1;
    upLine.mutate({
      level_id: levelId, student_type_id: typeId, category: 'other', label: 'Nouvelle ligne',
      amount: 0, order: nextOrder, is_optional: false,
    });
  };
  const addInstallment = () => {
    const nextOrder = Math.max(0, ...(installments ?? []).map((i) => i.order)) + 1;
    upInst.mutate({
      level_id: levelId, student_type_id: typeId, order: nextOrder, label: `Tranche ${nextOrder}`,
      category: 'tuition', due_date_offset_days: 0, amount: 0, amount_percentage: null,
    });
  };
  const doCopy = async () => {
    const src = prompt(`Copier depuis quel type ? Codes : ${types.map((t) => t.code).join(', ')}`);
    if (!src) return;
    const source = types.find((t) => t.code === src);
    if (!source || source.id === typeId) { alert('Type source invalide'); return; }
    await copy.mutateAsync({ levelId, sourceTypeId: source.id, targetTypeId: typeId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Type d'élève :</span>
        {types.map((t) => (
          <button
            key={t.id} onClick={() => setTypeId(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              typeId === t.id ? 'bg-orange-600 text-white' : 'bg-slate-100 hover:bg-slate-200'
            }`}
          >{t.label}</button>
        ))}
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={doCopy}><Copy className="mr-2 h-4 w-4" /> Copier depuis autre type</Button>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Lignes de frais</h2>
          <Button size="sm" onClick={addLine}><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>
        </div>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Libellé</th>
                <th className="p-2 text-left">Catégorie</th>
                <th className="p-2 text-right">Montant (XAF)</th>
                <th className="p-2 text-center">Opt.</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(lines ?? []).map((l) => (
                <FeeLineRow key={l.id} line={l} onSave={(p) => upLine.mutate({ ...l, ...p })}
                  onDelete={() => delLine.mutate({ id: l.id, levelId, studentTypeId: typeId })} />
              ))}
              <tr className="border-t bg-slate-50 font-semibold">
                <td colSpan={3} className="p-2 text-right">Total obligatoire</td>
                <td className="p-2 text-right">{XAF.format(totalMandatory)}</td>
                <td colSpan={2}></td>
              </tr>
              {totalWithOptions !== totalMandatory && (
                <tr className="bg-slate-50 text-slate-600">
                  <td colSpan={3} className="p-2 text-right">Total avec options</td>
                  <td className="p-2 text-right">{XAF.format(totalWithOptions)}</td>
                  <td colSpan={2}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Échéances</h2>
          <Button size="sm" onClick={addInstallment}><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>
        </div>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Libellé</th>
                <th className="p-2 text-left">Catégorie</th>
                <th className="p-2 text-right">+Jours</th>
                <th className="p-2 text-right">Montant</th>
                <th className="p-2 text-right">%</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(installments ?? []).map((i) => (
                <InstallmentRow key={i.id} inst={i} onSave={(p) => upInst.mutate({ ...i, ...p })}
                  onDelete={() => delInst.mutate({ id: i.id, levelId, studentTypeId: typeId })} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FeeLineRow({ line, onSave, onDelete }: {
  line: LevelFeeLine;
  onSave: (patch: Partial<LevelFeeLine>) => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-t">
      <td className="p-2">{line.order}</td>
      <td className="p-2"><Input defaultValue={line.label} onBlur={(e) => onSave({ label: e.target.value })} /></td>
      <td className="p-2">
        <select defaultValue={line.category} onChange={(e) => onSave({ category: e.target.value })} className="rounded border px-2 py-1 text-sm">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="p-2 text-right">
        <Input type="number" defaultValue={line.amount} className="w-24 text-right"
          onBlur={(e) => onSave({ amount: Number(e.target.value) })} />
      </td>
      <td className="p-2 text-center">
        <input type="checkbox" defaultChecked={line.is_optional} onChange={(e) => onSave({ is_optional: e.target.checked })} />
      </td>
      <td className="p-2 text-right">
        <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </td>
    </tr>
  );
}

function InstallmentRow({ inst, onSave, onDelete }: {
  inst: LevelFeeInstallment;
  onSave: (patch: Partial<LevelFeeInstallment>) => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-t">
      <td className="p-2">{inst.order}</td>
      <td className="p-2"><Input defaultValue={inst.label} onBlur={(e) => onSave({ label: e.target.value })} /></td>
      <td className="p-2">
        <select defaultValue={inst.category} onChange={(e) => onSave({ category: e.target.value })} className="rounded border px-2 py-1 text-sm">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="p-2 text-right">
        <Input type="number" defaultValue={inst.due_date_offset_days} className="w-20 text-right"
          onBlur={(e) => onSave({ due_date_offset_days: Number(e.target.value) })} />
      </td>
      <td className="p-2 text-right">
        <Input type="number" defaultValue={inst.amount ?? ''} className="w-24 text-right"
          onBlur={(e) => onSave({ amount: e.target.value ? Number(e.target.value) : null })} />
      </td>
      <td className="p-2 text-right">
        <Input type="number" defaultValue={inst.amount_percentage ?? ''} className="w-16 text-right"
          onBlur={(e) => onSave({ amount_percentage: e.target.value ? Number(e.target.value) : null })} />
      </td>
      <td className="p-2 text-right">
        <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </td>
    </tr>
  );
}
```

- [ ] **Step 3 : TS + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm tsc --noEmit --project apps/school/tsconfig.json 2>&1 | tail -5
git add "apps/school/src/app/(dashboard)/dashboard/pedagogy/fees/[levelId]/"
git commit -m "feat(school): /pedagogy/fees/[levelId] édition frais + échéances par type (S3D.2 Bloc 2)"
```

---

# Phase 3D.2.3 — Bloc 3 (Patch inscription + retest réinscription)

## Task 15 : Patch `StepStudent` (dropdown type d'élève)

**Files :**
- Modify : `apps/school/src/app/(dashboard)/dashboard/enrollment/new/_types.ts`
- Modify : `apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepStudent.tsx`

- [ ] **Step 1 : Lire les fichiers actuels**

```bash
cat "apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepStudent.tsx" | head -80
```

- [ ] **Step 2 : Renforcer `isStepStudentValid` dans `_types.ts`**

Modifier la fonction pour inclure `typeStudentId` requis :

```typescript
export function isStepStudentValid(s: EnrollmentFormState['student'], typeStudentId: string | undefined): boolean {
  return !!s.firstname.trim() && !!s.lastname.trim() && !!s.sex && !!s.birthdate && !!typeStudentId;
}
```

- [ ] **Step 3 : Patcher `StepStudent.tsx`** — ajouter dropdown type

Ajouter dans le composant (structure préservée, juste un nouveau `<div>` avec le select) :

```tsx
import { useStudentTypes } from '@edukea/shared';

// dans le body du composant
const { data: studentTypes } = useStudentTypes(schoolId);

useEffect(() => {
  // Auto-set du type par défaut si non défini
  if (!state.typeStudentId && studentTypes && studentTypes.length > 0) {
    const def = studentTypes.find((t) => t.is_default) ?? studentTypes[0];
    updateState({ typeStudentId: def.id });
  }
}, [studentTypes, state.typeStudentId, updateState]);

// dans le JSX, à côté du dropdown "sexe" ou après :
<div>
  <Label>Type d'élève *</Label>
  <select
    value={state.typeStudentId ?? ''}
    onChange={(e) => updateState({ typeStudentId: e.target.value })}
    required
    className="w-full rounded border px-3 py-2 text-sm"
  >
    <option value="">— Sélectionner —</option>
    {(studentTypes ?? []).map((t) => (
      <option key={t.id} value={t.id}>{t.label}</option>
    ))}
  </select>
</div>
```

- [ ] **Step 4 : Mettre à jour l'appel de `isStepStudentValid` dans l'orchestrateur**

Rechercher dans `page.tsx` ou dans les autres steps, l'appel `isStepStudentValid(state.student)` — le remplacer par `isStepStudentValid(state.student, state.typeStudentId)`.

- [ ] **Step 5 : TS + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm tsc --noEmit --project apps/school/tsconfig.json 2>&1 | tail -10
git add "apps/school/src/app/(dashboard)/dashboard/enrollment/new/_types.ts" \
        "apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepStudent.tsx"
git commit -m "feat(school): S3B StepStudent — dropdown type d'élève requis (S3D.2 Bloc 3)"
```

---

## Task 16 : Patch `StepClassroom` (fetch effective fees + warning si vide)

**Files :**
- Modify : `apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepClassroom.tsx`

- [ ] **Step 1 : Lire le fichier + comprendre le shape**

```bash
cat "apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepClassroom.tsx" | head -80
```

- [ ] **Step 2 : Après sélection classroom, précalculer les frais + warning**

Ajouter au composant :

```tsx
import { useClassroomEffectiveFees } from '@edukea/shared';

const { data: effective, isLoading: feesLoading } = useClassroomEffectiveFees(
  state.classroomId || undefined,
  state.typeStudentId || undefined,
);

const total = (effective ?? []).filter((f) => f.category !== 'canteen' && f.category !== 'transport')
  .reduce((s, f) => s + f.amount, 0);

// Dans le JSX, sous le sélecteur classroom :
{state.classroomId && state.typeStudentId && !feesLoading && (
  <>
    {(effective ?? []).length === 0 ? (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        ⚠ Aucune configuration de frais pour cette combinaison classe × type d'élève.
        Contactez le manager pour configurer les frais dans <code>/pedagogy/fees</code>.
      </div>
    ) : (
      <div className="rounded-xl border bg-slate-50 p-4 text-sm">
        <p className="mb-2 font-medium">Frais à prévoir :</p>
        <ul className="space-y-1">
          {(effective ?? []).map((f) => (
            <li key={f.label} className="flex justify-between">
              <span>{f.label}</span>
              <span className="font-mono">{f.amount.toLocaleString('fr-FR')} XAF</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 border-t pt-2 flex justify-between font-semibold">
          <span>Total obligatoire</span>
          <span>{total.toLocaleString('fr-FR')} XAF</span>
        </div>
      </div>
    )}
  </>
)}
```

- [ ] **Step 3 : Bloquer le passage à l'étape suivante si aucun frais**

Modifier `isStepClassroomValid` pour vérifier aussi qu'un feesId ou effective fees existent :

Dans `_types.ts` :
```typescript
export function isStepClassroomValid(state: EnrollmentFormState): boolean {
  return !!state.classroomId;
  // Note : validation "frais présents" est laissée à l'orchestrateur qui a accès aux hooks
}
```

Dans le composant `StepClassroom`, un état local `canProceed = (effective?.length ?? 0) > 0` + effet qui remonte cet état au parent (si l'orchestrateur en tient compte).

- [ ] **Step 4 : TS + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm tsc --noEmit --project apps/school/tsconfig.json 2>&1 | tail -5
git add "apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepClassroom.tsx" \
        "apps/school/src/app/(dashboard)/dashboard/enrollment/new/_types.ts"
git commit -m "feat(school): S3B StepClassroom — précalcul frais + warning si config vide (S3D.2 Bloc 3)"
```

---

## Task 17 : Refonte `StepFeesPayment` (tableau lignes + calendrier + récap ventilation)

**Files :**
- Modify : `apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepFeesPayment.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/FeesLinesTable.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/InstallmentsSchedule.tsx`
- Create : `apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/PaymentAllocationPreview.tsx`

- [ ] **Step 1 : Lire l'existant**

```bash
cat "apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepFeesPayment.tsx"
```

- [ ] **Step 2 : Créer `FeesLinesTable.tsx`**

```tsx
'use client';

import type { EffectiveFee } from '@edukea/shared';

interface Props { fees: EffectiveFee[]; }

const XAF = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function FeesLinesTable({ fees }: Props) {
  const mandatoryTotal = fees.filter((f) => !['canteen', 'transport'].includes(f.category)).reduce((s, f) => s + f.amount, 0);
  const totalAll = fees.reduce((s, f) => s + f.amount, 0);

  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="p-2 text-left">Libellé</th>
            <th className="p-2 text-left">Catégorie</th>
            <th className="p-2 text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {fees.map((f, i) => (
            <tr key={`${f.label}-${i}`} className="border-t">
              <td className="p-2">{f.label}</td>
              <td className="p-2 text-xs text-slate-500">{f.category}</td>
              <td className="p-2 text-right font-mono">{XAF.format(f.amount)}</td>
            </tr>
          ))}
          <tr className="border-t bg-slate-50 font-semibold">
            <td colSpan={2} className="p-2 text-right">Total obligatoire</td>
            <td className="p-2 text-right font-mono">{XAF.format(mandatoryTotal)}</td>
          </tr>
          {totalAll !== mandatoryTotal && (
            <tr className="bg-slate-50 text-slate-600">
              <td colSpan={2} className="p-2 text-right">Total avec options</td>
              <td className="p-2 text-right font-mono">{XAF.format(totalAll)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3 : Créer `InstallmentsSchedule.tsx`**

```tsx
'use client';

import type { EffectiveInstallment } from '@edukea/shared';

interface Props { installments: EffectiveInstallment[]; }

const XAF = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const DATE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export function InstallmentsSchedule({ installments }: Props) {
  const total = installments.reduce((s, i) => s + i.amount, 0);
  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Libellé</th>
            <th className="p-2 text-left">Échéance</th>
            <th className="p-2 text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {installments.map((i) => (
            <tr key={i.order} className="border-t">
              <td className="p-2">{i.order}</td>
              <td className="p-2">{i.label}</td>
              <td className="p-2 text-slate-600">{i.due_date ? DATE.format(new Date(i.due_date)) : '—'}</td>
              <td className="p-2 text-right font-mono">{XAF.format(i.amount)}</td>
            </tr>
          ))}
          <tr className="border-t bg-slate-50 font-semibold">
            <td colSpan={3} className="p-2 text-right">Total échéances</td>
            <td className="p-2 text-right font-mono">{XAF.format(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4 : Créer `PaymentAllocationPreview.tsx`** — préview de ventilation avant paiement

```tsx
'use client';

import type { EffectiveInstallment } from '@edukea/shared';

interface Props {
  installments: EffectiveInstallment[];
  paymentAmount: number;
}

const XAF = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function PaymentAllocationPreview({ installments, paymentAmount }: Props) {
  if (paymentAmount <= 0) return null;

  const sorted = [...installments].sort((a, b) => a.due_date.localeCompare(b.due_date));
  let left = paymentAmount;
  const allocations: { label: string; alloc: number; remaining: number }[] = [];

  for (const inst of sorted) {
    if (left <= 0) break;
    const alloc = Math.min(left, inst.amount);
    allocations.push({ label: inst.label, alloc, remaining: inst.amount - alloc });
    left -= alloc;
  }

  return (
    <div className="rounded-xl border bg-blue-50 p-4 text-sm">
      <p className="mb-2 font-semibold">Ventilation prévue du paiement de {XAF.format(paymentAmount)} XAF :</p>
      <ul className="space-y-1">
        {allocations.map((a, i) => (
          <li key={i} className="flex justify-between">
            <span>{a.label}</span>
            <span className="font-mono">
              {XAF.format(a.alloc)} XAF
              {a.remaining > 0 && <span className="text-slate-500"> (reste {XAF.format(a.remaining)})</span>}
              {a.remaining === 0 && <span className="text-green-600"> ✓ soldée</span>}
            </span>
          </li>
        ))}
        {left > 0 && (
          <li className="flex justify-between border-t pt-1 text-orange-700">
            <span>Trop-perçu (avance)</span>
            <span className="font-mono">{XAF.format(left)} XAF</span>
          </li>
        )}
      </ul>
    </div>
  );
}
```

- [ ] **Step 5 : Refondre `StepFeesPayment.tsx`**

Remplacer les sections "billed total" par les nouveaux composants. Skeleton du fichier :

```tsx
'use client';

import { useClassroomEffectiveFees, useClassroomEffectiveInstallments } from '@edukea/shared';
import { Skeleton, Input, Label } from '@edukea/ui';
import { FeesLinesTable } from './FeesLinesTable';
import { InstallmentsSchedule } from './InstallmentsSchedule';
import { PaymentAllocationPreview } from './PaymentAllocationPreview';
import type { EnrollmentFormState } from '../_types';

interface Props {
  state: EnrollmentFormState;
  updateState: (patch: Partial<EnrollmentFormState>) => void;
}

export function StepFeesPayment({ state, updateState }: Props) {
  const { data: fees, isLoading: fL } = useClassroomEffectiveFees(state.classroomId, state.typeStudentId);
  const { data: installments, isLoading: iL } = useClassroomEffectiveInstallments(state.classroomId, state.typeStudentId);

  if (fL || iL) return <Skeleton className="h-64 w-full" />;
  if (!fees?.length) return <p className="text-sm text-amber-700">Aucun frais configuré. Retour étape classe.</p>;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase text-slate-600">Frais scolarité</h3>
        <FeesLinesTable fees={fees} />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase text-slate-600">Calendrier de paiement</h3>
        <InstallmentsSchedule installments={installments ?? []} />
      </section>

      <section className="rounded-xl border bg-slate-50 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase text-slate-600">Premier paiement (optionnel)</h3>
        <label className="mb-2 flex items-center gap-2">
          <input
            type="checkbox" checked={state.firstPaymentEnabled}
            onChange={(e) => updateState({ firstPaymentEnabled: e.target.checked })}
          />
          <span className="text-sm">Enregistrer un paiement dès maintenant</span>
        </label>
        {state.firstPaymentEnabled && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Montant (XAF)</Label>
              <Input
                type="number" value={state.firstPayment.amount || ''}
                onChange={(e) => updateState({ firstPayment: { ...state.firstPayment, amount: Number(e.target.value) } })}
              />
            </div>
            <div>
              <Label>Méthode</Label>
              <select
                value={state.firstPayment.source}
                onChange={(e) => updateState({ firstPayment: { ...state.firstPayment, source: e.target.value as 'cash' | 'bank_transfer' | 'internal' } })}
                className="w-full rounded border px-3 py-2 text-sm"
              >
                <option value="cash">Espèces</option>
                <option value="bank_transfer">Virement banc.</option>
                <option value="internal">Interne</option>
              </select>
            </div>
            <div>
              <Label>Mémo</Label>
              <Input value={state.firstPayment.memo}
                onChange={(e) => updateState({ firstPayment: { ...state.firstPayment, memo: e.target.value } })} />
            </div>
          </div>
        )}
        {state.firstPaymentEnabled && state.firstPayment.amount > 0 && (
          <div className="mt-4">
            <PaymentAllocationPreview installments={installments ?? []} paymentAmount={state.firstPayment.amount} />
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 6 : TS + smoke UI + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm tsc --noEmit --project apps/school/tsconfig.json 2>&1 | tail -5
git add "apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/"
git commit -m "feat(school): S3B StepFeesPayment refonte — lignes + calendrier + preview ventilation (S3D.2 Bloc 3)"
```

---

## Task 18 : Retest réinscription (patchs éventuels)

**Files :** varies — dépend de ce qu'on trouve

- [ ] **Step 1 : Localiser les composants réinscription**

```bash
ls apps/school/src/app/\(dashboard\)/dashboard/enrollment/re* 2>&1
ls apps/school/src/app/\(dashboard\)/dashboard/enrollment/passage 2>&1
```

- [ ] **Step 2 : Test manuel scripté**

Sur staging (avec un élève pilote existant) :

```sql
-- Avant réinscription : noter le state
SELECT id, student_type_id FROM students WHERE id = '<pilot-student-id>';
SELECT id, classroom_id, school_year_id FROM student_school_year_loggings WHERE student_id = '<pilot-student-id>' ORDER BY created_at DESC LIMIT 3;
SELECT COUNT(*) FROM payment_allocations pa
  JOIN ledger_transactions lt ON lt.id = pa.payment_tx_id
  JOIN student_school_year_loggings ssyl ON ssyl.id = lt.ref_id
  WHERE ssyl.student_id = '<pilot-student-id>';
```

- [ ] **Step 3 : Faire une réinscription depuis l'UI**

Naviguer vers `/dashboard/enrollment/re[...]` — passer l'élève à la classe suivante avec un paiement de 15000 XAF.

- [ ] **Step 4 : Vérifier post-réinscription**

```sql
-- Le student_type_id est conservé
SELECT id, student_type_id FROM students WHERE id = '<pilot-student-id>';

-- Nouveau ssyl créé pour l'année N+1
SELECT id, classroom_id, school_year_id, is_redoublant FROM student_school_year_loggings
WHERE student_id = '<pilot-student-id>' ORDER BY created_at DESC LIMIT 3;

-- Nouveau payment_allocations créé et ventilé sur les échéances du nouveau ssyl
SELECT pa.allocated_amount, cfi.label, cfi.due_date
FROM payment_allocations pa
JOIN classroom_fee_installments cfi ON cfi.id = pa.fee_installment_id
JOIN ledger_transactions lt ON lt.id = pa.payment_tx_id
WHERE lt.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY pa.allocated_at DESC LIMIT 5;
```

- [ ] **Step 5 : Corriger si nécessaire**

Si le test révèle un bug (student_type perdu, ventilation absente, etc.) — identifier le composant/hook fautif et faire un patch localisé. Fichiers susceptibles : `/enrollment/re[...]/*.tsx`, hooks passage dans `packages/shared/src/hooks/usePassage*.ts`, RPCs dans migration existante (00030-00032).

- [ ] **Step 6 : Commit + note**

```bash
git add [fichiers patchés si applicable]
git commit -m "fix(school): réinscription — <description patch> (S3D.2 Bloc 3)"
```

Si aucun patch nécessaire, documenter dans un fichier `docs/superpowers/notes/2026-07-29-s3d-2-reinscription-retest.md` :

```markdown
# Retest réinscription — 2026-07-29

Testé sur pilote <student-id>, école <school-id>.

- ✅ student_type_id conservé au passage
- ✅ Frais nouveau ssyl bien récupérés
- ✅ Paiement ventilé automatiquement sur nouvelles échéances

Aucun patch nécessaire.
```

Puis commit :

```bash
git add docs/superpowers/notes/2026-07-29-s3d-2-reinscription-retest.md
git commit -m "docs(notes): S3D.2 retest réinscription — pas de patch requis"
```

---

## Task 19 : Smoke test end-to-end + merge + tag milestone `s3d.2`

**Files :** N/A

- [ ] **Step 1 : Démarrer dev server**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
pnpm --filter @edukea/school dev
```

- [ ] **Step 2 : Parcours complet manuel (bout-en-bout)**

Naviguer sur `http://localhost:4002` en tant que superadmin. Sélectionner une des écoles pilotes SANS année active (b1672ee8 / d1b093b4 / 5313c3bd, voir Task 1 du plan S3D.1). Puis :

1. **/dashboard/pedagogy** → hub montre "Année scolaire : À faire"
2. **/dashboard/pedagogy/school-year** → cliquer "Nouvelle année", saisir "2026-2027" + dates + trimestres → Enregistrer
3. **/dashboard/pedagogy** → hub montre "Année scolaire ✓" et "Périodes 🔓 À faire"
4. **/dashboard/pedagogy/periods** → cliquer "Générer 3 périodes par défaut" → 3 lignes T1/T2/T3 apparaissent
5. **/dashboard/pedagogy/grading** → cocher /20 (auto-save)
6. **/dashboard/pedagogy/student-types** → vérifier les 3 types séedés, éventuellement en ajouter un "Boursier"
7. **/dashboard/pedagogy/structure** → cliquer "Charger template" → Ivorien Collège → vérifier les 4 niveaux + classes créés
8. **/dashboard/pedagogy/fees** → matrice avec cellules vides
9. **/dashboard/pedagogy/fees/<levelId>** → sélectionner "Non-affecté" → ajouter 3 lignes (Inscription 25000 / Scolarité 150000 / Assurance 5000) → ajouter 3 échéances (0j, 30j, 90j)
10. Bouton "Copier depuis Non-affecté" → sélectionner "Affecté" → vérifier duplication
11. **/dashboard/enrollment/new** → wizard :
    - Étape Élève : remplir + type = "Non-affecté"
    - Étape Famille : remplir un parent
    - Étape Classe : choisir 6ème-A → voir précalcul frais
    - Étape Frais : voir tableau + calendrier + preview ventilation avec paiement 30000 XAF
    - Étape Récap : valider
12. Vérifier en DB :
    ```sql
    SELECT * FROM students WHERE created_at > NOW() - INTERVAL '10 minutes';
    SELECT pa.allocated_amount, cfi.label FROM payment_allocations pa
    JOIN classroom_fee_installments cfi ON cfi.id = pa.fee_installment_id
    WHERE pa.allocated_at > NOW() - INTERVAL '10 minutes';
    ```

- [ ] **Step 3 : Tests unitaires**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
pnpm --filter @edukea/shared test 2>&1 | tail -10
```

Expected : tous les tests passent (au moins ceux existants de S3D.1).

- [ ] **Step 4 : TS check global**

```bash
pnpm tsc --noEmit --project apps/school/tsconfig.json 2>&1 | tail -5
pnpm tsc --noEmit --project packages/shared/tsconfig.json 2>&1 | tail -5
```

Expected : no errors.

- [ ] **Step 5 : Merger sur main + tag**

```bash
git checkout main
git merge feat/s3d-2-mvp-vertical --no-ff -m "merge: S3D.2 MVP onboarding vertical (config année + frais + inscription)"
git tag -a s3d.2 -m "milestone: S3D.2 shipped - onboarding vertical fonctionnel"
```

- [ ] **Step 6 : (Optionnel) Push distant**

```bash
git push origin main --tags
```

**NE PAS pousser sans confirmation utilisateur.**

---

## Résumé livrables S3D.2

Au terme du sprint :

- **2 migrations SQL** (00046 vue overview matrice, 00047 RPCs generate_default_periodes + copy_fees_between_student_types)
- **Types TS régénérés**
- **~18 hooks partagés nouveaux** (6 lecture Bloc 1 + 6 mutations Bloc 1 + 6 lecture/mutation Bloc 2)
- **5 pages Bloc 1** fonctionnelles avec composants (SchoolYear form, Periodes editor, Grading chooser, StudentTypes list, Structure master-detail)
- **2 pages Bloc 2** (Fees overview matrice + FeeLevelEditor par niveau × type)
- **3 patches wizard S3B** (StepStudent dropdown type, StepClassroom précalcul frais + warning, StepFeesPayment refonte)
- **Retest réinscription** documenté ou corrigé
- **Milestone git tag** `s3d.2`

**Résultat opérationnel** : une école (pilote post-import ou nouvellement onboardée) peut être **configurée entièrement depuis l'UI** sans intervention SQL, et un élève peut être **inscrit end-to-end** avec paiement automatiquement ventilé sur les échéances définies pour son (classe × type d'élève).

**Prochaine phase (post-S3D.2)** : trois options selon priorité produit :
- **S3D.3** — Setup enseignants + affectations (invitations email + matrice classe × matière × prof)
- **S3D.5** — Personnalisation bulletin (logo, signatures, template PDF)
- **Wizard héritage année N+1** (V1.5) — rotation N → N+1 avec clone config

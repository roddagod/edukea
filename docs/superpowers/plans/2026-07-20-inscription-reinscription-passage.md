# Module Inscription / Réinscription / Passage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer le module complet Inscription (nouvel élève), Réinscription (élève existant → année N+1), Passage batch (fin d'année N → rentrée N+1) pour le rôle `manager`, consommant le ledger append-only et les patterns UI du Sprint 3A.

**Architecture:** 9 nouveaux composants primitives dans `@edukea/ui` (Wizard, FormField, Select, DatePicker, Checkbox, RadioCards, SegmentedControl, Textarea, Stepper). 4 migrations Supabase (matricule sequence, enrollment RPCs, transitions audit table, stats views). 6 hooks React Query dans `@edukea/shared`. 5 nouvelles routes dans `apps/school`.

**Tech Stack:** Next.js 15 App Router · React 19 · TypeScript 5.7 · Tailwind 3.4 · Supabase Postgres (ledger append-only, RLS via `is_admin()` / `get_school_staff_school_id()`) · @tanstack/react-query 5.62 · Vitest.

**Référence spec:** `docs/superpowers/specs/2026-07-20-inscription-reinscription-passage-design.md`

---

## Cartographie des fichiers

```
packages/ui/src/
├── primitives/
│   ├── checkbox.tsx           ← nouveau
│   ├── select.tsx             ← nouveau (native styled)
│   ├── textarea.tsx           ← nouveau
│   └── date-picker.tsx        ← nouveau (native input[type=date] styled)
├── patterns/
│   ├── form-field.tsx         ← nouveau (label + control + hint/error)
│   ├── radio-cards.tsx        ← nouveau (choix visuels)
│   ├── segmented-control.tsx  ← nouveau (2-3 boutons pill)
│   └── wizard.tsx             ← nouveau (Stepper + orchestrateur)

supabase/migrations/
├── 00028_matricule_sequence.sql        ← schools.matricule_prefix + next_matricule()
├── 00029_enrollment_rpcs.sql           ← enroll_new_student, reenroll_student, bulk_advance_year
├── 00030_enrollment_transitions.sql    ← table + RLS
└── 00031_v_enrollment_stats.sql        ← v_enrollment_stats + v_year_advancement_preview

packages/shared/src/hooks/
├── useStudentSearch.ts        ← anti-doublon Étape 1
├── useFamilySearch.ts         ← anti-doublon Étape 2
├── useClassroomFees.ts        ← barème d'une classe × année × type_student
├── useEnrollmentStats.ts      ← KPIs hub inscription
├── useYearAdvancementPreview.ts ← pré-calcul du passage batch
└── useEnrollmentMutations.ts  ← useEnrollNewStudent + useReenrollStudent + useBulkAdvanceYear

apps/school/src/app/(dashboard)/dashboard/enrollment/
├── page.tsx + loading.tsx                  ← Hub
├── new/
│   ├── page.tsx                            ← Wizard 5 étapes container
│   └── _steps/
│       ├── StepStudent.tsx
│       ├── StepFamily.tsx
│       ├── StepClassroom.tsx
│       ├── StepFeesPayment.tsx
│       └── StepSummary.tsx
├── re/[studentId]/page.tsx                 ← Wizard 3 étapes réinscription
├── passage/page.tsx                        ← Table batch
└── [ssylId]/page.tsx                       ← Fiche d'inscription

apps/school/src/app/(dashboard)/layout.tsx  ← Modif : link /enrollment fonctionnel
```

Modifications légères :

- `packages/ui/src/index.ts` : re-exports des 9 nouveaux composants (une seule fois en fin de plan)
- `packages/shared/src/index.ts` : re-exports des 6 nouveaux hooks
- `apps/school/src/app/(dashboard)/layout.tsx` : les nav items `/dashboard/enrollment` et `/dashboard/reenrollment` doivent maintenant pointer sur des routes existantes

---

## Phase 1 — Design system extensions

### Task 1 : Primitives de formulaire basiques (Checkbox + Select + Textarea + DatePicker)

**Files:**
- Create: `packages/ui/src/primitives/checkbox.tsx`
- Create: `packages/ui/src/primitives/select.tsx`
- Create: `packages/ui/src/primitives/textarea.tsx`
- Create: `packages/ui/src/primitives/date-picker.tsx`

Pas de tests unitaires (composants purement visuels). Validation : `pnpm --filter @edukea/ui lint` + import dans une page de test.

- [ ] **Step 1 : Créer `packages/ui/src/primitives/checkbox.tsx`**

```tsx
import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../lib/cn';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
  hint?: string;
}

/**
 * Checkbox avec label. Utilise input natif + custom paint via CSS pour
 * garantir l'accessibilité et le comportement clavier.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hint, className, id: idProp, ...rest }, ref) => {
    const reactId = React.useId();
    const id = idProp ?? `cb-${reactId.replace(/:/g, '')}`;
    return (
      <div className="flex items-start gap-2.5">
        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className={cn(
              'peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-line bg-white transition-colors',
              'checked:border-primary checked:bg-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              className,
            )}
            {...rest}
          />
          <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" />
        </div>
        {(label || hint) && (
          <label htmlFor={id} className="flex-1 cursor-pointer select-none">
            {label && <div className="text-body-sm font-medium text-ink">{label}</div>}
            {hint && <div className="mt-0.5 text-caption text-ink-3">{hint}</div>}
          </label>
        )}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';
```

- [ ] **Step 2 : Créer `packages/ui/src/primitives/select.tsx`**

```tsx
import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

/**
 * Select natif stylé Edukea. Fond blanc + border + chevron custom.
 * En cas d'erreur, la border passe en destructive.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, error, className, ...rest }, ref) => (
    <div className="relative flex w-full items-center">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none rounded-md border bg-white px-3 py-2 pr-9 text-body-sm text-ink transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          error ? 'border-destructive' : 'border-line hover:border-ink-4 focus:border-primary',
          className,
        )}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-ink-3" />
    </div>
  ),
);
Select.displayName = 'Select';
```

- [ ] **Step 3 : Créer `packages/ui/src/primitives/textarea.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'block w-full rounded-md border bg-white px-3 py-2 text-body-sm text-ink transition-colors placeholder:text-ink-4',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
        error ? 'border-destructive' : 'border-line hover:border-ink-4 focus:border-primary',
        className,
      )}
      {...rest}
    />
  ),
);
Textarea.displayName = 'Textarea';
```

- [ ] **Step 4 : Créer `packages/ui/src/primitives/date-picker.tsx`**

```tsx
import * as React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../lib/cn';

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  error?: string;
}

/**
 * Date picker natif (input type=date) stylé. Le navigateur affiche le picker
 * OS/UA. Format ISO YYYY-MM-DD attendu en value.
 */
export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ error, className, ...rest }, ref) => (
    <div className="relative flex w-full items-center">
      <input
        ref={ref}
        type="date"
        className={cn(
          'w-full rounded-md border bg-white px-3 py-2 pr-9 text-body-sm text-ink transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          error ? 'border-destructive' : 'border-line hover:border-ink-4 focus:border-primary',
          className,
        )}
        {...rest}
      />
      <Calendar className="pointer-events-none absolute right-3 h-4 w-4 text-ink-3" />
    </div>
  ),
);
DatePicker.displayName = 'DatePicker';
```

- [ ] **Step 5 : Type-check + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm --filter @edukea/ui lint
# Expected: PASS

git add packages/ui/src/primitives/checkbox.tsx packages/ui/src/primitives/select.tsx packages/ui/src/primitives/textarea.tsx packages/ui/src/primitives/date-picker.tsx
git commit -m "feat(ui): add Checkbox, Select, Textarea, DatePicker primitives"
```

---

### Task 2 : FormField pattern (wrapper unifié label + control + hint/error)

**Files:**
- Create: `packages/ui/src/patterns/form-field.tsx`

- [ ] **Step 1 : Créer `form-field.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export interface FormFieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Wrapper standard pour un champ de formulaire : label (avec * si required)
 * + control child + hint/error. Unifie la mise en page à travers le wizard.
 */
export function FormField({ label, hint, error, required, htmlFor, className, children }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-body-xs font-semibold text-ink-2">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-caption text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-caption text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2 : Type-check + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm --filter @edukea/ui lint
# Expected: PASS

git add packages/ui/src/patterns/form-field.tsx
git commit -m "feat(ui): add FormField pattern wrapping label/control/hint/error"
```

---

### Task 3 : RadioCards + SegmentedControl (choix visuels)

**Files:**
- Create: `packages/ui/src/patterns/radio-cards.tsx`
- Create: `packages/ui/src/patterns/segmented-control.tsx`

- [ ] **Step 1 : Créer `radio-cards.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export interface RadioCardOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface RadioCardsProps<T extends string = string> {
  name: string;
  options: RadioCardOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * Grille de cards radio (choix exclusif). Chaque card affiche icon + label + description.
 * L'option sélectionnée a une bordure primary + fond primary/5%.
 */
export function RadioCards<T extends string = string>({
  name,
  options,
  value,
  onChange,
  columns = 3,
  className,
}: RadioCardsProps<T>) {
  const colClass = columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4';
  return (
    <div className={cn('grid gap-2', colClass, className)} role="radiogroup" aria-label={name}>
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-all',
              selected
                ? 'border-primary bg-primary/5 shadow-flat'
                : 'border-line bg-white hover:border-ink-4',
            )}
          >
            {o.icon && <div className={cn('mb-1', selected ? 'text-primary' : 'text-ink-3')}>{o.icon}</div>}
            <div className={cn('text-body-sm font-semibold', selected ? 'text-primary' : 'text-ink')}>{o.label}</div>
            {o.description && <div className="text-caption text-ink-3">{o.description}</div>}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2 : Créer `segmented-control.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Contrôle segmenté (2-4 options) : ligne de boutons pill fusionnés.
 * Plus compact que RadioCards, utilisé pour les modes de paiement.
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  const padClass = size === 'sm' ? 'px-2.5 py-1 text-caption' : 'px-3 py-1.5 text-body-sm';
  return (
    <div
      role="radiogroup"
      className={cn('inline-flex rounded-md border border-line bg-line-soft p-0.5', className)}
    >
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-md font-semibold transition-colors',
              padClass,
              selected ? 'bg-white text-ink shadow-flat' : 'text-ink-3 hover:text-ink',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3 : Type-check + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm --filter @edukea/ui lint
# Expected: PASS

git add packages/ui/src/patterns/radio-cards.tsx packages/ui/src/patterns/segmented-control.tsx
git commit -m "feat(ui): add RadioCards and SegmentedControl patterns"
```

---

### Task 4 : Wizard + Stepper (orchestrateur multi-étapes) — TDD

**Files:**
- Create: `packages/ui/src/patterns/wizard.tsx`
- Create: `packages/ui/src/patterns/wizard.test.tsx`

TDD sur la state machine du wizard (uniquement la logique de navigation, pas le rendu).

- [ ] **Step 1 : Écrire test failing `wizard.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { canGoNext, canGoBack, isLastStep, isFirstStep } from './wizard';

describe('Wizard state helpers', () => {
  it('isFirstStep true when currentIndex=0', () => {
    expect(isFirstStep(0)).toBe(true);
    expect(isFirstStep(1)).toBe(false);
  });

  it('isLastStep depends on total', () => {
    expect(isLastStep(4, 5)).toBe(true);
    expect(isLastStep(3, 5)).toBe(false);
  });

  it('canGoBack false at start', () => {
    expect(canGoBack(0)).toBe(false);
    expect(canGoBack(1)).toBe(true);
  });

  it('canGoNext gated by isValid predicate', () => {
    expect(canGoNext(0, 5, true)).toBe(true);
    expect(canGoNext(0, 5, false)).toBe(false);
    // Last step : canGoNext false (Next devient Submit)
    expect(canGoNext(4, 5, true)).toBe(false);
  });
});
```

- [ ] **Step 2 : Lancer test, confirmer échec**

Run: `cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm --filter @edukea/ui test`
Expected: FAIL — module ./wizard not found.

- [ ] **Step 3 : Écrire `wizard.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';
import { Button } from '../primitives/button';

// ==================== State helpers (testable) ====================

export function isFirstStep(currentIndex: number): boolean {
  return currentIndex <= 0;
}

export function isLastStep(currentIndex: number, total: number): boolean {
  return currentIndex >= total - 1;
}

export function canGoBack(currentIndex: number): boolean {
  return currentIndex > 0;
}

/** Peut passer à l'étape suivante si pas la dernière ET le step courant est valide. */
export function canGoNext(currentIndex: number, total: number, isValid: boolean): boolean {
  return !isLastStep(currentIndex, total) && isValid;
}

// ==================== Stepper (header) ====================

export interface WizardStepMeta {
  id: string;
  label: string;
  shortLabel?: string;
}

export function Stepper({
  steps,
  current,
  className,
}: {
  steps: WizardStepMeta[];
  current: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto', className)}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-body-xs font-semibold transition-colors',
                done
                  ? 'bg-primary text-white'
                  : active
                    ? 'border-2 border-primary bg-white text-primary'
                    : 'border border-line bg-white text-ink-3',
              )}
            >
              {i + 1}
            </div>
            <div className="hidden sm:block">
              <div
                className={cn(
                  'text-caption font-semibold',
                  active ? 'text-ink' : done ? 'text-ink-2' : 'text-ink-3',
                )}
              >
                {s.shortLabel ?? s.label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('h-px w-6 sm:w-10', done ? 'bg-primary' : 'bg-line')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==================== Wizard container ====================

export interface WizardProps {
  steps: WizardStepMeta[];
  currentIndex: number;
  isCurrentStepValid: boolean;
  isSubmitting?: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Container wizard : Stepper en top + contenu de l'étape + footer avec
 * boutons Précédent / Suivant (ou Soumettre si dernière étape).
 */
export function Wizard({
  steps,
  currentIndex,
  isCurrentStepValid,
  isSubmitting,
  onBack,
  onNext,
  onSubmit,
  submitLabel = 'Confirmer',
  children,
  className,
}: WizardProps) {
  const last = isLastStep(currentIndex, steps.length);
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Stepper steps={steps} current={currentIndex} />
      <div className="min-h-[280px]">{children}</div>
      <div className="flex items-center justify-between border-t border-line pt-4">
        <Button variant="ghost" onClick={onBack} disabled={!canGoBack(currentIndex) || isSubmitting}>
          Précédent
        </Button>
        {last ? (
          <Button variant="primary" size="lg" onClick={onSubmit} disabled={!isCurrentStepValid || isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : submitLabel}
          </Button>
        ) : (
          <Button variant="primary" onClick={onNext} disabled={!isCurrentStepValid}>
            Suivant
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4 : Lancer test + type-check**

Run: `cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm --filter @edukea/ui test && pnpm --filter @edukea/ui lint`
Expected: 4 nouveaux tests PASS + type-check clean.

- [ ] **Step 5 : Commit**

```bash
git add packages/ui/src/patterns/wizard.tsx packages/ui/src/patterns/wizard.test.tsx
git commit -m "feat(ui): add Wizard + Stepper with state helpers (TDD)"
```

---

### Task 5 : Barrel exports (une seule fois)

**Files:**
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1 : Ajouter les 9 exports**

Contenu à insérer dans `packages/ui/src/index.ts` — ajouter ces lignes dans les sections appropriées :

```ts
// Primitives (section existante)
export * from './primitives/checkbox';
export * from './primitives/select';
export * from './primitives/textarea';
export * from './primitives/date-picker';

// Patterns (section existante)
export * from './patterns/form-field';
export * from './patterns/radio-cards';
export * from './patterns/segmented-control';
export * from './patterns/wizard';
```

- [ ] **Step 2 : Type-check + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm --filter @edukea/ui lint && pnpm --filter @edukea/ui test
# Expected: PASS

git add packages/ui/src/index.ts
git commit -m "feat(ui): export new form primitives + patterns from barrel"
```

---

## Phase 2 — Migrations DB

### Task 6 : Migration 00028 — matricule sequence

**Files:**
- Create: `supabase/migrations/00028_matricule_sequence.sql`

- [ ] **Step 1 : Écrire la migration**

```sql
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
```

- [ ] **Step 2 : Appliquer**

```bash
PGPASSWORD='siqnak-Setnon-6waqfu' psql "postgresql://postgres.ejwqvahlnmysxeerqrrv@aws-1-eu-north-1.pooler.supabase.com:5432/postgres" -v ON_ERROR_STOP=1 -f /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea/supabase/migrations/00028_matricule_sequence.sql
```

Expected : `ALTER TABLE`, plusieurs `UPDATE`, `CREATE FUNCTION`, `GRANT`.

- [ ] **Step 3 : Smoke test**

```bash
PGPASSWORD='siqnak-Setnon-6waqfu' psql "postgresql://postgres.ejwqvahlnmysxeerqrrv@aws-1-eu-north-1.pooler.supabase.com:5432/postgres" -v ON_ERROR_STOP=1 -c "SELECT next_matricule('06582bf9-d164-478f-afb1-bbb2d245feab', '567a51dd-33d8-4ead-a2b3-f33025dce942');"
```

Expected : un matricule de forme `AKD-2025-NNNN` (le NNNN dépend du contenu actuel).

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/00028_matricule_sequence.sql
git commit -m "feat(db): 00028 matricule_prefix + next_matricule() function"
```

---

### Task 7 : Migration 00030 — enrollment_transitions (audit trail)

**Files:**
- Create: `supabase/migrations/00030_enrollment_transitions.sql`

Note : on fait 00030 avant 00029 parce que 00029 (bulk_advance_year) INSERT dans enrollment_transitions.

- [ ] **Step 1 : Écrire la migration**

```sql
-- ============================================================
-- Audit trail pour les décisions de passage d'année scolaire.
-- Une ligne par (élève, année source, année cible) — trace la décision
-- (passage / redoublement / départ / attente) et l'auteur.
-- ============================================================

CREATE TABLE IF NOT EXISTS enrollment_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL REFERENCES students(id),
  from_ssyl_id TEXT REFERENCES student_school_year_loggings(id),
  to_ssyl_id TEXT REFERENCES student_school_year_loggings(id),
  decision TEXT NOT NULL CHECK (decision IN ('advance', 'repeat', 'leave', 'pending')),
  from_classroom_id TEXT REFERENCES classrooms(id),
  to_classroom_id TEXT REFERENCES classrooms(id),
  from_year_id TEXT REFERENCES school_years(id),
  to_year_id TEXT REFERENCES school_years(id),
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_enrollment_transitions_student ON enrollment_transitions(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_transitions_years ON enrollment_transitions(from_year_id, to_year_id);

ALTER TABLE enrollment_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all enrollment_transitions"
  ON enrollment_transitions FOR SELECT USING (is_admin());

CREATE POLICY "School staff view own school enrollment_transitions"
  ON enrollment_transitions FOR SELECT USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = enrollment_transitions.student_id AND s.school_id = get_school_staff_school_id())
  );

-- Écriture réservée aux RPC SECURITY DEFINER
REVOKE INSERT, UPDATE, DELETE ON enrollment_transitions FROM authenticated, anon;
```

- [ ] **Step 2 : Appliquer**

```bash
PGPASSWORD='siqnak-Setnon-6waqfu' psql "postgresql://postgres.ejwqvahlnmysxeerqrrv@aws-1-eu-north-1.pooler.supabase.com:5432/postgres" -v ON_ERROR_STOP=1 -f /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea/supabase/migrations/00030_enrollment_transitions.sql
```

Expected : `CREATE TABLE`, 2× `CREATE INDEX`, `ALTER TABLE`, 2× `CREATE POLICY`, `REVOKE`.

- [ ] **Step 3 : Vérifier**

```bash
PGPASSWORD='siqnak-Setnon-6waqfu' psql "postgresql://postgres.ejwqvahlnmysxeerqrrv@aws-1-eu-north-1.pooler.supabase.com:5432/postgres" -v ON_ERROR_STOP=1 -c "\d enrollment_transitions" 2>&1 | head -20
```

Expected : table présente avec les 11 colonnes définies.

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/00030_enrollment_transitions.sql
git commit -m "feat(db): 00030 enrollment_transitions audit table + RLS"
```

---

### Task 8 : Migration 00029 — RPC enroll_new_student

**Files:**
- Create: `supabase/migrations/00029_enrollment_rpcs.sql`

Cette RPC est complexe. Un seul commit final regroupe les 3 RPC (enroll_new, reenroll, bulk_advance) pour éviter les migrations à demi-appliquées.

- [ ] **Step 1 : Écrire le squelette de fichier avec les 3 RPC**

```sql
-- ============================================================
-- RPCs pour le module Inscription / Réinscription / Passage
--   - enroll_new_student(payload) : crée un nouvel élève complet
--   - reenroll_student(payload) : réinscrit un élève existant
--   - bulk_advance_year(payload) : batch passage année N -> N+1
--
-- Toutes SECURITY DEFINER, atomiques (une seule transaction), retournent JSONB.
-- Vérifient l'accès via is_admin() OR get_school_staff_school_id() = school_id.
-- ============================================================

-- ==================== enroll_new_student ====================

CREATE OR REPLACE FUNCTION enroll_new_student(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_school_id TEXT     := payload->>'school_id';
  v_year_id   TEXT     := payload->>'school_year_id';
  v_classroom_id TEXT  := payload->>'classroom_id';
  v_fees_id   TEXT     := payload->>'school_fees_id';
  v_type_student_id TEXT := payload->>'type_student_id';

  v_student  JSONB := payload->'student';
  v_father   JSONB := payload->'father';
  v_mother   JSONB := payload->'mother';
  v_tutor    JSONB := payload->'tutor';

  v_billed_total BIGINT := COALESCE((payload->>'billed_total')::BIGINT, 0);
  v_discount     JSONB  := payload->'discount';        -- { amount, reason, note } OU null
  v_first_pay    JSONB  := payload->'first_payment';   -- { amount, source, memo } OU null

  v_father_id TEXT;
  v_mother_id TEXT;
  v_tutor_id  TEXT;
  v_student_id TEXT;
  v_matricule TEXT;
  v_ssyl_id TEXT;
  v_receivable_id UUID;
  v_revenue_id UUID;
  v_discount_id UUID;
  v_opening_tx UUID;
  v_discount_tx UUID;
  v_first_pay_tx UUID;
BEGIN
  -- 1. Vérification d'accès
  IF NOT (is_admin() OR get_school_staff_school_id() = v_school_id) THEN
    RAISE EXCEPTION 'enroll_new_student : accès refusé pour school %', v_school_id;
  END IF;

  IF v_school_id IS NULL OR v_year_id IS NULL OR v_classroom_id IS NULL THEN
    RAISE EXCEPTION 'enroll_new_student : school_id + school_year_id + classroom_id requis';
  END IF;

  -- 2. Upsert families (père / mère / tuteur)
  IF v_father IS NOT NULL THEN
    v_father_id := COALESCE(v_father->>'id', gen_random_uuid()::TEXT);
    INSERT INTO families (id, school_id, firstname, lastname, phone, email, job, address, residence)
    VALUES (v_father_id, v_school_id, v_father->>'firstname', v_father->>'lastname', v_father->>'phone', v_father->>'email', v_father->>'job', v_father->>'address', v_father->>'residence')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  IF v_mother IS NOT NULL THEN
    v_mother_id := COALESCE(v_mother->>'id', gen_random_uuid()::TEXT);
    INSERT INTO families (id, school_id, firstname, lastname, phone, email, job, address, residence)
    VALUES (v_mother_id, v_school_id, v_mother->>'firstname', v_mother->>'lastname', v_mother->>'phone', v_mother->>'email', v_mother->>'job', v_mother->>'address', v_mother->>'residence')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  IF v_tutor IS NOT NULL THEN
    v_tutor_id := COALESCE(v_tutor->>'id', gen_random_uuid()::TEXT);
    INSERT INTO families (id, school_id, firstname, lastname, phone, email, job, address, residence)
    VALUES (v_tutor_id, v_school_id, v_tutor->>'firstname', v_tutor->>'lastname', v_tutor->>'phone', v_tutor->>'email', v_tutor->>'job', v_tutor->>'address', v_tutor->>'residence')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 3. Générer matricule + INSERT student
  v_matricule := next_matricule(v_school_id, v_year_id);
  v_student_id := gen_random_uuid()::TEXT;
  INSERT INTO students (id, school_id, matricule, firstname, lastname, sex, birthdate, birthplace, nationality, father_id, mother_id, tutor_id)
  VALUES (
    v_student_id, v_school_id, v_matricule,
    v_student->>'firstname', v_student->>'lastname', v_student->>'sex',
    NULLIF(v_student->>'birthdate','')::DATE, v_student->>'birthplace', COALESCE(v_student->>'nationality','Ivoirienne'),
    v_father_id, v_mother_id, v_tutor_id
  );

  -- 4. INSERT SSYL
  v_ssyl_id := gen_random_uuid()::TEXT;
  INSERT INTO student_school_year_loggings (
    id, student_id, school_id, school_year_id, classroom_id, school_fees_id, type_student_id,
    school_fees_total, is_first_register, repeating, registration_date
  ) VALUES (
    v_ssyl_id, v_student_id, v_school_id, v_year_id, v_classroom_id, v_fees_id, v_type_student_id,
    v_billed_total, 1,
    CASE WHEN (v_student->>'redoublant')::BOOLEAN THEN 1 ELSE 0 END,
    CURRENT_DATE
  );

  -- 5. Ledger : opening balance (dette scolarité)
  --    Créer compte student_receivable
  INSERT INTO ledger_accounts (kind, school_id, student_ssyl_id, school_year_id, name)
  VALUES ('student_receivable', v_school_id, v_ssyl_id, v_year_id, 'Créance ' || v_matricule)
  RETURNING id INTO v_receivable_id;

  --    Récupérer/créer compte revenue_school_fees pour l'année
  SELECT id INTO v_revenue_id FROM ledger_accounts
    WHERE kind = 'revenue_school_fees' AND school_id = v_school_id AND school_year_id = v_year_id LIMIT 1;
  IF v_revenue_id IS NULL THEN
    INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
    VALUES ('revenue_school_fees', v_school_id, v_year_id, 'Produits scolarité')
    RETURNING id INTO v_revenue_id;
  END IF;

  --    Poster la tx opening
  IF v_billed_total > 0 THEN
    v_opening_tx := ledger_post_transaction(
      v_school_id, v_year_id, 'opening_balance', 'opening', v_ssyl_id, NULL,
      'Facturation inscription ' || v_matricule, now(),
      jsonb_build_array(
        jsonb_build_object('account_id', v_receivable_id, 'direction', 'debit',  'amount', v_billed_total),
        jsonb_build_object('account_id', v_revenue_id,    'direction', 'credit', 'amount', v_billed_total)
      )
    );
  END IF;

  -- 6. Remise optionnelle (Debit discount, Credit receivable — annule une partie de la dette)
  IF v_discount IS NOT NULL AND (v_discount->>'amount')::BIGINT > 0 THEN
    SELECT id INTO v_discount_id FROM ledger_accounts
      WHERE kind = 'discount' AND school_id = v_school_id AND school_year_id = v_year_id LIMIT 1;
    IF v_discount_id IS NULL THEN
      INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
      VALUES ('discount', v_school_id, v_year_id, 'Remises accordées')
      RETURNING id INTO v_discount_id;
    END IF;
    v_discount_tx := ledger_post_transaction(
      v_school_id, v_year_id, 'internal', 'discount', v_ssyl_id, NULL,
      'Remise ' || COALESCE(v_discount->>'reason','') || COALESCE(' — ' || (v_discount->>'note'), ''),
      now(),
      jsonb_build_array(
        jsonb_build_object('account_id', v_discount_id,   'direction', 'debit',  'amount', (v_discount->>'amount')::BIGINT),
        jsonb_build_object('account_id', v_receivable_id, 'direction', 'credit', 'amount', (v_discount->>'amount')::BIGINT)
      )
    );
  END IF;

  -- 7. Premier versement optionnel (via record_student_payment pour cohérence)
  IF v_first_pay IS NOT NULL AND (v_first_pay->>'amount')::BIGINT > 0 THEN
    v_first_pay_tx := record_student_payment(
      v_ssyl_id,
      (v_first_pay->>'amount')::BIGINT,
      COALESCE(v_first_pay->>'source', 'cash')::ledger_source,
      v_first_pay->>'memo',
      now()
    );
  END IF;

  RETURN jsonb_build_object(
    'student_id',      v_student_id,
    'ssyl_id',         v_ssyl_id,
    'matricule',       v_matricule,
    'opening_tx_id',   v_opening_tx,
    'discount_tx_id',  v_discount_tx,
    'first_payment_tx_id', v_first_pay_tx
  );
END $$;

GRANT EXECUTE ON FUNCTION enroll_new_student(JSONB) TO authenticated;

-- ==================== reenroll_student ====================

CREATE OR REPLACE FUNCTION reenroll_student(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_existing_student_id TEXT := payload->>'existing_student_id';
  v_school_id TEXT     := payload->>'school_id';
  v_year_id   TEXT     := payload->>'school_year_id';
  v_classroom_id TEXT  := payload->>'classroom_id';
  v_fees_id   TEXT     := payload->>'school_fees_id';
  v_billed_total BIGINT := COALESCE((payload->>'billed_total')::BIGINT, 0);
  v_discount JSONB := payload->'discount';
  v_first_pay JSONB := payload->'first_payment';
  v_prev_ssyl_id TEXT := payload->>'previous_ssyl_id';   -- Optional : trace la transition

  v_new_ssyl_id TEXT;
  v_receivable_id UUID;
  v_revenue_id UUID;
  v_discount_id UUID;
  v_opening_tx UUID;
  v_discount_tx UUID;
  v_first_pay_tx UUID;
BEGIN
  IF NOT (is_admin() OR get_school_staff_school_id() = v_school_id) THEN
    RAISE EXCEPTION 'reenroll_student : accès refusé';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM students WHERE id = v_existing_student_id AND school_id = v_school_id) THEN
    RAISE EXCEPTION 'reenroll_student : élève % introuvable dans école %', v_existing_student_id, v_school_id;
  END IF;

  v_new_ssyl_id := gen_random_uuid()::TEXT;
  INSERT INTO student_school_year_loggings (
    id, student_id, school_id, school_year_id, classroom_id, school_fees_id,
    school_fees_total, is_first_register, repeating, registration_date
  ) VALUES (
    v_new_ssyl_id, v_existing_student_id, v_school_id, v_year_id, v_classroom_id, v_fees_id,
    v_billed_total, 0, 0, CURRENT_DATE
  );

  -- Ledger opening balance (identique à enroll_new_student)
  INSERT INTO ledger_accounts (kind, school_id, student_ssyl_id, school_year_id, name)
  VALUES ('student_receivable', v_school_id, v_new_ssyl_id, v_year_id, 'Créance réinscription ' || v_existing_student_id)
  RETURNING id INTO v_receivable_id;

  SELECT id INTO v_revenue_id FROM ledger_accounts
    WHERE kind = 'revenue_school_fees' AND school_id = v_school_id AND school_year_id = v_year_id LIMIT 1;
  IF v_revenue_id IS NULL THEN
    INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
    VALUES ('revenue_school_fees', v_school_id, v_year_id, 'Produits scolarité')
    RETURNING id INTO v_revenue_id;
  END IF;

  IF v_billed_total > 0 THEN
    v_opening_tx := ledger_post_transaction(
      v_school_id, v_year_id, 'opening_balance', 'opening', v_new_ssyl_id, NULL,
      'Facturation réinscription', now(),
      jsonb_build_array(
        jsonb_build_object('account_id', v_receivable_id, 'direction', 'debit',  'amount', v_billed_total),
        jsonb_build_object('account_id', v_revenue_id,    'direction', 'credit', 'amount', v_billed_total)
      )
    );
  END IF;

  -- Remise + premier versement (mêmes patterns qu'enroll_new_student)
  IF v_discount IS NOT NULL AND (v_discount->>'amount')::BIGINT > 0 THEN
    SELECT id INTO v_discount_id FROM ledger_accounts
      WHERE kind = 'discount' AND school_id = v_school_id AND school_year_id = v_year_id LIMIT 1;
    IF v_discount_id IS NULL THEN
      INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
      VALUES ('discount', v_school_id, v_year_id, 'Remises accordées')
      RETURNING id INTO v_discount_id;
    END IF;
    v_discount_tx := ledger_post_transaction(
      v_school_id, v_year_id, 'internal', 'discount', v_new_ssyl_id, NULL,
      'Remise réinscription', now(),
      jsonb_build_array(
        jsonb_build_object('account_id', v_discount_id,   'direction', 'debit',  'amount', (v_discount->>'amount')::BIGINT),
        jsonb_build_object('account_id', v_receivable_id, 'direction', 'credit', 'amount', (v_discount->>'amount')::BIGINT)
      )
    );
  END IF;

  IF v_first_pay IS NOT NULL AND (v_first_pay->>'amount')::BIGINT > 0 THEN
    v_first_pay_tx := record_student_payment(
      v_new_ssyl_id, (v_first_pay->>'amount')::BIGINT,
      COALESCE(v_first_pay->>'source','cash')::ledger_source,
      v_first_pay->>'memo', now()
    );
  END IF;

  -- Trace la transition (audit) si previous_ssyl_id fourni
  IF v_prev_ssyl_id IS NOT NULL THEN
    INSERT INTO enrollment_transitions (student_id, from_ssyl_id, to_ssyl_id, decision, decided_by, from_year_id, to_year_id)
    SELECT v_existing_student_id, v_prev_ssyl_id, v_new_ssyl_id, 'advance', auth.uid(), pss.school_year_id, v_year_id
    FROM student_school_year_loggings pss WHERE pss.id = v_prev_ssyl_id;
  END IF;

  RETURN jsonb_build_object(
    'ssyl_id', v_new_ssyl_id,
    'opening_tx_id', v_opening_tx,
    'discount_tx_id', v_discount_tx,
    'first_payment_tx_id', v_first_pay_tx
  );
END $$;

GRANT EXECUTE ON FUNCTION reenroll_student(JSONB) TO authenticated;

-- ==================== bulk_advance_year ====================

CREATE OR REPLACE FUNCTION bulk_advance_year(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_school_id TEXT := payload->>'school_id';
  v_from_year_id TEXT := payload->>'from_year_id';
  v_to_year_id TEXT := payload->>'to_year_id';
  v_plan JSONB := payload->'plan';    -- Array of { ssyl_id, decision, target_classroom_id, target_fees_id, billed_total }

  v_row JSONB;
  v_from_ssyl RECORD;
  v_new_ssyl_id TEXT;
  v_n_advance INT := 0;
  v_n_repeat INT := 0;
  v_n_leave INT := 0;
  v_n_pending INT := 0;
BEGIN
  IF NOT (is_admin() OR get_school_staff_school_id() = v_school_id) THEN
    RAISE EXCEPTION 'bulk_advance_year : accès refusé';
  END IF;

  IF v_plan IS NULL OR jsonb_array_length(v_plan) = 0 THEN
    RAISE EXCEPTION 'bulk_advance_year : plan vide';
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(v_plan) LOOP
    -- Récupérer le SSYL source
    SELECT id, student_id, classroom_id, school_year_id INTO v_from_ssyl
    FROM student_school_year_loggings
    WHERE id = v_row->>'ssyl_id' AND school_id = v_school_id AND school_year_id = v_from_year_id;

    IF v_from_ssyl.id IS NULL THEN CONTINUE; END IF;

    IF v_row->>'decision' IN ('advance', 'repeat') THEN
      -- Créer nouveau SSYL année cible (utilise reenroll_student mais sans versement/remise en batch)
      SELECT (reenroll_student(jsonb_build_object(
        'existing_student_id', v_from_ssyl.student_id,
        'school_id',           v_school_id,
        'school_year_id',      v_to_year_id,
        'classroom_id',        v_row->>'target_classroom_id',
        'school_fees_id',      v_row->>'target_fees_id',
        'billed_total',        COALESCE((v_row->>'billed_total')::BIGINT, 0),
        'previous_ssyl_id',    v_from_ssyl.id
      ))->>'ssyl_id') INTO v_new_ssyl_id;

      INSERT INTO enrollment_transitions (student_id, from_ssyl_id, to_ssyl_id, decision, from_classroom_id, to_classroom_id, from_year_id, to_year_id, decided_by)
      VALUES (v_from_ssyl.student_id, v_from_ssyl.id, v_new_ssyl_id, v_row->>'decision', v_from_ssyl.classroom_id, v_row->>'target_classroom_id', v_from_year_id, v_to_year_id, auth.uid());

      IF v_row->>'decision' = 'advance' THEN v_n_advance := v_n_advance + 1;
      ELSE v_n_repeat := v_n_repeat + 1; END IF;

    ELSIF v_row->>'decision' = 'leave' THEN
      INSERT INTO enrollment_transitions (student_id, from_ssyl_id, decision, from_classroom_id, from_year_id, to_year_id, decided_by)
      VALUES (v_from_ssyl.student_id, v_from_ssyl.id, 'leave', v_from_ssyl.classroom_id, v_from_year_id, v_to_year_id, auth.uid());
      v_n_leave := v_n_leave + 1;

    ELSE
      -- pending : trace uniquement, pas d'action
      INSERT INTO enrollment_transitions (student_id, from_ssyl_id, decision, from_classroom_id, from_year_id, to_year_id, decided_by)
      VALUES (v_from_ssyl.student_id, v_from_ssyl.id, 'pending', v_from_ssyl.classroom_id, v_from_year_id, v_to_year_id, auth.uid());
      v_n_pending := v_n_pending + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'advance', v_n_advance,
    'repeat',  v_n_repeat,
    'leave',   v_n_leave,
    'pending', v_n_pending
  );
END $$;

GRANT EXECUTE ON FUNCTION bulk_advance_year(JSONB) TO authenticated;
```

- [ ] **Step 2 : Appliquer**

```bash
PGPASSWORD='siqnak-Setnon-6waqfu' psql "postgresql://postgres.ejwqvahlnmysxeerqrrv@aws-1-eu-north-1.pooler.supabase.com:5432/postgres" -v ON_ERROR_STOP=1 -f /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea/supabase/migrations/00029_enrollment_rpcs.sql
```

Expected : 3× `CREATE FUNCTION` + 3× `GRANT`.

- [ ] **Step 3 : Smoke test enroll_new_student**

```bash
PGPASSWORD='siqnak-Setnon-6waqfu' psql "postgresql://postgres.ejwqvahlnmysxeerqrrv@aws-1-eu-north-1.pooler.supabase.com:5432/postgres" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub":"86580676-3b52-41f2-bcdf-db8ff657f930","email":"admin@edukea.com","role":"authenticated"}';

SELECT enroll_new_student(jsonb_build_object(
  'school_id',      '06582bf9-d164-478f-afb1-bbb2d245feab',
  'school_year_id', '567a51dd-33d8-4ead-a2b3-f33025dce942',
  'classroom_id',   (SELECT id FROM classrooms WHERE school_id='06582bf9-d164-478f-afb1-bbb2d245feab' LIMIT 1),
  'billed_total',   100000,
  'student',        jsonb_build_object('firstname','TEST','lastname','SMOKE','sex','M','birthdate','2015-01-01','birthplace','Divo'),
  'father',         jsonb_build_object('firstname','Papa','lastname','TEST','phone','0102030405'),
  'first_payment',  jsonb_build_object('amount', 50000, 'source', 'cash', 'memo', 'Smoke test')
));
ROLLBACK;
SQL
```

Expected : un JSON contenant `student_id`, `ssyl_id`, `matricule` (format `AKD-2025-NNNN`), `opening_tx_id`, `first_payment_tx_id`.

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/00029_enrollment_rpcs.sql
git commit -m "feat(db): 00029 RPCs enroll_new_student / reenroll_student / bulk_advance_year"
```

---

### Task 9 : Migration 00031 — vues enrollment_stats + year_advancement_preview

**Files:**
- Create: `supabase/migrations/00031_v_enrollment_stats.sql`

- [ ] **Step 1 : Écrire la migration**

```sql
-- ============================================================
-- Vues pour le hub Inscription + l'écran Passage d'année.
-- ============================================================

-- KPI hub inscription
CREATE OR REPLACE VIEW v_enrollment_stats AS
SELECT
  ssyl.school_id,
  ssyl.school_year_id,
  COUNT(*)::INT                                        AS total_enrolled,
  COUNT(*) FILTER (WHERE ssyl.is_first_register = 1)::INT AS new_enrollments,
  COUNT(*) FILTER (WHERE ssyl.is_first_register = 0)::INT AS reenrollments,
  (
    SELECT COUNT(*)::INT
    FROM student_school_year_loggings prev
    WHERE prev.school_id = ssyl.school_id
      AND prev.school_year_id <> ssyl.school_year_id
      AND prev.deleted_at IS NULL
      AND prev.student_id NOT IN (
        SELECT student_id FROM student_school_year_loggings cur
        WHERE cur.school_id = ssyl.school_id AND cur.school_year_id = ssyl.school_year_id AND cur.deleted_at IS NULL
      )
  ) AS not_reenrolled_previous
FROM student_school_year_loggings ssyl
WHERE ssyl.deleted_at IS NULL
GROUP BY ssyl.school_id, ssyl.school_year_id;

GRANT SELECT ON v_enrollment_stats TO authenticated;

-- Pré-remplissage du passage année N -> N+1
-- Chaque ligne = élève de N, suggestion N+1 (niveau+1 par order_by, même section si possible)
CREATE OR REPLACE VIEW v_year_advancement_preview AS
SELECT
  ssyl.id                    AS from_ssyl_id,
  ssyl.school_id,
  ssyl.student_id,
  st.matricule,
  TRIM(BOTH ' ' FROM (COALESCE(st.lastname,'') || ' ' || COALESCE(st.firstname,''))) AS student_name,
  ssyl.school_year_id        AS from_year_id,
  ssyl.classroom_id          AS from_classroom_id,
  cl_from.name               AS from_classroom_name,
  cl_from.level_id           AS from_level_id,
  lv_from.name               AS from_level_name,
  lv_from.order_by           AS from_level_order,
  -- Suggestion niveau+1 : level order_by + 1 dans le même cycle
  (
    SELECT lv.id FROM levels lv
    WHERE lv.cycle_id = lv_from.cycle_id AND lv.order_by = lv_from.order_by + 1
    LIMIT 1
  )                          AS suggested_level_id,
  NULL::FLOAT                AS avg_yearly_grade   -- Réservé pour futur module Notes/Bulletins
FROM student_school_year_loggings ssyl
JOIN students   st ON st.id = ssyl.student_id
JOIN classrooms cl_from ON cl_from.id = ssyl.classroom_id
LEFT JOIN levels lv_from ON lv_from.id = cl_from.level_id
WHERE ssyl.deleted_at IS NULL;

GRANT SELECT ON v_year_advancement_preview TO authenticated;
```

- [ ] **Step 2 : Appliquer**

```bash
PGPASSWORD='siqnak-Setnon-6waqfu' psql "postgresql://postgres.ejwqvahlnmysxeerqrrv@aws-1-eu-north-1.pooler.supabase.com:5432/postgres" -v ON_ERROR_STOP=1 -f /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea/supabase/migrations/00031_v_enrollment_stats.sql
```

Expected : 2× `CREATE VIEW` + 2× `GRANT`.

- [ ] **Step 3 : Smoke test**

```bash
PGPASSWORD='siqnak-Setnon-6waqfu' psql "postgresql://postgres.ejwqvahlnmysxeerqrrv@aws-1-eu-north-1.pooler.supabase.com:5432/postgres" -v ON_ERROR_STOP=1 -c "SELECT * FROM v_enrollment_stats WHERE school_id='06582bf9-d164-478f-afb1-bbb2d245feab' ORDER BY school_year_id;"
```

Expected : quelques lignes avec `total_enrolled`, `new_enrollments`, `reenrollments`, `not_reenrolled_previous`.

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/00031_v_enrollment_stats.sql
git commit -m "feat(db): 00031 v_enrollment_stats + v_year_advancement_preview views"
```

---

## Phase 3 — Hooks shared

### Task 10 : useStudentSearch + useFamilySearch (anti-doublon)

**Files:**
- Create: `packages/shared/src/hooks/useStudentSearch.ts`
- Create: `packages/shared/src/hooks/useFamilySearch.ts`

- [ ] **Step 1 : `useStudentSearch.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StudentSearchResult {
  id: string;
  firstname: string | null;
  lastname: string | null;
  matricule: string | null;
  school_id: string;
}

/**
 * Recherche d'élèves par nom/prénom/matricule pour l'anti-doublon
 * dans l'Étape 1 du wizard inscription. Debounce à faire côté consommateur.
 */
export function useStudentSearch(schoolId: string | undefined, query: string) {
  const q = query.trim();
  return useQuery<StudentSearchResult[]>({
    queryKey: ['student-search', schoolId, q],
    enabled: !!schoolId && q.length >= 2,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const like = `%${q}%`;
      const { data, error } = await supabase
        .from('students')
        .select('id, firstname, lastname, matricule, school_id')
        .eq('school_id', schoolId!)
        .is('deleted_at', null)
        .or(`firstname.ilike.${like},lastname.ilike.${like},matricule.ilike.${like}`)
        .limit(10);
      if (error) throw error;
      return (data as StudentSearchResult[] | null) ?? [];
    },
  });
}
```

- [ ] **Step 2 : `useFamilySearch.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface FamilySearchResult {
  id: string;
  firstname: string | null;
  lastname: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  school_id: string;
}

/** Recherche parents par nom/téléphone pour Étape 2 wizard. */
export function useFamilySearch(schoolId: string | undefined, query: string) {
  const q = query.trim();
  return useQuery<FamilySearchResult[]>({
    queryKey: ['family-search', schoolId, q],
    enabled: !!schoolId && q.length >= 2,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const like = `%${q}%`;
      const { data, error } = await supabase
        .from('families')
        .select('id, firstname, lastname, phone, email, address, school_id')
        .eq('school_id', schoolId!)
        .is('deleted_at', null)
        .or(`firstname.ilike.${like},lastname.ilike.${like},phone.ilike.${like}`)
        .limit(10);
      if (error) throw error;
      return (data as FamilySearchResult[] | null) ?? [];
    },
  });
}
```

- [ ] **Step 3 : Type-check + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm --filter @edukea/shared lint
# Expected: PASS

git add packages/shared/src/hooks/useStudentSearch.ts packages/shared/src/hooks/useFamilySearch.ts
git commit -m "feat(shared): add useStudentSearch and useFamilySearch (anti-doublon)"
```

---

### Task 11 : useClassroomFees + useEnrollmentStats + useYearAdvancementPreview

**Files:**
- Create: `packages/shared/src/hooks/useClassroomFees.ts`
- Create: `packages/shared/src/hooks/useEnrollmentStats.ts`
- Create: `packages/shared/src/hooks/useYearAdvancementPreview.ts`

- [ ] **Step 1 : `useClassroomFees.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface ClassroomFees {
  id: string;
  classroom_id: string;
  school_year_id: string;
  type_student_id: string | null;
  registration_fees: number;
  additionnal_fees: number;
  school_fees: number;
  school_fees_discount: number;
  school_fees_net: number;
}

export interface FeePart {
  id: string;
  name: string | null;
  amount: number;
  due_date: string | null;
  order: number;
}

/** Barème d'une classe × année × type d'élève. */
export function useClassroomFees(
  classroomId: string | undefined,
  schoolYearId: string | undefined,
  typeStudentId?: string | null,
) {
  return useQuery<{ fees: ClassroomFees | null; parts: FeePart[] }>({
    queryKey: ['classroom-fees', classroomId, schoolYearId, typeStudentId ?? null],
    enabled: !!classroomId && !!schoolYearId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let q = supabase
        .from('classroom_school_fees')
        .select('*')
        .eq('classroom_id', classroomId!)
        .eq('school_year_id', schoolYearId!)
        .is('deleted_at', null);
      if (typeStudentId) q = q.eq('type_student_id', typeStudentId);
      const { data, error } = await q.limit(1).maybeSingle();
      if (error) throw error;
      const fees = data as ClassroomFees | null;
      if (!fees) return { fees: null, parts: [] };

      const { data: partsData } = await supabase
        .from('classroom_school_fees_by_parts')
        .select('id, name, amount, due_date, order')
        .eq('school_fees_id', fees.id)
        .is('deleted_at', null)
        .order('order');
      return {
        fees: {
          ...fees,
          registration_fees: Number(fees.registration_fees ?? 0),
          additionnal_fees: Number(fees.additionnal_fees ?? 0),
          school_fees: Number(fees.school_fees ?? 0),
          school_fees_discount: Number(fees.school_fees_discount ?? 0),
          school_fees_net: Number(fees.school_fees_net ?? 0),
        },
        parts: ((partsData as FeePart[] | null) ?? []).map((p) => ({ ...p, amount: Number(p.amount) })),
      };
    },
  });
}
```

- [ ] **Step 2 : `useEnrollmentStats.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface EnrollmentStats {
  school_id: string;
  school_year_id: string;
  total_enrolled: number;
  new_enrollments: number;
  reenrollments: number;
  not_reenrolled_previous: number;
}

/** KPIs du hub Inscription. */
export function useEnrollmentStats(schoolId: string | undefined, schoolYearId: string | undefined) {
  return useQuery<EnrollmentStats | null>({
    queryKey: ['enrollment-stats', schoolId, schoolYearId],
    enabled: !!schoolId && !!schoolYearId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_enrollment_stats')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('school_year_id', schoolYearId!)
        .maybeSingle();
      if (error) throw error;
      return (data as EnrollmentStats | null) ?? null;
    },
  });
}
```

- [ ] **Step 3 : `useYearAdvancementPreview.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface AdvancementPreviewRow {
  from_ssyl_id: string;
  school_id: string;
  student_id: string;
  matricule: string | null;
  student_name: string;
  from_year_id: string;
  from_classroom_id: string | null;
  from_classroom_name: string | null;
  from_level_id: string | null;
  from_level_name: string | null;
  from_level_order: number | null;
  suggested_level_id: string | null;
  avg_yearly_grade: number | null;
}

/** Pré-calcul du passage d'année : une ligne par élève de l'année source. */
export function useYearAdvancementPreview(schoolId: string | undefined, fromYearId: string | undefined) {
  return useQuery<AdvancementPreviewRow[]>({
    queryKey: ['year-advancement-preview', schoolId, fromYearId],
    enabled: !!schoolId && !!fromYearId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_year_advancement_preview')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('from_year_id', fromYearId!)
        .order('from_level_order', { ascending: true, nullsFirst: false })
        .order('student_name', { ascending: true });
      if (error) throw error;
      return (data as AdvancementPreviewRow[] | null) ?? [];
    },
  });
}
```

- [ ] **Step 4 : Type-check + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm --filter @edukea/shared lint
# Expected: PASS

git add packages/shared/src/hooks/useClassroomFees.ts packages/shared/src/hooks/useEnrollmentStats.ts packages/shared/src/hooks/useYearAdvancementPreview.ts
git commit -m "feat(shared): add useClassroomFees + useEnrollmentStats + useYearAdvancementPreview"
```

---

### Task 12 : useEnrollmentMutations (enroll_new_student, reenroll_student, bulk_advance_year)

**Files:**
- Create: `packages/shared/src/hooks/useEnrollmentMutations.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1 : `useEnrollmentMutations.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface EnrollNewStudentPayload {
  school_id: string;
  school_year_id: string;
  classroom_id: string;
  school_fees_id?: string;
  type_student_id?: string;
  billed_total: number;
  student: {
    firstname: string;
    lastname: string;
    sex: 'M' | 'F';
    birthdate: string;
    birthplace?: string;
    nationality?: string;
    redoublant?: boolean;
  };
  father?: { id?: string; firstname?: string; lastname?: string; phone?: string; email?: string; job?: string; address?: string; residence?: string };
  mother?: { id?: string; firstname?: string; lastname?: string; phone?: string; email?: string; job?: string; address?: string; residence?: string };
  tutor?:  { id?: string; firstname?: string; lastname?: string; phone?: string; email?: string; job?: string; address?: string; residence?: string };
  discount?: { amount: number; reason: string; note?: string };
  first_payment?: { amount: number; source: 'cash' | 'bank_transfer' | 'internal'; memo?: string };
}

export interface EnrollNewStudentResult {
  student_id: string;
  ssyl_id: string;
  matricule: string;
  opening_tx_id: string | null;
  discount_tx_id: string | null;
  first_payment_tx_id: string | null;
}

export function useEnrollNewStudent() {
  const qc = useQueryClient();
  return useMutation<EnrollNewStudentResult, Error, EnrollNewStudentPayload>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.rpc('enroll_new_student', { payload });
      if (error) throw error;
      return data as EnrollNewStudentResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment-stats'] });
      qc.invalidateQueries({ queryKey: ['recovery-students'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
    },
  });
}

export interface ReenrollStudentPayload {
  existing_student_id: string;
  school_id: string;
  school_year_id: string;
  classroom_id: string;
  school_fees_id?: string;
  billed_total: number;
  previous_ssyl_id?: string;
  discount?: { amount: number; reason: string; note?: string };
  first_payment?: { amount: number; source: 'cash' | 'bank_transfer' | 'internal'; memo?: string };
}

export interface ReenrollStudentResult {
  ssyl_id: string;
  opening_tx_id: string | null;
  discount_tx_id: string | null;
  first_payment_tx_id: string | null;
}

export function useReenrollStudent() {
  const qc = useQueryClient();
  return useMutation<ReenrollStudentResult, Error, ReenrollStudentPayload>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.rpc('reenroll_student', { payload });
      if (error) throw error;
      return data as ReenrollStudentResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment-stats'] });
      qc.invalidateQueries({ queryKey: ['recovery-students'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['year-advancement-preview'] });
    },
  });
}

export type AdvanceDecision = 'advance' | 'repeat' | 'leave' | 'pending';

export interface BulkAdvancePlanEntry {
  ssyl_id: string;
  decision: AdvanceDecision;
  target_classroom_id?: string;
  target_fees_id?: string;
  billed_total?: number;
}

export interface BulkAdvancePayload {
  school_id: string;
  from_year_id: string;
  to_year_id: string;
  plan: BulkAdvancePlanEntry[];
}

export interface BulkAdvanceResult {
  advance: number;
  repeat: number;
  leave: number;
  pending: number;
}

export function useBulkAdvanceYear() {
  const qc = useQueryClient();
  return useMutation<BulkAdvanceResult, Error, BulkAdvancePayload>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.rpc('bulk_advance_year', { payload });
      if (error) throw error;
      return data as BulkAdvanceResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment-stats'] });
      qc.invalidateQueries({ queryKey: ['recovery-students'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['year-advancement-preview'] });
    },
  });
}
```

- [ ] **Step 2 : Ajouter les re-exports dans `packages/shared/src/index.ts`**

Ajouter à la fin du fichier :

```ts
export * from './hooks/useStudentSearch';
export * from './hooks/useFamilySearch';
export * from './hooks/useClassroomFees';
export * from './hooks/useEnrollmentStats';
export * from './hooks/useYearAdvancementPreview';
export * from './hooks/useEnrollmentMutations';
```

- [ ] **Step 3 : Type-check + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm --filter @edukea/shared lint
# Expected: PASS

git add packages/shared/src/hooks/useEnrollmentMutations.ts packages/shared/src/index.ts
git commit -m "feat(shared): add enrollment mutations + barrel exports for 6 new hooks"
```

---

## Phase 4 — Pages

### Task 13 : Hub `/dashboard/enrollment` (KPI + search + accès rapides)

**Files:**
- Create: `apps/school/src/app/(dashboard)/dashboard/enrollment/page.tsx`
- Create: `apps/school/src/app/(dashboard)/dashboard/enrollment/loading.tsx`

- [ ] **Step 1 : Créer `loading.tsx`**

```tsx
import { Skeleton } from '@edukea/ui';

export default function EnrollmentLoading() {
  return (
    <>
      <div>
        <Skeleton className="mb-2 h-6 w-40" />
        <Skeleton className="h-3.5 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </>
  );
}
```

- [ ] **Step 2 : Créer `page.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { UserPlus, RefreshCw, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { PageHeader, Card, Skeleton } from '@edukea/ui';
import { useSchoolContext, useEnrollmentStats } from '@edukea/shared';

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

export default function EnrollmentHubPage() {
  const searchParams = useSearchParams();
  const { data: ctx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });
  const schoolId = ctx?.current_school?.id;
  const schoolYearId = ctx?.current_year?.id;
  const { data: stats, isLoading } = useEnrollmentStats(schoolId, schoolYearId);

  const qs = (() => {
    const p = new URLSearchParams();
    const school = searchParams.get('school');
    const year = searchParams.get('year');
    if (school) p.set('school', school);
    if (year) p.set('year', year);
    return p.toString() ? `?${p.toString()}` : '';
  })();

  return (
    <>
      <PageHeader
        title="Inscription"
        sub={ctx?.current_school?.name && ctx.current_year?.name ? `${ctx.current_school.name} · ${ctx.current_year.name}` : '—'}
      />

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card>
              <div className="text-caption text-ink-3">Total inscrits</div>
              <div className="mt-1 font-display text-heading-lg font-semibold tabular-nums text-ink">
                {fmt(stats?.total_enrolled ?? 0)}
              </div>
            </Card>
            <Card>
              <div className="text-caption text-ink-3">Nouveaux</div>
              <div className="mt-1 font-display text-heading-lg font-semibold tabular-nums text-ink">
                {fmt(stats?.new_enrollments ?? 0)}
              </div>
            </Card>
            <Card>
              <div className="text-caption text-ink-3">Réinscrits</div>
              <div className="mt-1 font-display text-heading-lg font-semibold tabular-nums text-ink">
                {fmt(stats?.reenrollments ?? 0)}
              </div>
            </Card>
            <Card>
              <div className="text-caption text-ink-3">Non-réinscrits N-1</div>
              <div className="mt-1 font-display text-heading-lg font-semibold tabular-nums text-ink">
                {fmt(stats?.not_reenrolled_previous ?? 0)}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* CTAs principaux */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/dashboard/enrollment/new${qs}`}
          className="group flex items-center gap-3 rounded-xl border border-line bg-white p-4 shadow-flat transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-hover"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/[0.06] text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-heading-sm font-semibold text-ink">Inscrire un nouvel élève</div>
            <div className="text-caption text-ink-3">Wizard 5 étapes</div>
          </div>
        </Link>
        <Link
          href={`/dashboard/enrollment/passage${qs}`}
          className="group flex items-center gap-3 rounded-xl border border-line bg-white p-4 shadow-flat transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-hover"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-accent-soft text-[#B45309]">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-heading-sm font-semibold text-ink">Passage d'année</div>
            <div className="text-caption text-ink-3">Fin N → Rentrée N+1</div>
          </div>
        </Link>
        <Link
          href={`/dashboard/recovery${qs}`}
          className="group flex items-center gap-3 rounded-xl border border-line bg-white p-4 shadow-flat transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-hover"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#059669]">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-heading-sm font-semibold text-ink">Suivi recouvrement</div>
            <div className="text-caption text-ink-3">Voir les créances par élève</div>
          </div>
        </Link>
      </div>
    </>
  );
}
```

- [ ] **Step 3 : Type-check + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea/apps/school && pnpm exec tsc --noEmit
# Expected: PASS

cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
git add "apps/school/src/app/(dashboard)/dashboard/enrollment/page.tsx" "apps/school/src/app/(dashboard)/dashboard/enrollment/loading.tsx"
git commit -m "feat(school): add /dashboard/enrollment hub with KPI + CTAs"
```

---

### Task 14 : Steps 1 et 2 du wizard (Élève + Famille avec search-first)

**Files:**
- Create: `apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepStudent.tsx`
- Create: `apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepFamily.tsx`
- Create: `apps/school/src/app/(dashboard)/dashboard/enrollment/new/_types.ts`

- [ ] **Step 1 : `_types.ts` — form state partagé**

```ts
export interface EnrollmentFormState {
  student: {
    firstname: string;
    lastname: string;
    sex: 'M' | 'F' | '';
    birthdate: string;
    birthplace: string;
    nationality: string;
    redoublant: boolean;
  };
  father?: { id?: string; firstname: string; lastname: string; phone: string; email: string; job: string; address: string; residence: string };
  mother?: { id?: string; firstname: string; lastname: string; phone: string; email: string; job: string; address: string; residence: string };
  tutor?:  { id?: string; firstname: string; lastname: string; phone: string; email: string; job: string; address: string; residence: string };
  classroomId: string;
  feesId: string;
  typeStudentId?: string;
  billedTotal: number;
  discount?: { amount: number; reason: string; note: string };
  firstPaymentEnabled: boolean;
  firstPayment: { amount: number; source: 'cash' | 'bank_transfer' | 'internal'; memo: string };
}

export const DEFAULT_ENROLLMENT_STATE: EnrollmentFormState = {
  student: { firstname: '', lastname: '', sex: '', birthdate: '', birthplace: '', nationality: 'Ivoirienne', redoublant: false },
  father: undefined,
  mother: undefined,
  tutor: undefined,
  classroomId: '',
  feesId: '',
  billedTotal: 0,
  firstPaymentEnabled: true,
  firstPayment: { amount: 0, source: 'cash', memo: '' },
};

export function isStepStudentValid(s: EnrollmentFormState['student']): boolean {
  return !!s.firstname.trim() && !!s.lastname.trim() && !!s.sex && !!s.birthdate;
}

export function isStepFamilyValid(state: EnrollmentFormState): boolean {
  const hasFather = !!state.father?.phone?.trim();
  const hasMother = !!state.mother?.phone?.trim();
  const hasTutor  = !!state.tutor?.phone?.trim();
  return hasFather || hasMother || hasTutor;
}

export function isStepClassroomValid(state: EnrollmentFormState): boolean {
  return !!state.classroomId;
}

export function isStepFeesValid(state: EnrollmentFormState): boolean {
  if (!state.firstPaymentEnabled) return true;
  return state.firstPayment.amount > 0;
}
```

- [ ] **Step 2 : `StepStudent.tsx`**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, UserCheck } from 'lucide-react';
import {
  FormField, Input, Checkbox, DatePicker, RadioCards, SearchInput,
  Card, Avatar, toneFromSeed,
} from '@edukea/ui';
import { useStudentSearch } from '@edukea/shared';
import type { EnrollmentFormState } from '../_types';

export function StepStudent({
  schoolId,
  qsSuffix,
  value,
  onChange,
}: {
  schoolId: string | undefined;
  qsSuffix: string;
  value: EnrollmentFormState['student'];
  onChange: (v: EnrollmentFormState['student']) => void;
}) {
  const [query, setQuery] = useState('');
  const { data: results } = useStudentSearch(schoolId, query);

  return (
    <div className="flex flex-col gap-5">
      <Card className="bg-primary/[0.03]">
        <div className="mb-2 flex items-center gap-2 text-body-sm font-semibold text-primary">
          <Search className="h-4 w-4" /> Vérifier si l'élève existe déjà
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="Nom, prénom, matricule…" />
        {results && results.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {results.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/enrollment/re/${s.id}${qsSuffix}`}
                className="flex items-center gap-3 rounded-md border border-line bg-white p-3 hover:border-primary hover:bg-primary/[0.04]"
              >
                <Avatar
                  initials={`${(s.lastname ?? '?')[0] ?? ''}${(s.firstname ?? '?')[0] ?? ''}`.toUpperCase()}
                  tone={toneFromSeed(s.id)}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">{s.lastname} {s.firstname}</div>
                  {s.matricule && <div className="text-caption text-ink-3">Matr. {s.matricule}</div>}
                </div>
                <div className="text-body-xs font-semibold text-primary">Réinscrire →</div>
              </Link>
            ))}
          </div>
        )}
        {results && query.length >= 2 && results.length === 0 && (
          <div className="mt-2 flex items-center gap-2 text-body-xs text-ink-3">
            <UserCheck className="h-4 w-4" /> Aucun élève existant — continuer la création ci-dessous
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Nom" required>
          <Input value={value.lastname} onChange={(e) => onChange({ ...value, lastname: e.target.value })} />
        </FormField>
        <FormField label="Prénom(s)" required>
          <Input value={value.firstname} onChange={(e) => onChange({ ...value, firstname: e.target.value })} />
        </FormField>
        <FormField label="Sexe" required>
          <RadioCards
            name="sex"
            columns={2}
            options={[
              { value: 'M', label: 'Masculin' },
              { value: 'F', label: 'Féminin' },
            ]}
            value={value.sex || undefined}
            onChange={(v) => onChange({ ...value, sex: v as 'M' | 'F' })}
          />
        </FormField>
        <FormField label="Date de naissance" required>
          <DatePicker value={value.birthdate} onChange={(e) => onChange({ ...value, birthdate: e.target.value })} />
        </FormField>
        <FormField label="Lieu de naissance">
          <Input value={value.birthplace} onChange={(e) => onChange({ ...value, birthplace: e.target.value })} />
        </FormField>
        <FormField label="Nationalité">
          <Input value={value.nationality} onChange={(e) => onChange({ ...value, nationality: e.target.value })} />
        </FormField>
      </div>

      <Checkbox
        checked={value.redoublant}
        onChange={(e) => onChange({ ...value, redoublant: e.target.checked })}
        label="Élève redoublant"
        hint="Cocher si l'élève reprend la même classe qu'à l'année N-1"
      />
    </div>
  );
}
```

- [ ] **Step 3 : `StepFamily.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { FormField, Input, SearchInput, Card, Button } from '@edukea/ui';
import { useFamilySearch } from '@edukea/shared';
import type { EnrollmentFormState } from '../_types';

type FamilyRole = 'father' | 'mother' | 'tutor';
type FamilyState = NonNullable<EnrollmentFormState['father']>;

function EmptyFamily(): FamilyState {
  return { firstname: '', lastname: '', phone: '', email: '', job: '', address: '', residence: '' };
}

function FamilyBlock({
  schoolId,
  role,
  label,
  value,
  onChange,
}: {
  schoolId: string | undefined;
  role: FamilyRole;
  label: string;
  value: FamilyState | undefined;
  onChange: (v: FamilyState | undefined) => void;
}) {
  const [query, setQuery] = useState('');
  const { data: results } = useFamilySearch(schoolId, query);
  const active = !!value;

  return (
    <Card className={active ? 'border-primary/40' : ''}>
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-heading-sm font-semibold text-ink">{label}</div>
        {active ? (
          <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
            Retirer
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => onChange(EmptyFamily())}>
            Ajouter
          </Button>
        )}
      </div>

      {active && (
        <div className="flex flex-col gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher (nom, téléphone)…"
          />
          {results && results.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {results.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      id: f.id,
                      firstname: f.firstname ?? '',
                      lastname: f.lastname ?? '',
                      phone: f.phone ?? '',
                      email: f.email ?? '',
                      job: '',
                      address: f.address ?? '',
                      residence: '',
                    })
                  }
                  className="flex items-center gap-2 rounded-md border border-line bg-white p-2 text-left text-body-sm hover:border-primary hover:bg-primary/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink">{f.lastname} {f.firstname}</div>
                    <div className="text-caption text-ink-3">{f.phone ?? '—'}</div>
                  </div>
                  <span className="text-caption font-semibold text-primary">Utiliser</span>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Nom">
              <Input value={value.lastname} onChange={(e) => onChange({ ...value, lastname: e.target.value })} />
            </FormField>
            <FormField label="Prénom">
              <Input value={value.firstname} onChange={(e) => onChange({ ...value, firstname: e.target.value })} />
            </FormField>
            <FormField label="Téléphone" required>
              <Input type="tel" value={value.phone} onChange={(e) => onChange({ ...value, phone: e.target.value })} />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={value.email} onChange={(e) => onChange({ ...value, email: e.target.value })} />
            </FormField>
            <FormField label="Profession">
              <Input value={value.job} onChange={(e) => onChange({ ...value, job: e.target.value })} />
            </FormField>
            <FormField label="Résidence (ville)">
              <Input value={value.residence} onChange={(e) => onChange({ ...value, residence: e.target.value })} />
            </FormField>
            <FormField label="Adresse" className="sm:col-span-2">
              <Input value={value.address} onChange={(e) => onChange({ ...value, address: e.target.value })} />
            </FormField>
          </div>
        </div>
      )}
    </Card>
  );
}

export function StepFamily({
  schoolId,
  value,
  onChange,
}: {
  schoolId: string | undefined;
  value: EnrollmentFormState;
  onChange: (v: EnrollmentFormState) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm text-ink-3">
        Au moins un des trois blocs (père / mère / tuteur) doit être renseigné avec un téléphone.
      </p>
      <FamilyBlock schoolId={schoolId} role="father" label="Père" value={value.father} onChange={(v) => onChange({ ...value, father: v })} />
      <FamilyBlock schoolId={schoolId} role="mother" label="Mère" value={value.mother} onChange={(v) => onChange({ ...value, mother: v })} />
      <FamilyBlock schoolId={schoolId} role="tutor"  label="Tuteur" value={value.tutor}  onChange={(v) => onChange({ ...value, tutor: v })} />
    </div>
  );
}
```

- [ ] **Step 4 : Type-check + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea/apps/school && pnpm exec tsc --noEmit
# Expected: PASS

cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
git add "apps/school/src/app/(dashboard)/dashboard/enrollment/new"
git commit -m "feat(school): enrollment wizard steps 1 + 2 (student + family with search-first)"
```

---

### Task 15 : Steps 3, 4, 5 du wizard (Classe + Frais + Récap)

**Files:**
- Create: `apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepClassroom.tsx`
- Create: `apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepFeesPayment.tsx`
- Create: `apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepSummary.tsx`

- [ ] **Step 1 : `StepClassroom.tsx`**

```tsx
'use client';

import { useEffect, useMemo } from 'react';
import { FormField, Select, RadioCards } from '@edukea/ui';
import { useRecoveryClasses, useSchoolClassrooms } from '@edukea/shared';
import type { EnrollmentFormState } from '../_types';

export function StepClassroom({
  schoolId,
  schoolYearId,
  value,
  onChange,
}: {
  schoolId: string | undefined;
  schoolYearId: string | undefined;
  value: EnrollmentFormState;
  onChange: (v: EnrollmentFormState) => void;
}) {
  const { data: allClassrooms } = useSchoolClassrooms(schoolId, schoolYearId);
  const { data: classesSummary } = useRecoveryClasses(schoolId, schoolYearId);

  // Options triées par nom
  const classroomOptions = useMemo(
    () => (allClassrooms ?? []).map((c) => ({ value: c.id, label: c.name })),
    [allClassrooms],
  );

  const selectedSummary = classesSummary?.find((c) => c.classroom_id === value.classroomId);

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Classe" required hint="Cycle et niveau se déduisent de la classe">
        <Select
          options={classroomOptions}
          placeholder="Choisir une classe…"
          value={value.classroomId}
          onChange={(e) => onChange({ ...value, classroomId: e.target.value })}
        />
      </FormField>
      {selectedSummary && (
        <div className="rounded-md border border-line bg-line-soft/50 p-3 text-body-xs text-ink-3">
          <span className="font-display text-body-md font-semibold text-ink">{selectedSummary.n_students}</span> élèves déjà
          inscrits dans <span className="font-semibold">{selectedSummary.classroom_name}</span>
          {selectedSummary.level_name && <> · niveau {selectedSummary.level_name}</>}
        </div>
      )}

      <FormField label="Type d'élève">
        <RadioCards
          name="type_student"
          columns={3}
          options={[
            { value: 'new', label: 'Nouveau' },
            { value: 'repeat', label: 'Redoublant' },
            { value: 'transfer', label: 'Transfert' },
          ]}
          value={undefined /* on ne stocke pas type_student_id V1 — placeholder */}
          onChange={() => {}}
        />
      </FormField>
    </div>
  );
}
```

- [ ] **Step 2 : `StepFeesPayment.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import {
  FormField, Input, Checkbox, SegmentedControl, Select, Textarea, Card,
} from '@edukea/ui';
import { useClassroomFees } from '@edukea/shared';
import type { EnrollmentFormState } from '../_types';

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

export function StepFeesPayment({
  schoolYearId,
  value,
  onChange,
}: {
  schoolYearId: string | undefined;
  value: EnrollmentFormState;
  onChange: (v: EnrollmentFormState) => void;
}) {
  const { data: fees } = useClassroomFees(value.classroomId, schoolYearId, value.typeStudentId);

  // Auto-remplir billedTotal + feesId quand le barème arrive
  useEffect(() => {
    if (fees?.fees) {
      onChange({
        ...value,
        feesId: fees.fees.id,
        billedTotal: fees.fees.school_fees_net,
        firstPayment: { ...value.firstPayment, amount: value.firstPayment.amount || fees.fees.registration_fees },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fees?.fees?.id]);

  const netAfterDiscount = value.billedTotal - (value.discount?.amount ?? 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Barème */}
      <Card>
        <div className="mb-2 font-display text-heading-sm font-semibold text-ink">Barème de la classe</div>
        {!fees?.fees ? (
          <div className="text-body-sm text-ink-3">Sélectionner une classe à l'étape précédente pour voir le barème.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-body-sm sm:grid-cols-4">
            <div><div className="text-caption text-ink-3">Inscription</div><div className="mt-0.5 font-display font-semibold tabular-nums">{fmt(fees.fees.registration_fees)}</div></div>
            <div><div className="text-caption text-ink-3">Annexes</div><div className="mt-0.5 font-display font-semibold tabular-nums">{fmt(fees.fees.additionnal_fees)}</div></div>
            <div><div className="text-caption text-ink-3">Scolarité</div><div className="mt-0.5 font-display font-semibold tabular-nums">{fmt(fees.fees.school_fees)}</div></div>
            <div><div className="text-caption text-ink-3 font-semibold">Net à payer</div><div className="mt-0.5 font-display text-heading-sm font-semibold tabular-nums text-primary">{fmt(fees.fees.school_fees_net)} FCFA</div></div>
          </div>
        )}
      </Card>

      {/* Remise */}
      <Card>
        <Checkbox
          checked={!!value.discount}
          onChange={(e) =>
            onChange({ ...value, discount: e.target.checked ? { amount: 0, reason: 'sibling', note: '' } : undefined })
          }
          label="Appliquer une remise"
        />
        {value.discount && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Motif" required>
              <Select
                options={[
                  { value: 'sibling', label: 'Fratrie' },
                  { value: 'social', label: 'Sociale' },
                  { value: 'merit', label: 'Mérite' },
                  { value: 'staff', label: 'Personnel école' },
                  { value: 'other', label: 'Autre' },
                ]}
                value={value.discount.reason}
                onChange={(e) => onChange({ ...value, discount: { ...value.discount!, reason: e.target.value } })}
              />
            </FormField>
            <FormField label="Montant (FCFA)" required>
              <Input
                type="text"
                inputMode="numeric"
                value={value.discount.amount ? fmt(value.discount.amount) : ''}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[\s ]/g, ''));
                  onChange({ ...value, discount: { ...value.discount!, amount: isNaN(n) ? 0 : n } });
                }}
              />
            </FormField>
            <FormField label="Note (optionnel)" className="sm:col-span-2">
              <Textarea
                rows={2}
                value={value.discount.note}
                onChange={(e) => onChange({ ...value, discount: { ...value.discount!, note: e.target.value } })}
              />
            </FormField>
          </div>
        )}
      </Card>

      {/* 1er versement */}
      <Card>
        <Checkbox
          checked={value.firstPaymentEnabled}
          onChange={(e) => onChange({ ...value, firstPaymentEnabled: e.target.checked })}
          label="Enregistrer un premier versement (recommandé)"
          hint="Décocher uniquement pour les cas particuliers (bourse totale, dossier différé)"
        />
        {value.firstPaymentEnabled && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Montant" required>
              <Input
                type="text"
                inputMode="numeric"
                value={value.firstPayment.amount ? fmt(value.firstPayment.amount) : ''}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[\s ]/g, ''));
                  onChange({ ...value, firstPayment: { ...value.firstPayment, amount: isNaN(n) ? 0 : n } });
                }}
                suffix={<span className="text-body-xs">FCFA</span>}
              />
            </FormField>
            <FormField label="Mode" required>
              <SegmentedControl
                options={[
                  { value: 'cash', label: 'Espèces' },
                  { value: 'bank_transfer', label: 'Virement' },
                  { value: 'internal', label: 'Autre' },
                ]}
                value={value.firstPayment.source}
                onChange={(v) => onChange({ ...value, firstPayment: { ...value.firstPayment, source: v as 'cash' | 'bank_transfer' | 'internal' } })}
              />
            </FormField>
            <FormField label="Note (ex : Reçu 001/2026)" className="sm:col-span-2">
              <Input
                value={value.firstPayment.memo}
                onChange={(e) => onChange({ ...value, firstPayment: { ...value.firstPayment, memo: e.target.value } })}
              />
            </FormField>
          </div>
        )}
      </Card>

      {/* Total récapitulatif */}
      <div className="rounded-md border-2 border-primary/20 bg-primary/[0.03] p-4">
        <div className="flex items-baseline justify-between">
          <div className="text-body-sm font-semibold text-ink">Net à payer après remise</div>
          <div className="font-display text-heading-lg font-semibold tabular-nums text-primary">
            {fmt(netAfterDiscount)} <span className="text-body-sm">FCFA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : `StepSummary.tsx`**

```tsx
'use client';

import { Card, StatusPill } from '@edukea/ui';
import type { EnrollmentFormState } from '../_types';

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

export function StepSummary({ value }: { value: EnrollmentFormState }) {
  const net = value.billedTotal - (value.discount?.amount ?? 0);
  const paidNow = value.firstPaymentEnabled ? value.firstPayment.amount : 0;
  const remaining = net - paidNow;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-3 font-display text-heading-sm font-semibold text-ink">Identité</div>
        <div className="grid grid-cols-2 gap-3 text-body-sm">
          <div><div className="text-caption text-ink-3">Nom complet</div><div className="mt-0.5 font-semibold">{value.student.lastname} {value.student.firstname}</div></div>
          <div><div className="text-caption text-ink-3">Sexe</div><div className="mt-0.5">{value.student.sex === 'M' ? 'Masculin' : 'Féminin'}</div></div>
          <div><div className="text-caption text-ink-3">Date de naissance</div><div className="mt-0.5">{value.student.birthdate}</div></div>
          <div><div className="text-caption text-ink-3">Nationalité</div><div className="mt-0.5">{value.student.nationality}</div></div>
        </div>
      </Card>

      <Card>
        <div className="mb-3 font-display text-heading-sm font-semibold text-ink">Famille</div>
        <div className="flex flex-wrap gap-2 text-body-sm">
          {value.father?.phone && <span className="rounded-md bg-line-soft px-2 py-1"><span className="font-semibold">Père</span> · {value.father.lastname} {value.father.firstname} · {value.father.phone}</span>}
          {value.mother?.phone && <span className="rounded-md bg-line-soft px-2 py-1"><span className="font-semibold">Mère</span> · {value.mother.lastname} {value.mother.firstname} · {value.mother.phone}</span>}
          {value.tutor?.phone  && <span className="rounded-md bg-line-soft px-2 py-1"><span className="font-semibold">Tuteur</span> · {value.tutor.lastname} {value.tutor.firstname} · {value.tutor.phone}</span>}
        </div>
      </Card>

      <Card>
        <div className="mb-3 font-display text-heading-sm font-semibold text-ink">Récapitulatif financier</div>
        <div className="flex flex-col gap-2 text-body-sm">
          <div className="flex justify-between"><span className="text-ink-3">Facturé</span><span className="font-display font-semibold tabular-nums">{fmt(value.billedTotal)} FCFA</span></div>
          {value.discount && (
            <div className="flex justify-between text-[#B45309]"><span>Remise ({value.discount.reason})</span><span className="font-display font-semibold tabular-nums">−{fmt(value.discount.amount)} FCFA</span></div>
          )}
          <div className="flex justify-between border-t border-line pt-2"><span className="font-semibold">Net à payer</span><span className="font-display font-semibold tabular-nums">{fmt(net)} FCFA</span></div>
          {value.firstPaymentEnabled && (
            <div className="flex justify-between text-[#059669]"><span>Versement aujourd'hui</span><span className="font-display font-semibold tabular-nums">−{fmt(paidNow)} FCFA</span></div>
          )}
          <div className="flex items-center justify-between border-t border-line pt-2">
            <span className="font-semibold">Reste à payer</span>
            <div className="flex items-center gap-2">
              <StatusPill status={remaining <= 0 ? 'solde' : (paidNow > 0 ? 'debute' : 'impaye')} />
              <span className="font-display text-heading-sm font-semibold tabular-nums text-ink">{fmt(Math.max(0, remaining))} FCFA</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4 : Type-check + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea/apps/school && pnpm exec tsc --noEmit
# Expected: PASS

cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
git add "apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepClassroom.tsx" "apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepFeesPayment.tsx" "apps/school/src/app/(dashboard)/dashboard/enrollment/new/_steps/StepSummary.tsx"
git commit -m "feat(school): enrollment wizard steps 3 + 4 + 5 (classroom, fees+discount+payment, summary)"
```

---

### Task 16 : Wizard container `/enrollment/new/page.tsx`

**Files:**
- Create: `apps/school/src/app/(dashboard)/dashboard/enrollment/new/page.tsx`

- [ ] **Step 1 : Créer le container**

```tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageHeader, Wizard } from '@edukea/ui';
import { useSchoolContext, useEnrollNewStudent } from '@edukea/shared';
import { StepStudent } from './_steps/StepStudent';
import { StepFamily } from './_steps/StepFamily';
import { StepClassroom } from './_steps/StepClassroom';
import { StepFeesPayment } from './_steps/StepFeesPayment';
import { StepSummary } from './_steps/StepSummary';
import {
  DEFAULT_ENROLLMENT_STATE, isStepStudentValid, isStepFamilyValid,
  isStepClassroomValid, isStepFeesValid,
} from './_types';

const STEPS = [
  { id: 'student', label: 'Fiche élève', shortLabel: 'Élève' },
  { id: 'family', label: 'Famille', shortLabel: 'Famille' },
  { id: 'classroom', label: 'Niveau & classe', shortLabel: 'Classe' },
  { id: 'fees', label: 'Frais & versement', shortLabel: 'Frais' },
  { id: 'summary', label: 'Récapitulatif', shortLabel: 'Récap' },
];

export default function NewEnrollmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: ctx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });
  const schoolId = ctx?.current_school?.id;
  const schoolYearId = ctx?.current_year?.id;

  const [state, setState] = useState(DEFAULT_ENROLLMENT_STATE);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const enroll = useEnrollNewStudent();

  const qs = (() => {
    const p = new URLSearchParams();
    const school = searchParams.get('school');
    const year = searchParams.get('year');
    if (school) p.set('school', school);
    if (year) p.set('year', year);
    return p.toString() ? `?${p.toString()}` : '';
  })();

  const isValid = (() => {
    switch (current) {
      case 0: return isStepStudentValid(state.student);
      case 1: return isStepFamilyValid(state);
      case 2: return isStepClassroomValid(state);
      case 3: return isStepFeesValid(state);
      case 4: return true;
      default: return false;
    }
  })();

  const handleSubmit = async () => {
    setError(null);
    if (!schoolId || !schoolYearId) { setError('Contexte école/année manquant.'); return; }
    try {
      const res = await enroll.mutateAsync({
        school_id: schoolId,
        school_year_id: schoolYearId,
        classroom_id: state.classroomId,
        school_fees_id: state.feesId || undefined,
        billed_total: state.billedTotal,
        student: {
          firstname: state.student.firstname,
          lastname: state.student.lastname,
          sex: state.student.sex as 'M' | 'F',
          birthdate: state.student.birthdate,
          birthplace: state.student.birthplace || undefined,
          nationality: state.student.nationality || undefined,
          redoublant: state.student.redoublant,
        },
        father: state.father?.phone ? state.father : undefined,
        mother: state.mother?.phone ? state.mother : undefined,
        tutor:  state.tutor?.phone  ? state.tutor  : undefined,
        discount: state.discount && state.discount.amount > 0 ? state.discount : undefined,
        first_payment: state.firstPaymentEnabled && state.firstPayment.amount > 0 ? state.firstPayment : undefined,
      });
      router.push(`/dashboard/enrollment/${res.ssyl_id}${qs}`);
    } catch (e) {
      setError((e as Error).message ?? 'Erreur lors de l\'enregistrement.');
    }
  };

  return (
    <>
      <div>
        <Link href={`/dashboard/enrollment${qs}`} className="mb-2 inline-flex items-center gap-1 text-body-sm font-semibold text-primary hover:opacity-80">
          <ChevronLeft className="h-4 w-4" /> Inscription
        </Link>
        <PageHeader title="Nouvel élève" sub={ctx?.current_school?.name && ctx.current_year?.name ? `${ctx.current_school.name} · ${ctx.current_year.name}` : '—'} />
      </div>

      <Wizard
        steps={STEPS}
        currentIndex={current}
        isCurrentStepValid={isValid}
        isSubmitting={enroll.isPending}
        onBack={() => setCurrent((c) => Math.max(0, c - 1))}
        onNext={() => setCurrent((c) => Math.min(STEPS.length - 1, c + 1))}
        onSubmit={handleSubmit}
        submitLabel="Confirmer l'inscription"
      >
        {current === 0 && <StepStudent schoolId={schoolId} qsSuffix={qs} value={state.student} onChange={(v) => setState({ ...state, student: v })} />}
        {current === 1 && <StepFamily schoolId={schoolId} value={state} onChange={setState} />}
        {current === 2 && <StepClassroom schoolId={schoolId} schoolYearId={schoolYearId} value={state} onChange={setState} />}
        {current === 3 && <StepFeesPayment schoolYearId={schoolYearId} value={state} onChange={setState} />}
        {current === 4 && <StepSummary value={state} />}
      </Wizard>

      {error && <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-body-sm text-destructive">{error}</div>}
    </>
  );
}
```

- [ ] **Step 2 : Type-check + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea/apps/school && pnpm exec tsc --noEmit
# Expected: PASS

cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
git add "apps/school/src/app/(dashboard)/dashboard/enrollment/new/page.tsx"
git commit -m "feat(school): /dashboard/enrollment/new wizard container (5 steps)"
```

---

### Task 17 : Page réinscription `/enrollment/re/[studentId]`

**Files:**
- Create: `apps/school/src/app/(dashboard)/dashboard/enrollment/re/[studentId]/page.tsx`

- [ ] **Step 1 : Créer la page**

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { PageHeader, Wizard, Card, FormField, Select, Checkbox, Input, SegmentedControl, RadioCards, StatusPill } from '@edukea/ui';
import { useSchoolContext, useReenrollStudent, useSchoolClassrooms, useClassroomFees, supabase } from '@edukea/shared';

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

interface StudentBrief {
  id: string;
  firstname: string | null;
  lastname: string | null;
  matricule: string | null;
  school_id: string;
}
interface PrevSSYL {
  id: string;
  classroom_id: string;
  school_year_id: string;
}

const STEPS = [
  { id: 'confirm', label: 'Confirmer identité', shortLabel: 'Identité' },
  { id: 'class', label: 'Nouvelle classe', shortLabel: 'Classe' },
  { id: 'fees', label: 'Frais & versement', shortLabel: 'Frais' },
];

export default function ReenrollPage() {
  const params = useParams<{ studentId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: ctx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });
  const schoolId = ctx?.current_school?.id;
  const schoolYearId = ctx?.current_year?.id;

  const [student, setStudent] = useState<StudentBrief | null>(null);
  const [prev, setPrev] = useState<PrevSSYL | null>(null);
  const [current, setCurrent] = useState(0);
  const [classroomId, setClassroomId] = useState('');
  const [decision, setDecision] = useState<'advance' | 'repeat'>('advance');
  const [firstPaymentEnabled, setFirstPaymentEnabled] = useState(true);
  const [firstPayment, setFirstPayment] = useState<{ amount: number; source: 'cash' | 'bank_transfer' | 'internal'; memo: string }>({ amount: 0, source: 'cash', memo: '' });
  const [error, setError] = useState<string | null>(null);

  const { data: classrooms } = useSchoolClassrooms(schoolId, schoolYearId);
  const { data: fees } = useClassroomFees(classroomId, schoolYearId);
  const reenroll = useReenrollStudent();

  // Fetch student + previous ssyl
  useEffect(() => {
    if (!params.studentId) return;
    (async () => {
      const { data: s } = await supabase
        .from('students')
        .select('id, firstname, lastname, matricule, school_id')
        .eq('id', params.studentId)
        .maybeSingle();
      setStudent((s as StudentBrief | null) ?? null);
      const { data: p } = await supabase
        .from('student_school_year_loggings')
        .select('id, classroom_id, school_year_id')
        .eq('student_id', params.studentId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setPrev((p as PrevSSYL | null) ?? null);
    })();
  }, [params.studentId]);

  // Pré-remplir firstPayment.amount avec registration_fees quand fees arrive
  useEffect(() => {
    if (fees?.fees && firstPayment.amount === 0) {
      setFirstPayment((v) => ({ ...v, amount: fees.fees!.registration_fees }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fees?.fees?.id]);

  const qs = (() => {
    const p = new URLSearchParams();
    const school = searchParams.get('school');
    const year = searchParams.get('year');
    if (school) p.set('school', school);
    if (year) p.set('year', year);
    return p.toString() ? `?${p.toString()}` : '';
  })();

  const isValid = current === 0 || (current === 1 && !!classroomId) || (current === 2 && (!firstPaymentEnabled || firstPayment.amount > 0));

  const handleSubmit = async () => {
    setError(null);
    if (!schoolId || !schoolYearId || !student || !classroomId) { setError('Contexte manquant.'); return; }
    try {
      const res = await reenroll.mutateAsync({
        existing_student_id: student.id,
        school_id: schoolId,
        school_year_id: schoolYearId,
        classroom_id: classroomId,
        school_fees_id: fees?.fees?.id,
        billed_total: fees?.fees?.school_fees_net ?? 0,
        previous_ssyl_id: prev?.id,
        first_payment: firstPaymentEnabled && firstPayment.amount > 0 ? firstPayment : undefined,
      });
      router.push(`/dashboard/enrollment/${res.ssyl_id}${qs}`);
    } catch (e) {
      setError((e as Error).message ?? 'Erreur.');
    }
  };

  return (
    <>
      <div>
        <Link href={`/dashboard/enrollment${qs}`} className="mb-2 inline-flex items-center gap-1 text-body-sm font-semibold text-primary hover:opacity-80">
          <ChevronLeft className="h-4 w-4" /> Inscription
        </Link>
        <PageHeader
          title={student ? `Réinscrire ${student.lastname} ${student.firstname}` : 'Réinscription'}
          sub={student?.matricule ? `Matr. ${student.matricule}` : undefined}
        />
      </div>

      <Wizard
        steps={STEPS}
        currentIndex={current}
        isCurrentStepValid={isValid}
        isSubmitting={reenroll.isPending}
        onBack={() => setCurrent((c) => Math.max(0, c - 1))}
        onNext={() => setCurrent((c) => Math.min(STEPS.length - 1, c + 1))}
        onSubmit={handleSubmit}
        submitLabel="Confirmer la réinscription"
      >
        {current === 0 && (
          <Card>
            {student ? (
              <div className="flex flex-col gap-2">
                <div><span className="text-caption text-ink-3">Nom</span> · <span className="font-semibold">{student.lastname} {student.firstname}</span></div>
                <div><span className="text-caption text-ink-3">Matricule</span> · {student.matricule ?? '—'}</div>
                <p className="mt-3 text-body-xs text-ink-3">L'édition de l'identité (téléphones parents, etc.) sera possible V2. Pour l'instant, on passe directement à la classe.</p>
              </div>
            ) : (
              <div className="text-body-sm text-ink-3">Chargement…</div>
            )}
          </Card>
        )}

        {current === 1 && (
          <div className="flex flex-col gap-4">
            <FormField label="Décision">
              <RadioCards
                name="decision"
                columns={2}
                options={[
                  { value: 'advance', label: 'Passage niveau+1' },
                  { value: 'repeat',  label: 'Redoublement' },
                ]}
                value={decision}
                onChange={(v) => setDecision(v as 'advance' | 'repeat')}
              />
            </FormField>
            <FormField label="Classe cible" required>
              <Select
                options={(classrooms ?? []).map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Choisir une classe…"
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
              />
            </FormField>
          </div>
        )}

        {current === 2 && (
          <div className="flex flex-col gap-4">
            {fees?.fees && (
              <div className="rounded-md border border-line bg-line-soft/50 p-3 text-body-sm text-ink-3">
                Barème sélectionné · Net à payer <span className="font-display font-semibold tabular-nums text-ink">{fmt(fees.fees.school_fees_net)} FCFA</span>
              </div>
            )}
            <Checkbox
              checked={firstPaymentEnabled}
              onChange={(e) => setFirstPaymentEnabled(e.target.checked)}
              label="Enregistrer un premier versement (recommandé)"
            />
            {firstPaymentEnabled && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Montant" required>
                  <Input
                    type="text" inputMode="numeric"
                    value={firstPayment.amount ? fmt(firstPayment.amount) : ''}
                    onChange={(e) => setFirstPayment({ ...firstPayment, amount: Number(e.target.value.replace(/[\s ]/g, '')) || 0 })}
                    suffix={<span className="text-body-xs">FCFA</span>}
                  />
                </FormField>
                <FormField label="Mode" required>
                  <SegmentedControl
                    options={[
                      { value: 'cash', label: 'Espèces' },
                      { value: 'bank_transfer', label: 'Virement' },
                      { value: 'internal', label: 'Autre' },
                    ]}
                    value={firstPayment.source}
                    onChange={(v) => setFirstPayment({ ...firstPayment, source: v as 'cash' | 'bank_transfer' | 'internal' })}
                  />
                </FormField>
                <FormField label="Note" className="sm:col-span-2">
                  <Input value={firstPayment.memo} onChange={(e) => setFirstPayment({ ...firstPayment, memo: e.target.value })} />
                </FormField>
              </div>
            )}
          </div>
        )}
      </Wizard>

      {error && <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-body-sm text-destructive">{error}</div>}
    </>
  );
}
```

- [ ] **Step 2 : Type-check + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea/apps/school && pnpm exec tsc --noEmit
# Expected: PASS

cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
git add "apps/school/src/app/(dashboard)/dashboard/enrollment/re"
git commit -m "feat(school): /dashboard/enrollment/re/[studentId] reinscription wizard (3 steps)"
```

---

### Task 18 : Page passage batch `/enrollment/passage`

**Files:**
- Create: `apps/school/src/app/(dashboard)/dashboard/enrollment/passage/page.tsx`

- [ ] **Step 1 : Créer la page**

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { PageHeader, Card, Select, Checkbox, SearchInput, Button, Skeleton, StatusPill } from '@edukea/ui';
import {
  useSchoolContext, useYearAdvancementPreview, useSchoolClassrooms, useBulkAdvanceYear,
  type AdvanceDecision, type BulkAdvancePlanEntry, type AdvancementPreviewRow,
} from '@edukea/shared';

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

// Extraction section (dernier token du nom classe) pour matcher au niveau+1
function extractSection(name: string | null | undefined): string | null {
  if (!name) return null;
  const m = name.match(/(\S+)\s*$/);
  return m ? m[1] : null;
}

export default function PassagePage() {
  const searchParams = useSearchParams();
  const { data: ctx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });
  const schoolId = ctx?.current_school?.id;

  const [fromYearId, setFromYearId] = useState('');
  const [toYearId, setToYearId] = useState('');

  useEffect(() => {
    if (ctx?.years && ctx.years.length >= 2 && !fromYearId) {
      // Par défaut : from = année N-1, to = année courante
      setFromYearId(ctx.years[1]?.id ?? '');
      setToYearId(ctx.years[0]?.id ?? '');
    } else if (ctx?.years && ctx.years.length === 1 && !fromYearId) {
      setFromYearId(ctx.years[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.years]);

  const { data: preview, isLoading } = useYearAdvancementPreview(schoolId, fromYearId);
  const { data: targetClassrooms } = useSchoolClassrooms(schoolId, toYearId);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [plan, setPlan] = useState<Record<string, { decision: AdvanceDecision; target_classroom_id?: string }>>({});
  const [search, setSearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<AdvanceDecision | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ advance: number; repeat: number; leave: number; pending: number } | null>(null);

  const advance = useBulkAdvanceYear();

  // Suggestion classe cible : garder la même section
  const targetClassByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of targetClassrooms ?? []) map.set(c.name, c.id);
    return map;
  }, [targetClassrooms]);

  // Initialiser plan avec suggestion pour chaque row (une seule fois quand preview arrive)
  useEffect(() => {
    if (!preview || Object.keys(plan).length > 0) return;
    const init: Record<string, { decision: AdvanceDecision; target_classroom_id?: string }> = {};
    for (const r of preview) {
      const section = extractSection(r.from_classroom_name);
      // Chercher une classe du niveau suivant finissant par la même section
      const target = (targetClassrooms ?? []).find((c) => (!section || c.name.endsWith(section)) && r.suggested_level_id ? c.name.includes(r.from_level_name ?? '') : true);
      init[r.from_ssyl_id] = { decision: 'advance', target_classroom_id: target?.id };
    }
    setPlan(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, targetClassrooms]);

  const filteredRows = useMemo(() => {
    if (!preview) return [] as AdvancementPreviewRow[];
    const q = search.trim().toLowerCase();
    return preview.filter((r) => {
      if (decisionFilter !== 'all' && plan[r.from_ssyl_id]?.decision !== decisionFilter) return false;
      if (!q) return true;
      return (r.student_name?.toLowerCase().includes(q) || r.matricule?.toLowerCase().includes(q));
    });
  }, [preview, search, decisionFilter, plan]);

  const bulkAssign = (decision: AdvanceDecision) => {
    setPlan((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(selected)) if (selected[id]) next[id] = { ...next[id], decision };
      return next;
    });
  };

  const bulkAssignClassroom = (classroomId: string) => {
    setPlan((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(selected)) if (selected[id]) next[id] = { ...next[id], target_classroom_id: classroomId };
      return next;
    });
  };

  const handleConfirm = async () => {
    setError(null);
    if (!schoolId || !fromYearId || !toYearId) { setError('Sélectionner les années.'); return; }
    const entries: BulkAdvancePlanEntry[] = Object.entries(plan).map(([ssylId, p]) => ({
      ssyl_id: ssylId,
      decision: p.decision,
      target_classroom_id: (p.decision === 'advance' || p.decision === 'repeat') ? p.target_classroom_id : undefined,
    }));
    if (entries.length === 0) { setError('Aucun élève à passer.'); return; }
    try {
      const res = await advance.mutateAsync({ school_id: schoolId, from_year_id: fromYearId, to_year_id: toYearId, plan: entries });
      setResult(res);
    } catch (e) {
      setError((e as Error).message ?? 'Erreur.');
    }
  };

  const qs = (() => {
    const p = new URLSearchParams();
    const school = searchParams.get('school');
    const year = searchParams.get('year');
    if (school) p.set('school', school);
    if (year) p.set('year', year);
    return p.toString() ? `?${p.toString()}` : '';
  })();

  return (
    <>
      <div>
        <Link href={`/dashboard/enrollment${qs}`} className="mb-2 inline-flex items-center gap-1 text-body-sm font-semibold text-primary hover:opacity-80">
          <ChevronLeft className="h-4 w-4" /> Inscription
        </Link>
        <PageHeader title="Passage d'année" sub={`${preview?.length ?? 0} élèves à traiter`} />
      </div>

      {result ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="font-display text-heading-lg font-semibold text-ink">Passage terminé</div>
            <div className="text-body-sm text-ink-3">
              <span className="font-semibold text-[#059669]">{result.advance}</span> passages · <span className="font-semibold text-[#B45309]">{result.repeat}</span> redoublements · <span className="font-semibold text-[#B91C1C]">{result.leave}</span> départs · {result.pending} en attente
            </div>
            <Link href={`/dashboard/enrollment${qs}`} className="mt-2 inline-block rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white">Retour au hub</Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Sélecteurs années */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              options={(ctx?.years ?? []).map((y) => ({ value: y.id, label: `De ${y.name}` }))}
              value={fromYearId}
              onChange={(e) => setFromYearId(e.target.value)}
            />
            <Select
              options={(ctx?.years ?? []).map((y) => ({ value: y.id, label: `Vers ${y.name}` }))}
              value={toYearId}
              onChange={(e) => setToYearId(e.target.value)}
            />
          </div>

          {/* Filtres */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full sm:max-w-sm">
              <SearchInput value={search} onChange={setSearch} placeholder="Rechercher (nom, matricule)…" />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Toutes décisions' },
                { value: 'advance', label: 'Passage' },
                { value: 'repeat', label: 'Redoublement' },
                { value: 'leave', label: 'Départ' },
                { value: 'pending', label: 'En attente' },
              ]}
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value as AdvanceDecision | 'all')}
            />
          </div>

          {/* Actions bulk */}
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-line-soft/40 p-3">
            <span className="text-body-xs text-ink-3">Sélection en masse :</span>
            <Button variant="secondary" size="sm" onClick={() => bulkAssign('advance')}>→ Passage</Button>
            <Button variant="secondary" size="sm" onClick={() => bulkAssign('repeat')}>→ Redoublement</Button>
            <Button variant="secondary" size="sm" onClick={() => bulkAssign('leave')}>→ Départ</Button>
            <span className="ml-2 text-body-xs text-ink-3">Classe cible :</span>
            <div className="min-w-[160px]">
              <Select
                options={[{ value: '', label: '—' }, ...(targetClassrooms ?? []).map((c) => ({ value: c.id, label: c.name }))]}
                value=""
                onChange={(e) => e.target.value && bulkAssignClassroom(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : (
            <Card className="p-0">
              <div className="max-h-[70vh] overflow-y-auto">
                <table className="w-full text-body-sm">
                  <thead className="sticky top-0 bg-line-soft text-caption font-semibold text-ink-3">
                    <tr>
                      <th className="w-10 px-3 py-2" />
                      <th className="px-3 py-2 text-left">Élève</th>
                      <th className="px-3 py-2 text-left">Classe N</th>
                      <th className="px-3 py-2 text-left">Décision</th>
                      <th className="px-3 py-2 text-left">Classe N+1</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r) => {
                      const p = plan[r.from_ssyl_id] ?? { decision: 'pending' as AdvanceDecision, target_classroom_id: undefined };
                      return (
                        <tr key={r.from_ssyl_id} className="border-b border-line-soft">
                          <td className="px-3 py-2">
                            <Checkbox
                              checked={!!selected[r.from_ssyl_id]}
                              onChange={(e) => setSelected((s) => ({ ...s, [r.from_ssyl_id]: e.target.checked }))}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-semibold text-ink">{r.student_name}</div>
                            {r.matricule && <div className="text-caption text-ink-3">Matr. {r.matricule}</div>}
                          </td>
                          <td className="px-3 py-2 text-body-xs text-ink-2">{r.from_classroom_name ?? '—'}</td>
                          <td className="px-3 py-2">
                            <Select
                              options={[
                                { value: 'advance', label: 'Passage' },
                                { value: 'repeat', label: 'Redoublement' },
                                { value: 'leave', label: 'Départ' },
                                { value: 'pending', label: 'En attente' },
                              ]}
                              value={p.decision}
                              onChange={(e) => setPlan((prev) => ({ ...prev, [r.from_ssyl_id]: { ...prev[r.from_ssyl_id], decision: e.target.value as AdvanceDecision } }))}
                            />
                          </td>
                          <td className="px-3 py-2">
                            {(p.decision === 'advance' || p.decision === 'repeat') ? (
                              <Select
                                options={[{ value: '', label: '—' }, ...(targetClassrooms ?? []).map((c) => ({ value: c.id, label: c.name }))]}
                                value={p.target_classroom_id ?? ''}
                                onChange={(e) => setPlan((prev) => ({ ...prev, [r.from_ssyl_id]: { ...prev[r.from_ssyl_id], target_classroom_id: e.target.value } }))}
                              />
                            ) : (
                              <span className="text-caption text-ink-3">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="flex items-center justify-between border-t border-line pt-4">
            <div className="text-body-xs text-ink-3">
              {Object.keys(plan).length} élèves prêts · <span className="font-semibold text-ink">{Object.values(plan).filter((p) => p.decision === 'advance').length}</span> passages
            </div>
            <Button variant="primary" size="lg" onClick={handleConfirm} disabled={advance.isPending}>
              {advance.isPending ? 'Enregistrement…' : 'Confirmer les décisions'}
            </Button>
          </div>
          {error && <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-body-sm text-destructive">{error}</div>}
        </>
      )}
    </>
  );
}
```

- [ ] **Step 2 : Type-check + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea/apps/school && pnpm exec tsc --noEmit
# Expected: PASS

cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
git add "apps/school/src/app/(dashboard)/dashboard/enrollment/passage"
git commit -m "feat(school): /dashboard/enrollment/passage batch year advancement"
```

---

### Task 19 : Fiche inscription `/enrollment/[ssylId]` + fix navigation

**Files:**
- Create: `apps/school/src/app/(dashboard)/dashboard/enrollment/[ssylId]/page.tsx`
- Modify: `apps/school/src/app/(dashboard)/layout.tsx` (fix hrefs `/dashboard/enrollment` et `/dashboard/reenrollment`)

- [ ] **Step 1 : Créer la fiche**

```tsx
'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, Coins } from 'lucide-react';
import { PageHeader, Card, Skeleton, Button, StatusPill } from '@edukea/ui';
import { useStudentDetail, useSchoolContext } from '@edukea/shared';

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

export default function EnrollmentDetailPage() {
  const params = useParams<{ ssylId: string }>();
  const searchParams = useSearchParams();
  const { data: ctx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });
  const { data: student, isLoading } = useStudentDetail(params.ssylId);

  const qs = (() => {
    const p = new URLSearchParams();
    const school = searchParams.get('school');
    const year = searchParams.get('year');
    if (school) p.set('school', school);
    if (year) p.set('year', year);
    return p.toString() ? `?${p.toString()}` : '';
  })();

  return (
    <>
      <div>
        <Link href={`/dashboard/enrollment${qs}`} className="mb-2 inline-flex items-center gap-1 text-body-sm font-semibold text-primary hover:opacity-80">
          <ChevronLeft className="h-4 w-4" /> Inscription
        </Link>
        <PageHeader
          title={isLoading ? <Skeleton className="h-6 w-64" /> : student?.student_name ?? '—'}
          sub={student ? `${student.classroom_name ?? '—'} · Matr. ${student.matricule ?? '—'}` : undefined}
          actions={student && (
            <Link href={`/dashboard/recovery/${student.ssyl_id}${qs}`}>
              <Button variant="primary">
                <Coins className="h-4 w-4" /> Gérer les versements
              </Button>
            </Link>
          )}
        />
      </div>

      {isLoading || !student ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <Card>
          <div className="mb-3 font-display text-heading-sm font-semibold text-ink">Situation d'inscription</div>
          <div className="grid grid-cols-2 gap-3 text-body-sm sm:grid-cols-4">
            <div><div className="text-caption text-ink-3">Facturé</div><div className="mt-0.5 font-display font-semibold tabular-nums">{fmt(student.billed_initial)} FCFA</div></div>
            <div><div className="text-caption text-ink-3">Encaissé</div><div className="mt-0.5 font-display font-semibold tabular-nums text-[#059669]">{fmt(student.collected)} FCFA</div></div>
            <div><div className="text-caption text-ink-3">Restant</div><div className="mt-0.5 font-display font-semibold tabular-nums">{fmt(student.remaining)} FCFA</div></div>
            <div><div className="text-caption text-ink-3">Statut</div><div className="mt-0.5"><StatusPill status={student.status} /></div></div>
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-2 font-display text-heading-sm font-semibold text-ink">Édition administrative</div>
        <p className="text-body-sm text-ink-3">
          L'édition de l'identité, de la famille et le changement de classe intra-année seront livrés dans la V2 du module.
          Pour l'instant, utilisez le bouton « Gérer les versements » pour poster des paiements.
        </p>
      </Card>
    </>
  );
}
```

- [ ] **Step 2 : Fix nav layout — les items `/enrollment` et `/reenrollment` pointent maintenant sur des routes existantes**

Modifier `apps/school/src/app/(dashboard)/layout.tsx` — remplacer les hrefs dans `sections` :

```ts
// Ancien :
{ href: '/dashboard/enrollment', label: 'Inscription', icon: UserPlus, badge: null as React.ReactNode | null },
{ href: '/dashboard/reenrollment', label: 'Reinscription', icon: RefreshCw, badge: null as React.ReactNode | null },

// Nouveau : /reenrollment n'existe pas comme route dédiée (il passe par /enrollment/re/[studentId])
// Simplification : un seul lien "Inscription" vers le hub, et un lien "Passage d'année" séparé.
```

Remplacer dans `apps/school/src/app/(dashboard)/layout.tsx` (dans la constante `sections`) :

```ts
  {
    label: 'Scolarite',
    items: [
      { href: '/dashboard/students', label: 'Eleves', icon: Users, badge: <Badge>1573</Badge> as React.ReactNode | null },
      { href: '/dashboard/enrollment', label: 'Inscription', icon: UserPlus, badge: null as React.ReactNode | null },
      { href: '/dashboard/enrollment/passage', label: "Passage d'annee", icon: RefreshCw, badge: null as React.ReactNode | null },
    ],
  },
```

- [ ] **Step 3 : Type-check + commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea/apps/school && pnpm exec tsc --noEmit
# Expected: PASS

cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
git add "apps/school/src/app/(dashboard)/dashboard/enrollment/[ssylId]" "apps/school/src/app/(dashboard)/layout.tsx"
git commit -m "feat(school): enrollment fiche + fix sidebar nav (Inscription + Passage d'annee)"
```

---

### Task 20 : Vérification finale + milestone commit

- [ ] **Step 1 : Lancer tous les type-checks + tests**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
pnpm --filter @edukea/ui lint
pnpm --filter @edukea/ui test
pnpm --filter @edukea/shared lint
cd apps/school && pnpm exec tsc --noEmit
```

Expected : PASS partout (tests UI : 9 précédents + 4 nouveaux Wizard = 13).

- [ ] **Step 2 : Vérification navigation manuelle**

Démarrer le dev server et vérifier :

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea/apps/school && pnpm dev
```

Ouvrir `http://localhost:4002/dashboard/enrollment` (après login) et vérifier :
1. Hub s'affiche avec KPI
2. Clic « Inscrire un nouvel élève » → wizard 5 étapes charge
3. Étape 1 : rechercher "SORE" → dropdown propose de réinscrire (si le compte a un SORE existant)
4. Terminer un wizard test → redirect vers `/enrollment/[ssylId]`
5. Depuis fiche → clic « Gérer les versements » → `/dashboard/recovery/[ssylId]`
6. `/dashboard/enrollment/passage` → table pré-remplie avec suggestion niveau+1

- [ ] **Step 3 : Milestone commit**

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
git commit --allow-empty -m "milestone: S3B Inscription/Reinscription/Passage shipped

- 4 migrations DB (00028-00031) : matricule + RPCs + audit + stats/preview views
- 9 nouveaux composants @edukea/ui (Checkbox, Select, Textarea, DatePicker,
  FormField, RadioCards, SegmentedControl, Wizard, Stepper)
- 6 nouveaux hooks @edukea/shared
- 5 nouvelles routes apps/school (hub, wizard, reinscription, passage, fiche)
- Nav sidebar fixee : Inscription + Passage d'annee liens fonctionnels

MoMo hors V1 (Phase 2 strategie). PDF recu, campagne publique parents,
capacite classes, notifications : hors V1 (voir spec §14)."
```

---

## Auto-review (checklist appliquée à la spec)

**Spec coverage** :

- §2 (Contraintes) — Ledger source de vérité : couvert dans RPC enroll_new_student §Task 8 (opening balance + record_student_payment). Mobile-first : composants DS avec breakpoints par défaut. Anti-doublons search-first : Tasks 14 + 17. Réserve Notes/Bulletins : colonne `avg_yearly_grade` dans `v_year_advancement_preview` §Task 9.
- §3 (Décisions produit) — toutes couvertes.
- §4 (Routes & composants) — 5 routes créées, 9 composants DS créés.
- §5 (Wizard 5 étapes) — Tasks 14–16.
- §6 (Backend) — Tasks 6–9.
- §7 (Hub) — Task 13.
- §8 (Réinscription) — Task 17.
- §9 (Passage) — Task 18.
- §10 (Fiche) — Task 19.
- §10.bis (Attribution classes) — la logique "garder même section" est dans Task 18 (`extractSection` + suggestion sur bulk assign).
- §11 (Migrations) — 4/4 créées.
- §12 (DS additions) — 9/9 créés.

**Placeholder scan** : aucun TODO/TBD/fill-in dans les steps. Type-check requis à chaque commit.

**Type consistency** :
- `RecoveryStatus`, `StatusPill` : réutilisés du Sprint 3A.
- `EnrollmentFormState` : défini Task 14, utilisé Tasks 14–16.
- `AdvanceDecision`, `BulkAdvancePayload` : définis Task 12, utilisés Task 18.
- `AdvancementPreviewRow` : défini Task 11, utilisé Task 18.

**Dettes techniques notées** :

1. Fiche `/enrollment/[ssylId]` n'a pas encore l'édition des infos administratives — planifié V2.
2. StepClassroom : le `RadioCards` type d'élève n'écrit pas dans le state (V1 : le type_student_id est laissé à NULL — la RPC accepte). À wire proprement V2 quand la table `type_students` sera exposée.
3. Réinscription : l'édition inline de l'identité + famille de l'élève existant n'est pas dans le flow V1 (juste preview read-only). Marqué explicitement dans la Step 0.
4. Le PDF du reçu d'inscription : hors V1 (voir spec §14).
5. La suggestion "garder même section" dans le passage utilise un heuristique simple (dernier token du nom). V2 pourrait avoir un vrai champ `section` sur `classrooms`.

---

## Definition of Done

- [ ] Tous les commits mergés sur main
- [ ] `pnpm --filter @edukea/ui lint` PASS
- [ ] `pnpm --filter @edukea/ui test` PASS (≥ 13 tests)
- [ ] `pnpm --filter @edukea/shared lint` PASS
- [ ] `apps/school` tsc PASS
- [ ] http://localhost:4002/dashboard/enrollment fonctionnel (hub + wizard + réinscription + passage + fiche)
- [ ] Test end-to-end : créer un élève complet + un versement → visible dans `/dashboard/recovery/[ssyl_id]` et dans le cockpit
- [ ] Milestone commit posé

'use client';

import { useMemo } from 'react';
import { FormField, Select, RadioCards } from '@edukea/ui';
import {
  useRecoveryClasses,
  useSchoolStructure,
  useStudentTypes,
  useClassroomEffectiveFees,
  formatMoney,
} from '@edukea/shared';
import type { Currency } from '@edukea/shared';
import type { EnrollmentFormState } from '../_types';
import { Check, Users } from 'lucide-react';

/**
 * StepClassroom en 2 sous-etapes :
 *   1. Choix du niveau (dropdown)
 *   2. Choix de la classe (cards avec effectif de l'annee courante)
 */
export function StepClassroom({
  schoolId,
  schoolYearId,
  value,
  onChange,
  currency,
}: {
  schoolId: string | undefined;
  schoolYearId: string | undefined;
  value: EnrollmentFormState;
  onChange: (v: EnrollmentFormState) => void;
  currency: Currency;
}) {
  const { data: structure } = useSchoolStructure(schoolId);
  const { data: classesSummary } = useRecoveryClasses(schoolId, schoolYearId);
  const { data: studentTypes } = useStudentTypes(schoolId);

  const { data: effectiveFees, isLoading: feesLoading } = useClassroomEffectiveFees(
    value.classroomId || undefined,
    value.typeStudentId || undefined,
  );

  // Toutes les infos niveau et classroom depuis la structure
  const allLevels = useMemo(
    () => (structure?.tree ?? []).flatMap((c) => c.levels.map((l) => ({ ...l, cycleName: c.name }))),
    [structure],
  );

  // Deduire levelId de la classroom deja selectionnee (si l'user revient sur cette etape)
  const currentClassroom = useMemo(
    () => allLevels.flatMap((l) => l.classrooms).find((c) => c.id === value.classroomId),
    [allLevels, value.classroomId],
  );
  const selectedLevelId = currentClassroom?.level_id ?? value.levelId ?? '';

  const levelOptions = useMemo(
    () =>
      allLevels
        .sort((a, b) => a.order_by - b.order_by)
        .map((l) => ({ value: l.id, label: `${l.cycleName} · ${l.name}` })),
    [allLevels],
  );

  const classroomsOfLevel = useMemo(
    () => allLevels.find((l) => l.id === selectedLevelId)?.classrooms ?? [],
    [allLevels, selectedLevelId],
  );

  const studentTypeOptions = useMemo(
    () => (studentTypes ?? []).map((t) => ({ value: t.id, label: t.label })),
    [studentTypes],
  );

  const totalMandatory = (effectiveFees ?? [])
    .filter((f) => !['canteen', 'transport'].includes(f.category))
    .reduce((s, f) => s + f.amount, 0);

  // Effectif pour chaque classroom (0 si non present dans le summary de l'annee)
  const summaryByClassroom = useMemo(() => {
    const m = new Map<string, { n_students: number; solde_count: number; debute_count: number; impaye_count: number }>();
    for (const s of classesSummary ?? []) {
      m.set(s.classroom_id, {
        n_students: s.n_students,
        solde_count: s.solde_count,
        debute_count: s.debute_count,
        impaye_count: s.impaye_count,
      });
    }
    return m;
  }, [classesSummary]);

  return (
    <div className="flex flex-col gap-5">
      {/* Etape 1 : Niveau */}
      <FormField label="1. Niveau" required hint="Selectionne d'abord le niveau pour voir les classes disponibles">
        <Select
          options={levelOptions}
          placeholder="Choisir un niveau…"
          value={selectedLevelId}
          onChange={(e) => {
            const newLevelId = e.target.value;
            // reset classroom quand on change de niveau
            onChange({ ...value, levelId: newLevelId, classroomId: '' });
          }}
        />
      </FormField>

      {/* Etape 2 : Classes du niveau selectionne */}
      {selectedLevelId && (
        <FormField label="2. Classe" required>
          {classroomsOfLevel.length === 0 ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-body-sm text-amber-800">
              Aucune classe configuree pour ce niveau.
              Contactez le manager pour ajouter des classes dans <code className="rounded bg-amber-100 px-1 text-xs">/pedagogy/structure</code>.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {classroomsOfLevel.map((c) => {
                const stats = summaryByClassroom.get(c.id) ?? { n_students: 0, solde_count: 0, debute_count: 0, impaye_count: 0 };
                const active = value.classroomId === c.id;
                const withPayment = stats.solde_count + stats.debute_count;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onChange({ ...value, classroomId: c.id })}
                    className={`group flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all ${
                      active
                        ? 'border-primary bg-primary/[0.05] shadow-sm'
                        : 'border-line bg-white hover:border-primary/40 hover:bg-primary/[0.02]'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-display text-heading-sm font-semibold text-ink">{c.name}</span>
                      {active && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex items-center gap-1.5 text-body-xs text-ink-3">
                      <Users className="h-3 w-3" />
                      <span className="font-semibold text-ink-2">{stats.n_students}</span> eleve(s)
                    </div>
                    {stats.n_students > 0 && (
                      <div className="flex flex-wrap gap-1.5 text-caption">
                        <span className="rounded bg-green-100 px-1.5 py-0.5 font-semibold text-green-700">
                          {stats.solde_count} solde
                        </span>
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-700">
                          {withPayment - stats.solde_count} en cours
                        </span>
                        {stats.impaye_count > 0 && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 font-semibold text-red-700">
                            {stats.impaye_count} impaye
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </FormField>
      )}

      {/* Type d'eleve */}
      <FormField label="3. Type d'eleve">
        <RadioCards
          name="type_student"
          columns={3}
          options={studentTypeOptions}
          value={value.typeStudentId}
          onChange={(typeId) => onChange({ ...value, typeStudentId: typeId })}
        />
      </FormField>

      {/* Frais previsionnels */}
      {value.classroomId && value.typeStudentId && !feesLoading && (
        <div className="mt-1">
          {(effectiveFees ?? []).length === 0 ? (
            <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-sm text-red-800">
              <p className="mb-1 font-semibold">Inscription bloquée : aucun frais configuré pour cette combinaison classe × type d&apos;élève.</p>
              <p>
                Configurez les frais dans{' '}
                <a
                  href="/dashboard/pedagogy/fees"
                  className="font-semibold text-red-900 underline hover:text-red-700"
                >
                  Rentrée › Frais scolarité
                </a>{' '}
                avant de pouvoir inscrire cet élève.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-slate-50 p-4 text-sm">
              <p className="mb-3 font-medium text-ink">Frais a prevoir :</p>
              <ul className="space-y-1">
                {(effectiveFees ?? []).map((f, i) => (
                  <li key={`${f.label}-${i}`} className="flex justify-between text-ink-2">
                    <span>{f.label}</span>
                    <span className="font-mono">{formatMoney(f.amount, currency)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-line pt-2 font-semibold text-ink">
                <span>Total obligatoire</span>
                <span className="font-mono">{formatMoney(totalMandatory, currency)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

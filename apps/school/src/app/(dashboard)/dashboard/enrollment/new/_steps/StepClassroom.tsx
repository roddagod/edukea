'use client';

import { useMemo } from 'react';
import { FormField, Select, RadioCards } from '@edukea/ui';
import { useRecoveryClasses, useSchoolClassrooms, useStudentTypes, useClassroomEffectiveFees, formatMoney } from '@edukea/shared';
import type { Currency } from '@edukea/shared';
import type { EnrollmentFormState } from '../_types';

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
  const { data: allClassrooms } = useSchoolClassrooms(schoolId, schoolYearId);
  const { data: classesSummary } = useRecoveryClasses(schoolId, schoolYearId);
  const { data: studentTypes } = useStudentTypes(schoolId);

  const { data: effectiveFees, isLoading: feesLoading } = useClassroomEffectiveFees(
    value.classroomId || undefined,
    value.typeStudentId || undefined,
  );

  // Options triées par nom
  const classroomOptions = useMemo(
    () => (allClassrooms ?? []).map((c) => ({ value: c.id, label: c.name })),
    [allClassrooms],
  );

  const studentTypeOptions = useMemo(
    () => (studentTypes ?? []).map((t) => ({ value: t.id, label: t.label })),
    [studentTypes],
  );

  const selectedSummary = classesSummary?.find((c) => c.classroom_id === value.classroomId);

  const totalMandatory = (effectiveFees ?? [])
    .filter((f) => !['canteen', 'transport'].includes(f.category))
    .reduce((s, f) => s + f.amount, 0);

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
          options={studentTypeOptions}
          value={value.typeStudentId}
          onChange={(typeId) => onChange({ ...value, typeStudentId: typeId })}
        />
      </FormField>

      {value.classroomId && value.typeStudentId && !feesLoading && (
        <div className="mt-1">
          {(effectiveFees ?? []).length === 0 ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium mb-1">Aucun frais configuré pour cette combinaison classe × type d&apos;élève.</p>
              <p>
                Contactez le manager pour configurer les frais dans{' '}
                <code className="rounded bg-amber-100 px-1 text-xs">/pedagogy/fees</code>.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-slate-50 p-4 text-sm">
              <p className="mb-3 font-medium text-ink">Frais à prévoir :</p>
              <ul className="space-y-1">
                {(effectiveFees ?? []).map((f, i) => (
                  <li key={`${f.label}-${i}`} className="flex justify-between text-ink-2">
                    <span>{f.label}</span>
                    <span className="font-mono">{formatMoney(f.amount, currency)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-line pt-2 flex justify-between font-semibold text-ink">
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

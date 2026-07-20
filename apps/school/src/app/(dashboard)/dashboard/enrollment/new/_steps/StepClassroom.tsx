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

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

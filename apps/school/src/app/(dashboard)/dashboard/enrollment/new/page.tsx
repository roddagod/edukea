'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, RotateCcw, Save } from 'lucide-react';
import { PageHeader, Wizard, Card, Button } from '@edukea/ui';
import {
  useSchoolContext,
  useEnrollNewStudent,
  useEnrollmentDrafts,
  useUpsertEnrollmentDraft,
  useDeleteEnrollmentDraft,
  type EnrollmentDraft,
} from '@edukea/shared';
import { StepStudent } from './_steps/StepStudent';
import { StepFamily } from './_steps/StepFamily';
import { StepClassroom } from './_steps/StepClassroom';
import { StepFeesPayment } from './_steps/StepFeesPayment';
import { StepSummary } from './_steps/StepSummary';
import {
  DEFAULT_ENROLLMENT_STATE, isStepStudentValid, isStepFamilyValid,
  isStepClassroomValid, isStepFeesValid,
  type EnrollmentFormState,
} from './_types';

const STEPS = [
  { id: 'student', label: 'Fiche élève', shortLabel: 'Élève' },
  { id: 'family', label: 'Famille', shortLabel: 'Famille' },
  { id: 'classroom', label: 'Niveau & classe', shortLabel: 'Classe' },
  { id: 'fees', label: 'Frais & versement', shortLabel: 'Frais' },
  { id: 'summary', label: 'Récapitulatif', shortLabel: 'Récap' },
];

function formatTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d);
}

function draftStudentLabel(payload: Record<string, unknown>): string {
  const raw = (payload as { student?: { firstname?: string; lastname?: string } }).student;
  const first = raw?.firstname?.trim() ?? '';
  const last = raw?.lastname?.trim() ?? '';
  const name = `${last} ${first}`.trim();
  return name || 'Sans nom';
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `il y a ${diffHr}h`;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
}

export default function NewEnrollmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: ctx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });
  const schoolId = ctx?.current_school?.id;
  const schoolYearId = ctx?.current_year?.id;

  const [state, setState] = useState<EnrollmentFormState>(DEFAULT_ENROLLMENT_STATE);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [draftsDismissed, setDraftsDismissed] = useState(false);
  const enroll = useEnrollNewStudent();

  const drafts = useEnrollmentDrafts(schoolId, schoolYearId);
  const upsertDraft = useUpsertEnrollmentDraft();
  const deleteDraft = useDeleteEnrollmentDraft();

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
      case 0: return isStepStudentValid(state.student, state.typeStudentId);
      case 1: return isStepFamilyValid(state);
      case 2: return isStepClassroomValid(state);
      case 3: return isStepFeesValid(state);
      case 4: return true;
      default: return false;
    }
  })();

  // Draft auto-save (silencieux : ne bloque jamais l'utilisateur en cas d'erreur)
  const draftIdRef = useRef<string | undefined>(undefined);
  useEffect(() => { draftIdRef.current = draftId; }, [draftId]);

  const saveDraftSilently = useCallback(async () => {
    if (!schoolId || !schoolYearId) return;
    try {
      const res = await upsertDraft.mutateAsync({
        id: draftIdRef.current,
        schoolId,
        schoolYearId,
        payload: state as unknown as Record<string, unknown>,
      });
      if (!draftIdRef.current) {
        draftIdRef.current = res.id;
        setDraftId(res.id);
      }
      setLastSavedAt(new Date().toISOString());
    } catch {
      // silencieux : la feature draft ne doit jamais bloquer l'inscription
    }
  }, [schoolId, schoolYearId, state, upsertDraft]);

  const handleBack = useCallback(() => {
    void saveDraftSilently();
    setCurrent((c) => Math.max(0, c - 1));
  }, [saveDraftSilently]);

  const handleNext = useCallback(() => {
    void saveDraftSilently();
    setCurrent((c) => Math.min(STEPS.length - 1, c + 1));
  }, [saveDraftSilently]);

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
      // Nettoyage silencieux du draft
      if (draftIdRef.current) {
        try { await deleteDraft.mutateAsync({ id: draftIdRef.current }); } catch { /* silencieux */ }
      }
      router.push(`/dashboard/enrollment/${res.ssyl_id}${qs}`);
    } catch (e) {
      setError((e as Error).message ?? 'Erreur lors de l\'enregistrement.');
    }
  };

  const resumeDraft = useCallback((d: EnrollmentDraft) => {
    // Restore le state (best-effort : payload est du JSONB, on trust son shape)
    try {
      const restored = d.payload as unknown as EnrollmentFormState;
      setState({ ...DEFAULT_ENROLLMENT_STATE, ...restored });
      setDraftId(d.id);
      setLastSavedAt(d.updated_at);
      setCurrent(0);
      setDraftsDismissed(true);
    } catch {
      // Silencieux
    }
  }, []);

  const savedAtLabel = useMemo(() => formatTime(lastSavedAt), [lastSavedAt]);
  const showDraftsList = !draftsDismissed && (drafts.data?.length ?? 0) > 0;

  return (
    <>
      <div>
        <Link href={`/dashboard/enrollment${qs}`} className="mb-2 inline-flex items-center gap-1 text-body-sm font-semibold text-primary hover:opacity-80">
          <ChevronLeft className="h-4 w-4" /> Inscription
        </Link>
        <PageHeader title="Nouvel élève" sub={ctx?.current_school?.name && ctx.current_year?.name ? `${ctx.current_school.name} · ${ctx.current_year.name}` : '—'} />
      </div>

      {showDraftsList && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-display text-heading-sm font-semibold text-ink">Brouillons en cours</div>
              <div className="text-caption text-ink-3">Reprenez une inscription commencée précédemment.</div>
            </div>
            <button
              type="button"
              onClick={() => setDraftsDismissed(true)}
              className="text-caption font-semibold text-ink-3 hover:text-ink-2"
            >
              Masquer
            </button>
          </div>
          <ul className="divide-y divide-line-soft">
            {(drafts.data ?? []).map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06] text-primary">
                  <Save className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">{draftStudentLabel(d.payload)}</div>
                  <div className="text-caption text-ink-3">Modifié {formatRelative(d.updated_at)}</div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => resumeDraft(d)}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Reprendre
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Wizard
        steps={STEPS}
        currentIndex={current}
        isCurrentStepValid={isValid}
        isSubmitting={enroll.isPending}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
        submitLabel="Confirmer l'inscription"
      >
        {savedAtLabel && (
          <div className="mb-4 inline-flex items-center gap-1.5 text-caption text-ink-3">
            <Save className="h-3.5 w-3.5" />
            Brouillon sauvegardé à {savedAtLabel}
          </div>
        )}
        {current === 0 && <StepStudent schoolId={schoolId} qsSuffix={qs} value={state.student} onChange={(v) => setState({ ...state, student: v })} typeStudentId={state.typeStudentId} onTypeStudentChange={(id) => setState({ ...state, typeStudentId: id })} />}
        {current === 1 && <StepFamily schoolId={schoolId} value={state} onChange={setState} />}
        {current === 2 && <StepClassroom schoolId={schoolId} schoolYearId={schoolYearId} value={state} onChange={setState} />}
        {current === 3 && <StepFeesPayment schoolYearId={schoolYearId} value={state} onChange={setState} />}
        {current === 4 && <StepSummary value={state} />}
      </Wizard>

      {error && <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-body-sm text-destructive">{error}</div>}
    </>
  );
}

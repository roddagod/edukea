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

'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { PageHeader, Wizard, Card, FormField, Select, Checkbox, Input, SegmentedControl, RadioCards, Skeleton } from '@edukea/ui';
import { useSchoolContext, useReenrollStudent, useSchoolClassrooms, useClassroomEffectiveFees, useClassroomEffectiveInstallments, supabase } from '@edukea/shared';
import { FeesLinesTable } from '../../new/_steps/FeesLinesTable';
import { InstallmentsSchedule } from '../../new/_steps/InstallmentsSchedule';
import { PaymentAllocationPreview } from '../../new/_steps/PaymentAllocationPreview';

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

interface StudentBrief {
  id: string;
  firstname: string | null;
  lastname: string | null;
  matricule: string | null;
  school_id: string;
  student_type_id: string | null;
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
  const [studentTypeId, setStudentTypeId] = useState<string | null>(null);
  const [decision, setDecision] = useState<'advance' | 'repeat'>('advance');
  const [firstPaymentEnabled, setFirstPaymentEnabled] = useState(true);
  const [firstPayment, setFirstPayment] = useState<{ amount: number; source: 'cash' | 'bank_transfer' | 'internal'; memo: string }>({ amount: 0, source: 'cash', memo: '' });
  const [error, setError] = useState<string | null>(null);

  const { data: classrooms } = useSchoolClassrooms(schoolId, schoolYearId);
  const { data: effectiveFees, isLoading: feesLoading } = useClassroomEffectiveFees(
    classroomId || undefined,
    studentTypeId || undefined,
  );
  const { data: effectiveInstallments, isLoading: instLoading } = useClassroomEffectiveInstallments(
    classroomId || undefined,
    studentTypeId || undefined,
  );
  const reenroll = useReenrollStudent();

  // Fetch student (with student_type_id) + previous ssyl
  useEffect(() => {
    if (!params.studentId) return;
    (async () => {
      const { data: s } = await supabase
        .from('students')
        .select('id, firstname, lastname, matricule, school_id, student_type_id')
        .eq('id', params.studentId)
        .maybeSingle();
      const typedStudent = (s as StudentBrief | null) ?? null;
      setStudent(typedStudent);
      setStudentTypeId(typedStudent?.student_type_id ?? null);

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

  // Auto-set firstPayment.amount depuis la 1re échéance quand fees/installments arrivent
  useEffect(() => {
    if (effectiveFees && effectiveFees.length > 0 && firstPayment.amount === 0) {
      const firstInstAmt = effectiveInstallments?.[0]?.amount ?? 0;
      setFirstPayment((v) => ({ ...v, amount: firstInstAmt }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveFees, effectiveInstallments]);

  const mandatoryTotal = (effectiveFees ?? [])
    .filter((f) => !['canteen', 'transport'].includes(f.category))
    .reduce((s, f) => s + f.amount, 0);

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
        billed_total: mandatoryTotal,
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
          <div className="flex flex-col gap-5">
            {/* Loading */}
            {(feesLoading || instLoading) && <Skeleton className="h-48 w-full" />}

            {/* Warning: pas de classroomId ou studentTypeId */}
            {!feesLoading && !instLoading && classroomId && !studentTypeId && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-medium">Type d'élève non défini pour cet élève.</p>
                <p className="mt-1">Le type d'élève est nécessaire pour calculer les frais. Contactez un administrateur pour mettre à jour le profil.</p>
              </div>
            )}

            {/* Warning: frais non configurés */}
            {classroomId && studentTypeId && !feesLoading && !instLoading && (effectiveFees?.length ?? 0) === 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-medium">Aucun frais configuré pour cette classe × type d'élève.</p>
                <p className="mt-1">Contactez le manager pour configurer les frais dans <code>/pedagogy/fees</code>.</p>
              </div>
            )}

            {/* Tableau frais */}
            {!feesLoading && !instLoading && (effectiveFees?.length ?? 0) > 0 && (
              <>
                <Card>
                  <div className="mb-2 font-display text-heading-sm font-semibold text-ink">
                    Frais scolarité
                  </div>
                  <FeesLinesTable fees={effectiveFees!} />
                </Card>

                {/* Calendrier échéances */}
                {(effectiveInstallments?.length ?? 0) > 0 && (
                  <Card>
                    <div className="mb-2 font-display text-heading-sm font-semibold text-ink">
                      Calendrier de paiement
                    </div>
                    <InstallmentsSchedule installments={effectiveInstallments!} />
                  </Card>
                )}

                {/* Premier versement */}
                <Card>
                  <Checkbox
                    checked={firstPaymentEnabled}
                    onChange={(e) => setFirstPaymentEnabled(e.target.checked)}
                    label="Enregistrer un premier versement (recommandé)"
                  />
                  {firstPaymentEnabled && (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                      <FormField label="Note (ex : Reçu 001/2026)" className="sm:col-span-2">
                        <Input value={firstPayment.memo} onChange={(e) => setFirstPayment({ ...firstPayment, memo: e.target.value })} />
                      </FormField>
                    </div>
                  )}
                  {firstPaymentEnabled && firstPayment.amount > 0 && (effectiveInstallments?.length ?? 0) > 0 && (
                    <div className="mt-4">
                      <PaymentAllocationPreview
                        installments={effectiveInstallments!}
                        paymentAmount={firstPayment.amount}
                      />
                    </div>
                  )}
                </Card>

                {/* Récapitulatif total */}
                <div className="rounded-md border-2 border-primary/20 bg-primary/[0.03] p-4">
                  <div className="flex items-baseline justify-between">
                    <div className="text-body-sm font-semibold text-ink">Net à payer</div>
                    <div className="font-display text-heading-lg font-semibold tabular-nums text-primary">
                      {fmt(mandatoryTotal)} <span className="text-body-sm">FCFA</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Wizard>

      {error && <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-body-sm text-destructive">{error}</div>}
    </>
  );
}

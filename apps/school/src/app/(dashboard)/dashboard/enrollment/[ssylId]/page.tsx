'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, Coins, Plus } from 'lucide-react';
import { PageHeader, Card, Skeleton, Button, StatusPill } from '@edukea/ui';
import { useStudentDetail, useSchoolContext } from '@edukea/shared';
import { RecordPaymentDialog } from '@/components/RecordPaymentDialog';

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

export default function EnrollmentDetailPage() {
  const params = useParams<{ ssylId: string }>();
  const searchParams = useSearchParams();
  const [showPayment, setShowPayment] = useState(false);
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
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setShowPayment(true)}>
                <Plus className="h-4 w-4" /> Nouveau paiement
              </Button>
              <Link href={`/dashboard/recovery/${student.ssyl_id}${qs}`}>
                <Button variant="primary">
                  <Coins className="h-4 w-4" /> Gérer les versements
                </Button>
              </Link>
            </div>
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

      {student && (
        <RecordPaymentDialog
          ssylId={student.ssyl_id}
          studentName={student.student_name ?? undefined}
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
        />
      )}
    </>
  );
}

'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import {
  PageHeader,
  Card,
  StatusPill,
  Avatar,
  toneFromSeed,
  Skeleton,
  TxTableSkeleton,
} from '@edukea/ui';
import { useSchoolContext, useRecoveryStudents, useRecoveryClasses } from '@edukea/shared';

function fmtNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

export default function RecoveryClassPage() {
  const params = useParams<{ classroomId: string }>();
  const searchParams = useSearchParams();
  const { data: ctx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });
  const schoolId = ctx?.current_school?.id;
  const schoolYearId = ctx?.current_year?.id;

  const { data: allClasses } = useRecoveryClasses(schoolId, schoolYearId);
  const cls = allClasses?.find((c) => c.classroom_id === params.classroomId);

  const { data: pageData, isLoading } = useRecoveryStudents({
    schoolId,
    schoolYearId,
    classroomId: params.classroomId,
    page: 1,
    pageSize: 100, // une classe fait rarement > 70 élèves
    sort: 'remaining_desc',
  });

  const qs = (() => {
    const p = new URLSearchParams();
    const school = searchParams.get('school');
    const year = searchParams.get('year');
    if (school) p.set('school', school);
    if (year) p.set('year', year);
    return p.toString() ? `?${p.toString()}` : '';
  })();

  const backHref = cls?.level_id ? `/dashboard/recovery/level/${cls.level_id}${qs}` : `/dashboard/recovery${qs}`;
  const backLabel = cls?.level_name ? `Niveau ${cls.level_name}` : 'Recouvrement';

  return (
    <>
      <div>
        <Link href={backHref} className="mb-2 inline-flex items-center gap-1 text-body-sm font-semibold text-primary hover:opacity-80">
          <ChevronLeft className="h-4 w-4" /> {backLabel}
        </Link>
        <PageHeader
          title={cls ? `Classe ${cls.classroom_name ?? '—'}` : <Skeleton className="h-6 w-40" />}
          sub={
            cls
              ? `${cls.n_students} élèves · ${cls.solde_count} soldés · ${cls.debute_count} partiels · ${cls.impaye_count} impayés`
              : undefined
          }
        />
      </div>

      {isLoading ? (
        <TxTableSkeleton rows={20} />
      ) : (pageData?.rows.length ?? 0) === 0 ? (
        <Card>
          <div className="text-center text-body-sm text-ink-3">Aucun élève dans cette classe.</div>
        </Card>
      ) : (
        <Card className="p-0">
          <div className="hidden md:grid md:grid-cols-[40px_1.5fr_120px_120px_100px_28px] md:gap-3.5 bg-line-soft px-5 py-3 text-caption font-semibold text-ink-3">
            <span />
            <span>Élève</span>
            <span className="text-right">Facturé</span>
            <span className="text-right">Restant</span>
            <span>Statut</span>
            <span />
          </div>
          {pageData!.rows.map((r) => (
            <Link
              key={r.ssyl_id}
              href={`/dashboard/recovery/${r.ssyl_id}${qs}`}
              className="flex items-center gap-3 border-b border-line-soft px-4 py-3 text-body-sm transition-colors last:border-b-0 hover:bg-[#FBFCFE] active:bg-line-soft md:grid md:grid-cols-[40px_1.5fr_120px_120px_100px_28px] md:gap-3.5 md:px-5"
            >
              <Avatar
                initials={r.student_name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? '').join('')}
                tone={toneFromSeed(r.ssyl_id)}
                size="sm"
              />
              <div className="min-w-0 flex-1 md:flex-none">
                <div className="truncate font-semibold text-ink">{r.student_name}</div>
                {r.matricule && <div className="mt-0.5 text-caption text-ink-3">Matr. {r.matricule}</div>}
              </div>
              <div className="hidden font-display text-body-sm tabular-nums text-ink-3 md:block md:text-right">
                {fmtNumber(r.billed_initial)}
              </div>
              <div className="ml-auto font-display text-body-md font-semibold tabular-nums text-ink md:ml-0 md:text-right">
                {fmtNumber(r.remaining)}
              </div>
              <div className="hidden md:block">
                <StatusPill status={r.status} />
              </div>
              <div className="hidden text-ink-3 md:flex md:items-center md:justify-center">›</div>
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}

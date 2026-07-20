'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { UserPlus, ArrowRightLeft, TrendingUp } from 'lucide-react';
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

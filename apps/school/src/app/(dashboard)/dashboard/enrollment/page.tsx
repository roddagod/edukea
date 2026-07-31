'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { UserPlus, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { PageHeader, Card, Skeleton, Avatar, toneFromSeed } from '@edukea/ui';
import {
  useSchoolContext,
  useEnrollmentStats,
  useRecentEnrollments,
  type RecentEnrollmentRow,
} from '@edukea/shared';

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

function formatEnrollmentDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffHr < 24) return `il y a ${diffHr}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export default function EnrollmentHubPage() {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-64 w-full" /></div>}>
      <EnrollmentHubInner />
    </Suspense>
  );
}

function EnrollmentHubInner() {
  const searchParams = useSearchParams();
  const { data: ctx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });
  const schoolId = ctx?.current_school?.id;
  const schoolYearId = ctx?.current_year?.id;
  const { data: stats, isLoading } = useEnrollmentStats(schoolId, schoolYearId);
  const { data: recent, isLoading: isRecentLoading } = useRecentEnrollments(schoolId, schoolYearId, 10);

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
            <div className="font-display text-heading-sm font-semibold text-ink">Passage d&apos;année</div>
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

      {/* Dernières inscriptions */}
      <section className="mt-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-heading-sm font-semibold text-ink">Dernières inscriptions</h2>
        </div>

        <Card className="p-0">
          {isRecentLoading ? (
            <div className="divide-y divide-line-soft">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-1/2 rounded" />
                    <Skeleton className="h-3 w-1/3 rounded" />
                  </div>
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          ) : !recent || recent.length === 0 ? (
            <div className="px-4 py-8 text-center text-body-sm text-ink-3">
              Aucune inscription récente pour cette année.
            </div>
          ) : (
            <ul className="divide-y divide-line-soft">
              {recent.map((row: RecentEnrollmentRow) => {
                const isNew = row.enrollment_type === 'new';
                return (
                  <li key={row.ssyl_id}>
                    <Link
                      href={`/dashboard/enrollment/${row.ssyl_id}${qs}`}
                      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#FBFCFE]"
                    >
                      <Avatar
                        initials={initialsFrom(row.student_name) || '?'}
                        tone={toneFromSeed(row.ssyl_id)}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold text-ink">{row.student_name || '—'}</span>
                          <span
                            className={
                              isNew
                                ? 'inline-flex shrink-0 items-center rounded-md bg-brand-accent-soft px-1.5 py-0.5 text-caption font-semibold text-[#B45309]'
                                : 'inline-flex shrink-0 items-center rounded-md bg-[#DBEAFE] px-1.5 py-0.5 text-caption font-semibold text-[#1E40AF]'
                            }
                          >
                            {isNew ? 'Nouveau' : 'Réinscription'}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-caption text-ink-3">
                          {row.matricule && <span className="tabular-nums">{row.matricule}</span>}
                          {row.matricule && (row.classroom_name || row.created_at) && <span>·</span>}
                          {row.classroom_name && <span className="truncate">{row.classroom_name}</span>}
                          {row.classroom_name && row.created_at && <span>·</span>}
                          <span>{formatEnrollmentDate(row.created_at)}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right font-display text-body-md font-semibold tabular-nums text-ink">
                        {fmt(row.billed_total)}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>
    </>
  );
}

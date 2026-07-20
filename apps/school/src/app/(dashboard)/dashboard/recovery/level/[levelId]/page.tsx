'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { PageHeader, Card, Skeleton } from '@edukea/ui';
import { useSchoolContext, useRecoveryClasses, useRecoveryLevels } from '@edukea/shared';

function fmtNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

export default function RecoveryLevelPage() {
  const params = useParams<{ levelId: string }>();
  const searchParams = useSearchParams();
  const { data: ctx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });
  const schoolId = ctx?.current_school?.id;
  const schoolYearId = ctx?.current_year?.id;

  const { data: classes, isLoading } = useRecoveryClasses(schoolId, schoolYearId, params.levelId);
  const { data: levels } = useRecoveryLevels(schoolId, schoolYearId);
  const level = useMemo(() => levels?.find((l) => l.level_id === params.levelId), [levels, params.levelId]);

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
        <Link
          href={`/dashboard/recovery${qs}`}
          className="mb-2 inline-flex items-center gap-1 text-body-sm font-semibold text-primary hover:opacity-80"
        >
          <ChevronLeft className="h-4 w-4" /> Recouvrement
        </Link>
        <PageHeader
          title={`Niveau ${level?.level_name ?? '—'}`}
          sub={level?.cycle_name ? `${level.cycle_name} · ${level.n_students} élèves · ${level.n_classrooms} classes` : '—'}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (classes?.length ?? 0) === 0 ? (
        <Card>
          <div className="text-center text-body-sm text-ink-3">Aucune classe pour ce niveau.</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes!.map((c) => {
            const pctSolde = c.n_students > 0 ? Math.round((c.solde_count / c.n_students) * 100) : 0;
            return (
              <Link
                key={c.classroom_id}
                href={`/dashboard/recovery/class/${c.classroom_id}${qs}`}
                className="flex flex-col gap-2.5 rounded-xl border border-line bg-white p-4 shadow-flat transition-all hover:-translate-y-0.5 hover:shadow-hover"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-display text-heading-sm font-semibold text-ink">{c.classroom_name}</div>
                    <div className="truncate text-caption text-ink-3">{c.n_students} élèves</div>
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line-soft">
                  <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${pctSolde}%` }} />
                </div>
                <div className="flex items-center justify-between text-caption text-ink-3">
                  <div className="flex items-center gap-2">
                    {c.impaye_count > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" /> {c.impaye_count}
                      </span>
                    )}
                    {c.debute_count > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" /> {c.debute_count}
                      </span>
                    )}
                    {c.solde_count > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" /> {c.solde_count}
                      </span>
                    )}
                  </div>
                  <div className="font-display tabular-nums text-ink">
                    {fmtNumber(c.remaining_total)}
                    <span className="ml-0.5 text-caption text-ink-3">FCFA</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

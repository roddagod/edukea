'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, ArrowUpRight, GraduationCap, Coins } from 'lucide-react';
import {
  PageHeader,
  Card,
  StatusPill,
  Avatar,
  toneFromSeed,
  Skeleton,
  TxTableSkeleton,
  ProgressRing,
  Button,
} from '@edukea/ui';
import {
  useSchoolContext,
  useSchoolRecovery,
  useRecoveryLevels,
  useRecoveryStudents,
} from '@edukea/shared';
import { StudentSearchDropdown } from './_components/StudentSearchDropdown';

function fmtNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

/**
 * Barre segmentée R/J/V : rendu proportionnel des 3 statuts en une seule ligne.
 * Plus lisible et plus élégant qu'une barre uniforme + puces éparpillées.
 */
function StatusStripe({
  solde,
  debute,
  impaye,
  total,
}: {
  solde: number;
  debute: number;
  impaye: number;
  total: number;
}) {
  if (total <= 0) {
    return <div className="h-2 rounded-full bg-line-soft" />;
  }
  const pctS = (solde / total) * 100;
  const pctD = (debute / total) * 100;
  const pctI = (impaye / total) * 100;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-line-soft">
      {pctS > 0 && <div className="h-full bg-[#22C55E]" style={{ width: `${pctS}%` }} />}
      {pctD > 0 && <div className="h-full bg-brand-accent" style={{ width: `${pctD}%` }} />}
      {pctI > 0 && <div className="h-full bg-[#EF4444]" style={{ width: `${pctI}%` }} />}
    </div>
  );
}

export default function RecoveryHubPage() {
  const searchParams = useSearchParams();
  const { data: ctx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });
  const schoolId = ctx?.current_school?.id;
  const schoolYearId = ctx?.current_year?.id;

  const { data: recovery, isLoading: recoveryLoading } = useSchoolRecovery(schoolId, schoolYearId);
  const { data: levels, isLoading: levelsLoading } = useRecoveryLevels(schoolId, schoolYearId);
  const { data: topImpayes, isLoading: topLoading } = useRecoveryStudents({
    schoolId,
    schoolYearId,
    status: 'impaye',
    page: 1,
    pageSize: 8,
    sort: 'remaining_desc',
  });
  const { data: topDebute } = useRecoveryStudents({
    schoolId,
    schoolYearId,
    status: 'debute',
    page: 1,
    pageSize: 8,
    sort: 'remaining_desc',
  });

  const qsMap = new URLSearchParams();
  const schoolParam = searchParams.get('school');
  const yearParam = searchParams.get('year');
  if (schoolParam) qsMap.set('school', schoolParam);
  if (yearParam) qsMap.set('year', yearParam);
  const qs = qsMap.toString() ? `?${qsMap.toString()}` : '';
  const qsWithStatus = (status: string) => {
    const p = new URLSearchParams(qsMap);
    p.set('status', status);
    return `?${p.toString()}`;
  };

  const topList = (topImpayes?.rows.length ?? 0) > 0 ? topImpayes?.rows ?? [] : topDebute?.rows ?? [];
  const topLabel = (topImpayes?.rows.length ?? 0) > 0 ? 'Impayés à relancer' : 'Créances les plus élevées';

  const totalToCollect = recovery ? recovery.impaye_count + recovery.debute_count : 0;
  const totalStudents = recovery ? recovery.impaye_count + recovery.debute_count + recovery.solde_count : 0;

  return (
    <>
      <PageHeader
        title="Recouvrement"
        sub={
          ctx?.current_school?.name && ctx.current_year?.name
            ? `${ctx.current_school.name} · ${ctx.current_year.name}`
            : '—'
        }
      />

      {/* Search bar — jump direct vers une fiche eleve */}
      <StudentSearchDropdown schoolId={schoolId} schoolYearId={schoolYearId} qsSuffix={qs} />

      {/* HERO Recouvrement — grand bloc bleu Edukea avec ProgressRing */}
      {recoveryLoading ? (
        <Skeleton className="h-52 rounded-2xl" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-primary p-5 sm:p-6 md:p-7 text-white shadow-hero">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 12px 12px, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="relative grid grid-cols-1 items-center gap-6 md:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="mb-2 flex items-baseline gap-2 text-body-sm font-medium text-white/60">
                <span>À recouvrer</span>
                <span className="text-white/30">·</span>
                <strong className="font-semibold text-white">{ctx?.current_year?.name ?? ''}</strong>
              </div>
              <div className="font-display text-[40px] sm:text-[44px] md:text-[52px] font-bold leading-none tracking-tight">
                {fmtNumber(Number(recovery?.remaining_total ?? 0))}
                <span className="ml-1.5 font-sans text-body-md font-medium text-white/55">FCFA</span>
              </div>
              <div className="mt-4 flex flex-wrap items-baseline gap-3 border-t border-white/10 pt-3.5 text-body-sm text-white/80">
                <span>
                  <span className="font-display font-semibold text-white">{fmtNumber(totalToCollect)}</span> élèves à relancer
                </span>
                <span className="text-white/30">·</span>
                <span>
                  <span className="font-display font-bold text-[#86EFAC]">△</span>{' '}
                  <span className="font-display font-semibold text-white">
                    {Number(recovery?.recovery_pct ?? 0).toString().replace('.', ',')}%
                  </span>{' '}
                  déjà recouvré
                </span>
              </div>
              {/* Pills raccourci vers les listes filtrées */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/recovery/all${qsWithStatus('impaye')}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#EF4444]/20 px-3 py-1.5 text-body-xs font-semibold text-[#FCA5A5] transition-colors hover:bg-[#EF4444]/30"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                  {fmtNumber(recovery?.impaye_count ?? 0)} impayés
                </Link>
                <Link
                  href={`/dashboard/recovery/all${qsWithStatus('debute')}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent/20 px-3 py-1.5 text-body-xs font-semibold text-[#FCD34D] transition-colors hover:bg-brand-accent/30"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                  {fmtNumber(recovery?.debute_count ?? 0)} partiels
                </Link>
                <Link
                  href={`/dashboard/recovery/all${qsWithStatus('solde')}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/20 px-3 py-1.5 text-body-xs font-semibold text-[#86EFAC] transition-colors hover:bg-[#22C55E]/30"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                  {fmtNumber(recovery?.solde_count ?? 0)} soldés
                </Link>
              </div>
            </div>
            {/* Progress ring — reprend le style cockpit */}
            <div className="relative flex justify-center md:justify-end">
              <div className="relative">
                <svg width={180} height={180} viewBox="0 0 180 180" className="rotate-[-90deg]">
                  <circle cx={90} cy={90} r={78} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={14} />
                  <circle
                    cx={90}
                    cy={90}
                    r={78}
                    fill="none"
                    stroke="#F69F13"
                    strokeWidth={14}
                    strokeLinecap="round"
                    strokeDasharray={`${(Number(recovery?.recovery_pct ?? 0) / 100) * (2 * Math.PI * 78)} ${2 * Math.PI * 78}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-display text-[38px] font-bold leading-none text-white">
                    {Number(recovery?.recovery_pct ?? 0).toString().replace('.', ',')}
                    <span className="text-body-md font-medium text-white/70">%</span>
                  </div>
                  <div className="mt-0.5 text-caption text-white/60">recouvré</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRILLE NIVEAUX — cards élaborées avec stripe R/J/V */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <div className="font-display text-heading-md font-semibold text-ink">Par niveau</div>
            <div className="text-body-xs text-ink-3">Cliquer sur un niveau pour voir ses classes</div>
          </div>
          <Link
            href={`/dashboard/recovery/all${qs}`}
            className="inline-flex items-center gap-1 text-body-sm font-semibold text-primary hover:opacity-80"
          >
            Tous les élèves <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {levelsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : (levels?.length ?? 0) === 0 ? (
          <Card>
            <div className="text-center text-body-sm text-ink-3">Aucun niveau pour cette année scolaire.</div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {levels!.map((lv) => (
              <Link
                key={lv.level_id}
                href={`/dashboard/recovery/level/${lv.level_id}${qs}`}
                className="group flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-flat transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-hover"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06] text-primary transition-colors group-hover:bg-primary/10">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-display text-heading-sm font-semibold leading-tight text-ink">
                        {lv.level_name}
                      </div>
                      {lv.cycle_name && <div className="truncate text-caption text-ink-3">{lv.cycle_name}</div>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>

                <div className="flex items-baseline gap-2 text-body-xs text-ink-3">
                  <span className="font-display text-body-md font-semibold tabular-nums text-ink">{lv.n_students}</span>
                  <span>élèves · {lv.n_classrooms} classes</span>
                </div>

                {/* Stripe R/J/V */}
                <StatusStripe
                  solde={lv.solde_count}
                  debute={lv.debute_count}
                  impaye={lv.impaye_count}
                  total={lv.n_students}
                />

                <div className="mt-1 flex items-baseline justify-between border-t border-dashed border-line pt-2.5 text-caption text-ink-3">
                  <span>Restant</span>
                  <span className="font-display text-body-sm font-semibold tabular-nums text-ink">
                    {fmtNumber(lv.remaining_total)}
                    <span className="ml-0.5 text-caption font-medium text-ink-3">FCFA</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* TOP IMPAYÉS — rows avec left border colorée + CTA versement */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <div className="font-display text-heading-md font-semibold text-ink">{topLabel}</div>
            <div className="text-body-xs text-ink-3">Ouvrir la fiche pour enregistrer un versement</div>
          </div>
        </div>
        {topLoading ? (
          <TxTableSkeleton rows={6} />
        ) : topList.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
                <Coins className="h-6 w-6" />
              </div>
              <div className="font-display text-heading-sm font-semibold text-ink">Tous les élèves sont soldés</div>
              <div className="mt-1 text-body-xs text-ink-3">Excellente année scolaire pour {ctx?.current_school?.name}</div>
            </div>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-flat">
            {topList.map((r, i) => {
              const borderColor = r.status === 'impaye' ? '#EF4444' : '#F69F13';
              return (
                <Link
                  key={r.ssyl_id}
                  href={`/dashboard/recovery/${r.ssyl_id}${qs}`}
                  className={`group flex items-center gap-3 border-l-[3px] px-4 py-3.5 text-body-sm transition-colors hover:bg-[#FBFCFE] active:bg-line-soft ${
                    i > 0 ? 'border-t border-t-line-soft' : ''
                  }`}
                  style={{ borderLeftColor: borderColor }}
                >
                  <Avatar
                    initials={r.student_name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? '').join('')}
                    tone={toneFromSeed(r.ssyl_id)}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="truncate font-semibold text-ink">{r.student_name}</div>
                      <div className="shrink-0 text-right">
                        <div className="font-display text-body-md font-semibold tabular-nums text-ink">
                          {fmtNumber(r.remaining)}
                          <span className="ml-0.5 text-caption font-medium text-ink-3">FCFA</span>
                        </div>
                        {r.overdue_amount > 0 && (
                          <div className="mt-0.5 inline-flex rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 tabular-nums">
                            {fmtNumber(r.overdue_amount)} en retard
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <div className="truncate text-caption text-ink-3">
                        {r.classroom_name ?? '—'}
                        {r.matricule && <> · Matr. {r.matricule}</>}
                      </div>
                      <StatusPill status={r.status} className="shrink-0" />
                    </div>
                  </div>
                  <ChevronRight className="hidden h-4 w-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

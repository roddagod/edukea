'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, GraduationCap, CheckCircle2 } from 'lucide-react';
import { PageHeader, Card, Select, Button, Skeleton, Modal } from '@edukea/ui';
import {
  useSchoolContext,
  usePassageClassProgress,
  useFinalizeYearAdvancement,
  type PassageClassProgress,
} from '@edukea/shared';

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

/** Barre segmentee vert / orange / rouge / gris pour visualiser les decisions. */
function DecisionsStripe({ row }: { row: PassageClassProgress }) {
  const total = row.n_students;
  if (total <= 0) return <div className="h-2 rounded-full bg-line-soft" />;
  const pctA = (row.n_advance / total) * 100;
  const pctR = (row.n_repeat / total) * 100;
  const pctL = (row.n_leave / total) * 100;
  const remaining = Math.max(0, total - row.n_decided);
  const pctPending = (remaining / total) * 100;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-line-soft">
      {pctA > 0 && <div className="h-full bg-[#22C55E]" style={{ width: `${pctA}%` }} />}
      {pctR > 0 && <div className="h-full bg-brand-accent" style={{ width: `${pctR}%` }} />}
      {pctL > 0 && <div className="h-full bg-[#EF4444]" style={{ width: `${pctL}%` }} />}
      {pctPending > 0 && <div className="h-full bg-line" style={{ width: `${pctPending}%` }} />}
    </div>
  );
}

export default function PassageHubPage() {
  const searchParams = useSearchParams();
  const { data: ctx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });
  const schoolId = ctx?.current_school?.id;

  const [fromYearId, setFromYearId] = useState('');
  const [toYearId, setToYearId] = useState('');

  useEffect(() => {
    if (!ctx?.years || ctx.years.length === 0 || fromYearId) return;
    if (ctx.years.length >= 2) {
      // Par defaut : from = annee penultieme, to = annee la plus recente.
      // ctx.years est deja trie desc par date_start (annee courante en premier).
      setFromYearId(ctx.years[1]?.id ?? '');
      setToYearId(ctx.years[0]?.id ?? '');
    } else {
      setFromYearId(ctx.years[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.years]);

  const { data: progress, isLoading } = usePassageClassProgress(schoolId, fromYearId);
  const finalize = useFinalizeYearAdvancement();

  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<{ advance: number; repeat: number; leave: number; pending: number } | null>(null);

  const totals = useMemo(() => {
    if (!progress) return { students: 0, decided: 0, advance: 0, repeat: 0, leave: 0, pending: 0 };
    return progress.reduce(
      (acc, r) => ({
        students: acc.students + r.n_students,
        decided: acc.decided + r.n_decided,
        advance: acc.advance + r.n_advance,
        repeat: acc.repeat + r.n_repeat,
        leave: acc.leave + r.n_leave,
        pending: acc.pending + Math.max(0, r.n_students - r.n_decided),
      }),
      { students: 0, decided: 0, advance: 0, repeat: 0, leave: 0, pending: 0 },
    );
  }, [progress]);

  const allDecided = progress && progress.length > 0 && progress.every((r) => r.n_decided === r.n_students);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    const school = searchParams.get('school');
    const year = searchParams.get('year');
    if (school) p.set('school', school);
    if (year) p.set('year', year);
    return p.toString() ? `?${p.toString()}` : '';
  }, [searchParams]);

  const classroomHref = (classroomId: string) => {
    const p = new URLSearchParams();
    const school = searchParams.get('school');
    const year = searchParams.get('year');
    if (school) p.set('school', school);
    if (year) p.set('year', year);
    if (fromYearId) p.set('from', fromYearId);
    if (toYearId) p.set('to', toYearId);
    const suffix = p.toString() ? `?${p.toString()}` : '';
    return `/dashboard/enrollment/passage/${classroomId}${suffix}`;
  };

  const handleFinalize = async () => {
    setError(null);
    if (!schoolId || !fromYearId || !toYearId) {
      setError('Selectionner les annees source et cible.');
      return;
    }
    try {
      const res = await finalize.mutateAsync({ schoolId, fromYearId, toYearId });
      setResult(res);
      setConfirmOpen(false);
    } catch (e) {
      setError((e as Error).message ?? 'Erreur.');
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <div>
        <Link
          href={`/dashboard/enrollment${qs}`}
          className="mb-2 inline-flex items-center gap-1 text-body-sm font-semibold text-primary hover:opacity-80"
        >
          <ChevronLeft className="h-4 w-4" /> Inscription
        </Link>
        <PageHeader
          title="Passage d'annee"
          sub={
            progress
              ? `${fmt(totals.decided)}/${fmt(totals.students)} eleves decides · ${progress.length} classes`
              : 'Chargement…'
          }
        />
      </div>

      {/* Selecteurs d'annees */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-caption font-semibold text-ink-3">Annee source</label>
          <Select
            options={(ctx?.years ?? []).map((y) => ({ value: y.id, label: y.name }))}
            value={fromYearId}
            onChange={(e) => setFromYearId(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-caption font-semibold text-ink-3">Annee cible</label>
          <Select
            options={(ctx?.years ?? []).map((y) => ({ value: y.id, label: y.name }))}
            value={toYearId}
            onChange={(e) => setToYearId(e.target.value)}
          />
        </div>
      </div>

      {/* Recap global */}
      {progress && progress.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="p-3">
            <div className="text-caption text-ink-3">Passages</div>
            <div className="font-display text-heading-md font-semibold tabular-nums text-[#059669]">
              {fmt(totals.advance)}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-caption text-ink-3">Redoublements</div>
            <div className="font-display text-heading-md font-semibold tabular-nums text-[#B45309]">
              {fmt(totals.repeat)}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-caption text-ink-3">Departs</div>
            <div className="font-display text-heading-md font-semibold tabular-nums text-[#B91C1C]">
              {fmt(totals.leave)}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-caption text-ink-3">A decider</div>
            <div className="font-display text-heading-md font-semibold tabular-nums text-ink-3">
              {fmt(totals.pending)}
            </div>
          </Card>
        </div>
      )}

      {/* Grille classes */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <div className="font-display text-heading-md font-semibold text-ink">Classes de l'annee source</div>
            <div className="text-body-xs text-ink-3">Ouvrir une classe pour saisir les decisions du conseil</div>
          </div>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : (progress?.length ?? 0) === 0 ? (
          <Card>
            <div className="py-6 text-center text-body-sm text-ink-3">
              Aucune classe trouvee pour l'annee source selectionnee.
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {progress!.map((row) => {
              const pct = row.n_students > 0 ? Math.round((row.n_decided / row.n_students) * 100) : 0;
              const done = row.n_decided === row.n_students && row.n_students > 0;
              return (
                <Link
                  key={row.classroom_id}
                  href={classroomHref(row.classroom_id)}
                  className="group flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-flat transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-hover"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06] text-primary transition-colors group-hover:bg-primary/10">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-display text-heading-sm font-semibold leading-tight text-ink">
                          {row.classroom_name ?? '—'}
                        </div>
                        <div className="truncate text-caption text-ink-3">
                          {row.level_name ?? '—'}
                          {row.cycle_name ? ` · ${row.cycle_name}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {done && <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />}
                      <ChevronRight className="h-4 w-4 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 text-body-xs text-ink-3">
                    <span className="font-display text-body-md font-semibold tabular-nums text-ink">
                      {row.n_decided}
                    </span>
                    <span>/ {row.n_students} decides</span>
                    <span className="ml-auto font-semibold tabular-nums text-ink-2">{pct}%</span>
                  </div>

                  <DecisionsStripe row={row} />

                  <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-dashed border-line pt-2.5 text-caption">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                      <span className="font-semibold text-[#059669]">{row.n_advance}</span>
                      <span className="text-ink-3">passages</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                      <span className="font-semibold text-[#B45309]">{row.n_repeat}</span>
                      <span className="text-ink-3">redoub.</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                      <span className="font-semibold text-[#B91C1C]">{row.n_leave}</span>
                      <span className="text-ink-3">departs</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Finalisation */}
      <div className="flex flex-col items-stretch justify-between gap-3 border-t border-line pt-4 sm:flex-row sm:items-center">
        <div className="text-body-xs text-ink-3">
          {allDecided
            ? 'Toutes les classes ont ete decidees. Vous pouvez finaliser le passage.'
            : 'Le bouton de finalisation s\'active quand toutes les classes ont ete decidees.'}
        </div>
        <Button
          variant="accent"
          size="lg"
          onClick={() => setConfirmOpen(true)}
          disabled={!allDecided || finalize.isPending || !toYearId}
        >
          {finalize.isPending ? 'Finalisation…' : 'Finaliser le passage'}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-body-sm text-destructive">
          {error}
        </div>
      )}

      {/* Modal confirmation finalisation */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Finaliser le passage d'annee"
        description="Cette action va generer les inscriptions N+1 pour toutes les decisions advance / repeat. Elle est idempotente."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={finalize.isPending}>
              Annuler
            </Button>
            <Button variant="accent" onClick={handleFinalize} disabled={finalize.isPending}>
              {finalize.isPending ? 'Finalisation…' : 'Confirmer'}
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-body-sm text-ink-2">
          <div>
            <span className="font-semibold text-ink">{fmt(totals.advance)}</span> passages ·{' '}
            <span className="font-semibold text-ink">{fmt(totals.repeat)}</span> redoublements ·{' '}
            <span className="font-semibold text-ink">{fmt(totals.leave)}</span> departs
          </div>
          {totals.pending > 0 && (
            <div className="rounded-md border border-brand-accent/30 bg-brand-accent/5 p-2 text-body-xs text-[#B45309]">
              {fmt(totals.pending)} eleve(s) sans decision seront ignores.
            </div>
          )}
        </div>
      </Modal>

      {/* Modal resultat finalisation */}
      <Modal
        open={!!result}
        onClose={() => setResult(null)}
        title="Passage finalise"
        footer={
          <>
            <Link
              href={`/dashboard/enrollment${qs}`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:opacity-90"
            >
              Retour au hub
            </Link>
          </>
        }
      >
        {result && (
          <div className="space-y-2 text-body-sm text-ink-2">
            <div>
              <span className="font-semibold text-[#059669]">{result.advance}</span> passages generees ·{' '}
              <span className="font-semibold text-[#B45309]">{result.repeat}</span> redoublements ·{' '}
              <span className="font-semibold text-[#B91C1C]">{result.leave}</span> departs ·{' '}
              {result.pending} en attente
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

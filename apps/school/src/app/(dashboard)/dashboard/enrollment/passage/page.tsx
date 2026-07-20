'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { PageHeader, Card, Select, Checkbox, SearchInput, Button, Skeleton, StatusPill } from '@edukea/ui';
import {
  useSchoolContext, useYearAdvancementPreview, useSchoolClassrooms, useBulkAdvanceYear,
  type AdvanceDecision, type BulkAdvancePlanEntry, type AdvancementPreviewRow,
} from '@edukea/shared';

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

// Extraction section (dernier token du nom classe) pour matcher au niveau+1
function extractSection(name: string | null | undefined): string | null {
  if (!name) return null;
  const m = name.match(/(\S+)\s*$/);
  return m ? m[1] : null;
}

export default function PassagePage() {
  const searchParams = useSearchParams();
  const { data: ctx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });
  const schoolId = ctx?.current_school?.id;

  const [fromYearId, setFromYearId] = useState('');
  const [toYearId, setToYearId] = useState('');

  useEffect(() => {
    if (ctx?.years && ctx.years.length >= 2 && !fromYearId) {
      // Par défaut : from = année N-1, to = année courante
      setFromYearId(ctx.years[1]?.id ?? '');
      setToYearId(ctx.years[0]?.id ?? '');
    } else if (ctx?.years && ctx.years.length === 1 && !fromYearId) {
      setFromYearId(ctx.years[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.years]);

  const { data: preview, isLoading } = useYearAdvancementPreview(schoolId, fromYearId);
  const { data: targetClassrooms } = useSchoolClassrooms(schoolId, toYearId);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [plan, setPlan] = useState<Record<string, { decision: AdvanceDecision; target_classroom_id?: string }>>({});
  const [search, setSearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<AdvanceDecision | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ advance: number; repeat: number; leave: number; pending: number } | null>(null);

  const advance = useBulkAdvanceYear();

  // Suggestion classe cible : garder la même section
  const targetClassByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of targetClassrooms ?? []) map.set(c.name, c.id);
    return map;
  }, [targetClassrooms]);

  // Initialiser plan avec suggestion pour chaque row (une seule fois quand preview arrive)
  useEffect(() => {
    if (!preview || Object.keys(plan).length > 0) return;
    const init: Record<string, { decision: AdvanceDecision; target_classroom_id?: string }> = {};
    for (const r of preview) {
      const section = extractSection(r.from_classroom_name);
      // Chercher une classe du niveau suivant finissant par la même section
      const target = (targetClassrooms ?? []).find((c) => (!section || c.name.endsWith(section)) && r.suggested_level_id ? c.name.includes(r.from_level_name ?? '') : true);
      init[r.from_ssyl_id] = { decision: 'advance', target_classroom_id: target?.id };
    }
    setPlan(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, targetClassrooms]);

  const filteredRows = useMemo(() => {
    if (!preview) return [] as AdvancementPreviewRow[];
    const q = search.trim().toLowerCase();
    return preview.filter((r) => {
      if (decisionFilter !== 'all' && plan[r.from_ssyl_id]?.decision !== decisionFilter) return false;
      if (!q) return true;
      return (r.student_name?.toLowerCase().includes(q) || r.matricule?.toLowerCase().includes(q));
    });
  }, [preview, search, decisionFilter, plan]);

  const bulkAssign = (decision: AdvanceDecision) => {
    setPlan((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(selected)) if (selected[id]) next[id] = { ...next[id], decision };
      return next;
    });
  };

  const bulkAssignClassroom = (classroomId: string) => {
    setPlan((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(selected)) if (selected[id]) next[id] = { ...next[id], target_classroom_id: classroomId };
      return next;
    });
  };

  const handleConfirm = async () => {
    setError(null);
    if (!schoolId || !fromYearId || !toYearId) { setError('Sélectionner les années.'); return; }
    const entries: BulkAdvancePlanEntry[] = Object.entries(plan).map(([ssylId, p]) => ({
      ssyl_id: ssylId,
      decision: p.decision,
      target_classroom_id: (p.decision === 'advance' || p.decision === 'repeat') ? p.target_classroom_id : undefined,
    }));
    if (entries.length === 0) { setError('Aucun élève à passer.'); return; }
    try {
      const res = await advance.mutateAsync({ school_id: schoolId, from_year_id: fromYearId, to_year_id: toYearId, plan: entries });
      setResult(res);
    } catch (e) {
      setError((e as Error).message ?? 'Erreur.');
    }
  };

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
        <PageHeader title="Passage d'année" sub={`${preview?.length ?? 0} élèves à traiter`} />
      </div>

      {result ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="font-display text-heading-lg font-semibold text-ink">Passage terminé</div>
            <div className="text-body-sm text-ink-3">
              <span className="font-semibold text-[#059669]">{result.advance}</span> passages · <span className="font-semibold text-[#B45309]">{result.repeat}</span> redoublements · <span className="font-semibold text-[#B91C1C]">{result.leave}</span> départs · {result.pending} en attente
            </div>
            <Link href={`/dashboard/enrollment${qs}`} className="mt-2 inline-block rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white">Retour au hub</Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Sélecteurs années */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              options={(ctx?.years ?? []).map((y) => ({ value: y.id, label: `De ${y.name}` }))}
              value={fromYearId}
              onChange={(e) => setFromYearId(e.target.value)}
            />
            <Select
              options={(ctx?.years ?? []).map((y) => ({ value: y.id, label: `Vers ${y.name}` }))}
              value={toYearId}
              onChange={(e) => setToYearId(e.target.value)}
            />
          </div>

          {/* Filtres */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full sm:max-w-sm">
              <SearchInput value={search} onChange={setSearch} placeholder="Rechercher (nom, matricule)…" />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Toutes décisions' },
                { value: 'advance', label: 'Passage' },
                { value: 'repeat', label: 'Redoublement' },
                { value: 'leave', label: 'Départ' },
                { value: 'pending', label: 'En attente' },
              ]}
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value as AdvanceDecision | 'all')}
            />
          </div>

          {/* Actions bulk */}
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-line-soft/40 p-3">
            <span className="text-body-xs text-ink-3">Sélection en masse :</span>
            <Button variant="secondary" size="sm" onClick={() => bulkAssign('advance')}>→ Passage</Button>
            <Button variant="secondary" size="sm" onClick={() => bulkAssign('repeat')}>→ Redoublement</Button>
            <Button variant="secondary" size="sm" onClick={() => bulkAssign('leave')}>→ Départ</Button>
            <span className="ml-2 text-body-xs text-ink-3">Classe cible :</span>
            <div className="min-w-[160px]">
              <Select
                options={[{ value: '', label: '—' }, ...(targetClassrooms ?? []).map((c) => ({ value: c.id, label: c.name }))]}
                value=""
                onChange={(e) => e.target.value && bulkAssignClassroom(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : (
            <Card className="p-0">
              <div className="max-h-[70vh] overflow-y-auto">
                <table className="w-full text-body-sm">
                  <thead className="sticky top-0 bg-line-soft text-caption font-semibold text-ink-3">
                    <tr>
                      <th className="w-10 px-3 py-2" />
                      <th className="px-3 py-2 text-left">Élève</th>
                      <th className="px-3 py-2 text-left">Classe N</th>
                      <th className="px-3 py-2 text-left">Décision</th>
                      <th className="px-3 py-2 text-left">Classe N+1</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r) => {
                      const p = plan[r.from_ssyl_id] ?? { decision: 'pending' as AdvanceDecision, target_classroom_id: undefined };
                      return (
                        <tr key={r.from_ssyl_id} className="border-b border-line-soft">
                          <td className="px-3 py-2">
                            <Checkbox
                              checked={!!selected[r.from_ssyl_id]}
                              onChange={(e) => setSelected((s) => ({ ...s, [r.from_ssyl_id]: e.target.checked }))}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-semibold text-ink">{r.student_name}</div>
                            {r.matricule && <div className="text-caption text-ink-3">Matr. {r.matricule}</div>}
                          </td>
                          <td className="px-3 py-2 text-body-xs text-ink-2">{r.from_classroom_name ?? '—'}</td>
                          <td className="px-3 py-2">
                            <Select
                              options={[
                                { value: 'advance', label: 'Passage' },
                                { value: 'repeat', label: 'Redoublement' },
                                { value: 'leave', label: 'Départ' },
                                { value: 'pending', label: 'En attente' },
                              ]}
                              value={p.decision}
                              onChange={(e) => setPlan((prev) => ({ ...prev, [r.from_ssyl_id]: { ...prev[r.from_ssyl_id], decision: e.target.value as AdvanceDecision } }))}
                            />
                          </td>
                          <td className="px-3 py-2">
                            {(p.decision === 'advance' || p.decision === 'repeat') ? (
                              <Select
                                options={[{ value: '', label: '—' }, ...(targetClassrooms ?? []).map((c) => ({ value: c.id, label: c.name }))]}
                                value={p.target_classroom_id ?? ''}
                                onChange={(e) => setPlan((prev) => ({ ...prev, [r.from_ssyl_id]: { ...prev[r.from_ssyl_id], target_classroom_id: e.target.value } }))}
                              />
                            ) : (
                              <span className="text-caption text-ink-3">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="flex items-center justify-between border-t border-line pt-4">
            <div className="text-body-xs text-ink-3">
              {Object.keys(plan).length} élèves prêts · <span className="font-semibold text-ink">{Object.values(plan).filter((p) => p.decision === 'advance').length}</span> passages
            </div>
            <Button variant="primary" size="lg" onClick={handleConfirm} disabled={advance.isPending}>
              {advance.isPending ? 'Enregistrement…' : 'Confirmer les décisions'}
            </Button>
          </div>
          {error && <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-body-sm text-destructive">{error}</div>}
        </>
      )}
    </>
  );
}

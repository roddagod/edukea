'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Save } from 'lucide-react';
import { PageHeader, Card, Select, Button, Skeleton, Textarea } from '@edukea/ui';
import {
  useSchoolContext,
  useYearAdvancementPreview,
  useSchoolClassrooms,
  useSaveClassTransitions,
  usePassageClassProgress,
  type AdvanceDecision,
  type SaveTransitionsEntry,
  type AdvancementPreviewRow,
} from '@edukea/shared';

// Extraction section (dernier token du nom classe) pour matcher au niveau+1
function extractSection(name: string | null | undefined): string | null {
  if (!name) return null;
  const m = name.match(/(\S+)\s*$/);
  return m ? m[1] : null;
}

interface PlanEntry {
  decision: AdvanceDecision;
  target_classroom_id?: string;
  note?: string;
}

export default function PassageClassroomPage() {
  const params = useParams<{ classroomId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: ctx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });
  const schoolId = ctx?.current_school?.id;

  const fromYearParam = searchParams.get('from') ?? '';
  const toYearParam = searchParams.get('to') ?? '';

  const [fromYearId, setFromYearId] = useState<string>(fromYearParam);
  const [toYearId, setToYearId] = useState<string>(toYearParam);

  useEffect(() => {
    if (!ctx?.years || ctx.years.length === 0) return;
    if (!fromYearId && ctx.years.length >= 2) {
      setFromYearId(ctx.years[1]?.id ?? '');
    } else if (!fromYearId) {
      setFromYearId(ctx.years[0].id);
    }
    if (!toYearId) setToYearId(ctx.years[0]?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.years]);

  const { data: preview, isLoading } = useYearAdvancementPreview(schoolId, fromYearId);
  const { data: progress } = usePassageClassProgress(schoolId, fromYearId);
  const { data: targetClassrooms } = useSchoolClassrooms(schoolId, toYearId);
  const saveTransitions = useSaveClassTransitions();

  // Filtrer le preview sur la classe demandee
  const rows = useMemo(() => {
    if (!preview) return [] as AdvancementPreviewRow[];
    return preview.filter((r) => r.from_classroom_id === params.classroomId);
  }, [preview, params.classroomId]);

  const classroomMeta = useMemo(() => {
    return progress?.find((r) => r.classroom_id === params.classroomId) ?? null;
  }, [progress, params.classroomId]);

  const [plan, setPlan] = useState<Record<string, PlanEntry>>({});
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Init plan avec suggestion target classroom pour chaque row (par section)
  useEffect(() => {
    if (initialized || rows.length === 0) return;
    const init: Record<string, PlanEntry> = {};
    for (const r of rows) {
      const section = extractSection(r.from_classroom_name);
      const target = (targetClassrooms ?? []).find(
        (c) => (!section || c.name.endsWith(section)) && r.from_level_name && c.name.includes(r.from_level_name),
      );
      init[r.from_ssyl_id] = { decision: 'advance', target_classroom_id: target?.id };
    }
    setPlan(init);
    setInitialized(true);
  }, [rows, targetClassrooms, initialized]);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    const school = searchParams.get('school');
    const year = searchParams.get('year');
    if (school) p.set('school', school);
    if (year) p.set('year', year);
    if (fromYearId) p.set('from', fromYearId);
    if (toYearId) p.set('to', toYearId);
    return p.toString() ? `?${p.toString()}` : '';
  }, [searchParams, fromYearId, toYearId]);

  const backHref = (() => {
    const p = new URLSearchParams();
    const school = searchParams.get('school');
    const year = searchParams.get('year');
    if (school) p.set('school', school);
    if (year) p.set('year', year);
    if (fromYearId) p.set('from', fromYearId);
    if (toYearId) p.set('to', toYearId);
    return `/dashboard/enrollment/passage${p.toString() ? `?${p.toString()}` : ''}`;
  })();

  const bulkDecision = (decision: AdvanceDecision) => {
    setPlan((prev) => {
      const next = { ...prev };
      for (const r of rows) next[r.from_ssyl_id] = { ...next[r.from_ssyl_id], decision };
      return next;
    });
  };

  const bulkTarget = (classroomId: string) => {
    setPlan((prev) => {
      const next = { ...prev };
      for (const r of rows) next[r.from_ssyl_id] = { ...next[r.from_ssyl_id], target_classroom_id: classroomId };
      return next;
    });
  };

  const handleSave = async () => {
    setError(null);
    if (!schoolId || !fromYearId || !toYearId) {
      setError('Selectionner les annees source et cible.');
      return;
    }
    const entries: SaveTransitionsEntry[] = rows.map((r) => {
      const p = plan[r.from_ssyl_id] ?? { decision: 'pending' as AdvanceDecision };
      const needsTarget = p.decision === 'advance' || p.decision === 'repeat';
      return {
        ssyl_id: r.from_ssyl_id,
        decision: p.decision,
        target_classroom_id: needsTarget ? p.target_classroom_id : undefined,
        note: p.note?.trim() ? p.note.trim() : undefined,
      };
    });
    if (entries.length === 0) {
      setError('Aucun eleve dans cette classe.');
      return;
    }
    try {
      await saveTransitions.mutateAsync({ schoolId, fromYearId, toYearId, entries });
      router.push(backHref);
    } catch (e) {
      setError((e as Error).message ?? 'Erreur.');
    }
  };

  const nStudents = rows.length;
  const nDecided = classroomMeta?.n_decided ?? 0;

  const classroomTitle = classroomMeta?.classroom_name ?? rows[0]?.from_classroom_name ?? 'Classe';

  return (
    <>
      <div>
        <Link
          href={backHref}
          className="mb-2 inline-flex items-center gap-1 text-body-sm font-semibold text-primary hover:opacity-80"
        >
          <ChevronLeft className="h-4 w-4" /> Passage d'annee
        </Link>
        <PageHeader
          title={`Passage — ${classroomTitle}`}
          sub={
            classroomMeta
              ? `${classroomMeta.level_name ?? '—'} · ${nStudents} eleves · ${nDecided}/${nStudents} decides`
              : `${nStudents} eleves`
          }
        />
      </div>

      {/* Selecteurs annees */}
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

      {/* Hint */}
      <div className="rounded-md border border-brand-accent/30 bg-brand-accent/5 p-3 text-body-xs text-[#B45309]">
        Les decisions deja saisies pour cette classe seront reappliquees lors de la sauvegarde.
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-line-soft/40 p-3">
        <span className="text-body-xs text-ink-3">Marquer tout :</span>
        <Button variant="secondary" size="sm" onClick={() => bulkDecision('advance')}>
          Passer
        </Button>
        <Button variant="secondary" size="sm" onClick={() => bulkDecision('repeat')}>
          Redoubler
        </Button>
        <Button variant="secondary" size="sm" onClick={() => bulkDecision('leave')}>
          Depart
        </Button>
        <span className="ml-2 text-body-xs text-ink-3">Classe cible :</span>
        <div className="min-w-[180px]">
          <Select
            options={[
              { value: '', label: '—' },
              ...(targetClassrooms ?? []).map((c) => ({ value: c.id, label: c.name })),
            ]}
            value=""
            onChange={(e) => e.target.value && bulkTarget(e.target.value)}
          />
        </div>
      </div>

      {/* Liste eleves */}
      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : rows.length === 0 ? (
        <Card>
          <div className="py-6 text-center text-body-sm text-ink-3">
            Aucun eleve trouve pour cette classe.
          </div>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden p-0 sm:block">
            <div className="max-h-[65vh] overflow-y-auto">
              <table className="w-full text-body-sm">
                <thead className="sticky top-0 bg-line-soft text-caption font-semibold text-ink-3">
                  <tr>
                    <th className="px-3 py-2 text-left">Eleve</th>
                    <th className="px-3 py-2 text-left">Decision</th>
                    <th className="px-3 py-2 text-left">Classe cible</th>
                    <th className="px-3 py-2 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const p = plan[r.from_ssyl_id] ?? { decision: 'pending' as AdvanceDecision };
                    const showTarget = p.decision === 'advance' || p.decision === 'repeat';
                    return (
                      <tr key={r.from_ssyl_id} className="border-b border-line-soft align-top">
                        <td className="px-3 py-2">
                          <div className="font-semibold text-ink">{r.student_name}</div>
                          {r.matricule && <div className="text-caption text-ink-3">Matr. {r.matricule}</div>}
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            options={[
                              { value: 'advance', label: 'Passage' },
                              { value: 'repeat', label: 'Redoublement' },
                              { value: 'leave', label: 'Depart' },
                              { value: 'pending', label: 'En attente' },
                            ]}
                            value={p.decision}
                            onChange={(e) =>
                              setPlan((prev) => ({
                                ...prev,
                                [r.from_ssyl_id]: { ...prev[r.from_ssyl_id], decision: e.target.value as AdvanceDecision },
                              }))
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          {showTarget ? (
                            <Select
                              options={[
                                { value: '', label: '—' },
                                ...(targetClassrooms ?? []).map((c) => ({ value: c.id, label: c.name })),
                              ]}
                              value={p.target_classroom_id ?? ''}
                              onChange={(e) =>
                                setPlan((prev) => ({
                                  ...prev,
                                  [r.from_ssyl_id]: { ...prev[r.from_ssyl_id], target_classroom_id: e.target.value },
                                }))
                              }
                            />
                          ) : (
                            <span className="text-caption text-ink-3">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Textarea
                            rows={1}
                            placeholder="Note (optionnel)"
                            value={p.note ?? ''}
                            onChange={(e) =>
                              setPlan((prev) => ({
                                ...prev,
                                [r.from_ssyl_id]: { ...prev[r.from_ssyl_id], note: e.target.value },
                              }))
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {rows.map((r) => {
              const p = plan[r.from_ssyl_id] ?? { decision: 'pending' as AdvanceDecision };
              const showTarget = p.decision === 'advance' || p.decision === 'repeat';
              return (
                <Card key={r.from_ssyl_id}>
                  <div className="space-y-3">
                    <div>
                      <div className="font-semibold text-ink">{r.student_name}</div>
                      {r.matricule && <div className="text-caption text-ink-3">Matr. {r.matricule}</div>}
                    </div>
                    <div>
                      <label className="mb-1 block text-caption font-semibold text-ink-3">Decision</label>
                      <Select
                        options={[
                          { value: 'advance', label: 'Passage' },
                          { value: 'repeat', label: 'Redoublement' },
                          { value: 'leave', label: 'Depart' },
                          { value: 'pending', label: 'En attente' },
                        ]}
                        value={p.decision}
                        onChange={(e) =>
                          setPlan((prev) => ({
                            ...prev,
                            [r.from_ssyl_id]: { ...prev[r.from_ssyl_id], decision: e.target.value as AdvanceDecision },
                          }))
                        }
                      />
                    </div>
                    {showTarget && (
                      <div>
                        <label className="mb-1 block text-caption font-semibold text-ink-3">Classe cible</label>
                        <Select
                          options={[
                            { value: '', label: '—' },
                            ...(targetClassrooms ?? []).map((c) => ({ value: c.id, label: c.name })),
                          ]}
                          value={p.target_classroom_id ?? ''}
                          onChange={(e) =>
                            setPlan((prev) => ({
                              ...prev,
                              [r.from_ssyl_id]: { ...prev[r.from_ssyl_id], target_classroom_id: e.target.value },
                            }))
                          }
                        />
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-caption font-semibold text-ink-3">Note</label>
                      <Textarea
                        rows={2}
                        placeholder="Note (optionnel)"
                        value={p.note ?? ''}
                        onChange={(e) =>
                          setPlan((prev) => ({
                            ...prev,
                            [r.from_ssyl_id]: { ...prev[r.from_ssyl_id], note: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Action bar */}
      <div className="flex flex-col items-stretch justify-between gap-3 border-t border-line pt-4 sm:flex-row sm:items-center">
        <div className="text-body-xs text-ink-3">
          {rows.length} eleves · sauvegarde uniquement pour cette classe
        </div>
        <Button
          variant="accent"
          size="lg"
          onClick={handleSave}
          disabled={saveTransitions.isPending || rows.length === 0}
        >
          <Save className="h-4 w-4" />
          {saveTransitions.isPending ? 'Enregistrement…' : 'Enregistrer les decisions de cette classe'}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-body-sm text-destructive">
          {error}
        </div>
      )}
    </>
  );
}

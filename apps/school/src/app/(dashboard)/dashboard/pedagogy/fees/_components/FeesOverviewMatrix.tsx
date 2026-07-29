'use client';

import { useFeesOverviewMatrix, useStudentTypes, useHydrateFeesFromTemplate, type FeesMatrixRow } from '@edukea/shared';
import { Button, Skeleton } from '@edukea/ui';
import { CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Props { schoolId: string; }

const XAF = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function FeesOverviewMatrix({ schoolId }: Props) {
  const { data: matrix, isLoading: mL } = useFeesOverviewMatrix(schoolId);
  const { data: types, isLoading: tL } = useStudentTypes(schoolId);
  const hydrate = useHydrateFeesFromTemplate();

  if (mL || tL) return <Skeleton className="h-64 w-full" />;
  if (!matrix?.length) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
        Aucun niveau ou type d&apos;élève.{' '}
        <Link href="/dashboard/pedagogy/structure" className="text-orange-600 underline">Configurez d&apos;abord la structure</Link>{' '}
        et{' '}
        <Link href="/dashboard/pedagogy/student-types" className="text-orange-600 underline">les types d&apos;élèves</Link>.
      </div>
    );
  }

  const emptyCount = matrix.filter((r) => r.lines_count === 0).length;

  // Pivot : lignes = niveaux uniques, colonnes = types
  const levels = Array.from(
    new Map(matrix.map((r) => [r.level_id, { id: r.level_id, name: r.level_name, order: r.level_order }])).values()
  ).sort((a, b) => a.order - b.order);

  const cell = (levelId: string, typeId: string): FeesMatrixRow | undefined =>
    matrix.find((r) => r.level_id === levelId && r.student_type_id === typeId);

  const typeCount = (types ?? []).length;

  return (
    <div className="space-y-2">
      {emptyCount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5">
          <Sparkles className="h-4 w-4 flex-shrink-0 text-orange-600" />
          <p className="flex-1 text-sm text-orange-900">
            <strong>{emptyCount}</strong> combinaison{emptyCount > 1 ? 's' : ''} à configurer.
          </p>
          <Button
            size="sm"
            onClick={async () => {
              if (!confirm(`Créer les frais par défaut pour ${emptyCount} combinaison(s) ?`)) return;
              try {
                const res = await hydrate.mutateAsync({ schoolId });
                alert(`✓ ${res.combos_hydrated} combinaisons hydratées (${res.lines_created} lignes + ${res.installments_created} échéances). Éditez les cas particuliers ensuite.`);
              } catch (e) {
                alert(e instanceof Error ? e.message : 'Erreur');
              }
            }}
            disabled={hydrate.isPending}
          >
            {hydrate.isPending ? 'Hydratation…' : 'Hydrater par défaut'}
          </Button>
        </div>
      )}
      {typeCount > 3 && (
        <p className="text-right text-xs text-slate-400 sm:hidden">Faites défiler horizontalement →</p>
      )}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="sticky top-0 z-10 border-b-2 border-slate-200 bg-slate-50">
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-slate-500">Niveau</th>
              {(types ?? []).map((t) => (
                <th key={t.id} className="px-4 py-2.5 text-left text-xs font-medium uppercase text-slate-500">{t.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {levels.map((l, idx) => (
              <tr key={l.id} className={`border-b last:border-none hover:bg-orange-50/50 ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                <td className="px-4 py-2.5">
                  <Link href={`/dashboard/pedagogy/fees/${l.id}`} className="font-semibold text-slate-900 hover:text-orange-600">
                    {l.name}
                  </Link>
                </td>
                {(types ?? []).map((t) => {
                  const c = cell(l.id, t.id);
                  const empty = !c || c.lines_count === 0;
                  return (
                    <td key={t.id} className="px-4 py-2.5">
                      <Link
                        href={`/dashboard/pedagogy/fees/${l.id}?type=${t.id}`}
                        className="inline-flex items-center gap-1.5 rounded px-2 py-1 hover:bg-orange-50"
                      >
                        {empty ? (
                          <span className="text-sm italic text-slate-400">—</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span className="font-medium text-slate-900">{XAF.format(c.total_mandatory)} XAF</span>
                          </span>
                        )}
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

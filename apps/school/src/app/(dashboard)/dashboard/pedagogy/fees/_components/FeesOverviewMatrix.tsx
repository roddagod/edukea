'use client';

import { useFeesOverviewMatrix, useStudentTypes, useHydrateFeesFromTemplate, type FeesMatrixRow } from '@edukea/shared';
import { Button, Skeleton } from '@edukea/ui';
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
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
        <div className="rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Sparkles className="h-5 w-5 flex-shrink-0 text-orange-600" />
          <div className="flex-1">
            <p className="font-medium text-orange-900">{emptyCount} combinaison(s) à configurer</p>
            <p className="mt-0.5 text-sm text-orange-700">
              Créez rapidement les frais par défaut pour toutes les combinaisons vides depuis le template école.
            </p>
          </div>
          <Button
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
            <tr className="sticky top-0 z-10 border-b bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Niveau</th>
              {(types ?? []).map((t) => (
                <th key={t.id} className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">{t.label}</th>
              ))}
            </tr>
          </thead>
        <tbody>
          {levels.map((l, idx) => (
            <tr key={l.id} className={`border-b last:border-none hover:bg-slate-50 ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
              <td className="px-4 py-3">
                <Link href={`/dashboard/pedagogy/fees/${l.id}`} className="font-medium text-slate-900 hover:text-orange-600">
                  {l.name}
                </Link>
              </td>
              {(types ?? []).map((t) => {
                const c = cell(l.id, t.id);
                const empty = !c || c.lines_count === 0;
                return (
                  <td key={t.id} className="px-4 py-3">
                    <Link
                      href={`/dashboard/pedagogy/fees/${l.id}?type=${t.id}`}
                      className="inline-flex items-center gap-2 rounded px-2 py-1 hover:bg-orange-50"
                    >
                      {empty ? (
                        <>
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="text-sm text-slate-500">Non configuré</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-slate-900">{XAF.format(c.total_mandatory)} XAF</span>
                        </>
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

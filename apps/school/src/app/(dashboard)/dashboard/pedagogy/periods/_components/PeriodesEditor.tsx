'use client';

import { useState } from 'react';
import {
  usePedagogySetupStatus,
  usePeriodes,
  useUpsertPeriode,
  useDeletePeriode,
  useGenerateDefaultPeriodes,
  type Periode,
} from '@edukea/shared';
import { Button, Skeleton } from '@edukea/ui';
import { Trash2, Sparkles } from 'lucide-react';

interface Props { schoolId: string; }

export function PeriodesEditor({ schoolId }: Props) {
  const { data: status, isLoading: statusLoading } = usePedagogySetupStatus(schoolId);
  const yearId = status?.school_year_id ?? undefined;
  const { data: periodes, isLoading: pLoading } = usePeriodes(yearId);
  const upsert = useUpsertPeriode();
  const del = useDeletePeriode();
  const gen = useGenerateDefaultPeriodes();
  const [genError, setGenError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!yearId) return;
    setGenError(null);
    try {
      await gen.mutateAsync({ schoolYearId: yearId, schoolId });
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Erreur inconnue');
    }
  };

  if (statusLoading || pLoading) return <Skeleton className="h-32 w-full" />;

  if (!yearId) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
        Aucune année active.{' '}
        <a href="/dashboard/pedagogy/school-year" className="text-orange-600 underline">
          Créez d&apos;abord une année
        </a>.
      </div>
    );
  }

  const expected = status?.periode_type === 'semestre' ? 2 : 3;
  const hasNone = (periodes?.length ?? 0) === 0;
  const noPeriodeType = !status?.periode_type;

  function handleUpsert(p: Periode, patch: Partial<Pick<Periode, 'name' | 'start_date' | 'end_date'>>) {
    upsert.mutate({
      id: p.id,
      school_id: p.school_id,
      school_year_id: p.school_year_id,
      name: patch.name ?? p.name,
      type: (p.type ?? 'trimestre') as 'trimestre' | 'semestre',
      order: p.order,
      start_date: patch.start_date ?? p.start_date,
      end_date: patch.end_date ?? p.end_date,
    });
  }

  return (
    <div className="space-y-4">
      {hasNone && noPeriodeType && (
        <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-semibold">Type de période non défini pour l&apos;année {status?.school_year_name}.</p>
          <p className="mt-1">
            Choisissez d&apos;abord Trimestres ou Semestres dans{' '}
            <a href="/dashboard/pedagogy/school-year" className="font-semibold text-orange-600 underline">
              Année scolaire
            </a>{' '}
            pour pouvoir générer les périodes automatiquement.
          </p>
        </div>
      )}

      {hasNone && !noPeriodeType && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm text-slate-700">
            Aucune période configurée pour l&apos;année {status?.school_year_name}.
          </p>
          <Button variant="accent" onClick={handleGenerate} disabled={gen.isPending}>
            <Sparkles className="mr-2 h-4 w-4" />
            {gen.isPending ? 'Génération…' : `Générer ${expected} périodes par défaut`}
          </Button>
        </div>
      )}

      {genError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {genError}
        </div>
      )}

      {(periodes?.length ?? 0) > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-600">#</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Nom</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-600 sm:table-cell">Date début</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-600 sm:table-cell">Date fin</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-600 md:table-cell">Publié</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(periodes ?? []).map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}
                >
                  <td className="px-4 py-2 text-slate-400">#{p.order}</td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full min-w-[120px] rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      defaultValue={p.name}
                      onBlur={(e) => handleUpsert(p, { name: e.target.value })}
                    />
                  </td>
                  <td className="hidden px-4 py-2 sm:table-cell">
                    <input
                      type="date"
                      className="rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      defaultValue={p.start_date}
                      onBlur={(e) => handleUpsert(p, { start_date: e.target.value })}
                    />
                  </td>
                  <td className="hidden px-4 py-2 sm:table-cell">
                    <input
                      type="date"
                      className="rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      defaultValue={p.end_date}
                      onBlur={(e) => handleUpsert(p, { end_date: e.target.value })}
                    />
                  </td>
                  <td className="hidden px-4 py-2 md:table-cell">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${p.is_published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.is_published ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => del.mutate({ id: p.id, schoolYearId: yearId, schoolId })}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

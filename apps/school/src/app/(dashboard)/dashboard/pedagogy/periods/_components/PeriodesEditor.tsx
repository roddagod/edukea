'use client';

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
      {hasNone && (
        <div className="rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 p-4 text-center">
          <p className="mb-3 text-sm text-slate-700">
            Aucune période configurée pour l&apos;année {status?.school_year_name}.
          </p>
          <Button onClick={() => gen.mutate({ schoolYearId: yearId, schoolId })} disabled={gen.isPending}>
            <Sparkles className="mr-2 h-4 w-4" />
            Générer {expected} périodes par défaut
          </Button>
        </div>
      )}

      {(periodes ?? []).map((p) => (
        <div key={p.id} className="rounded-xl border bg-white p-4">
          <div className="grid grid-cols-6 gap-2 items-center">
            <input
              className="col-span-2 rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              defaultValue={p.name}
              onBlur={(e) => handleUpsert(p, { name: e.target.value })}
            />
            <input
              type="date"
              className="col-span-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              defaultValue={p.start_date}
              onBlur={(e) => handleUpsert(p, { start_date: e.target.value })}
            />
            <input
              type="date"
              className="col-span-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              defaultValue={p.end_date}
              onBlur={(e) => handleUpsert(p, { end_date: e.target.value })}
            />
            <div className="text-sm text-slate-500">#{p.order}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => del.mutate({ id: p.id, schoolYearId: yearId, schoolId })}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

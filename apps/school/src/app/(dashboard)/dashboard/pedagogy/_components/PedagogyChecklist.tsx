'use client';

import { usePedagogySetupStatus } from '@edukea/shared';
import { Skeleton } from '@edukea/ui';
import { PedagogyStepCard } from './PedagogyStepCard';

interface Props {
  schoolId: string;
}

export function PedagogyChecklist({ schoolId }: Props) {
  const { data, steps, isLoading } = usePedagogySetupStatus(schoolId);

  if (isLoading || !steps) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const orderedSteps = Object.values(steps).sort((a, b) => a.order - b.order);
  const mandatorySteps = orderedSteps.filter((s) => s.status !== 'optional');
  const doneCount = mandatorySteps.filter((s) => s.status === 'done').length;
  const totalMandatory = mandatorySteps.length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Rentree pedagogique
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Annee {data?.school_year_name ?? '—'} · Configurez les etapes ci-dessous
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-600">
              {doneCount} <span className="text-base font-normal text-slate-400">/ {totalMandatory}</span>
            </p>
            <p className="text-xs text-slate-500">etapes completees</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orderedSteps.map((step) => (
          <PedagogyStepCard key={step.key} step={step} />
        ))}
      </div>

      <p className="pt-2 text-center text-xs text-slate-500">
        Une fois les {totalMandatory} etapes marquees « Fait », le module Notes/Bulletins s&apos;active.
      </p>
    </div>
  );
}

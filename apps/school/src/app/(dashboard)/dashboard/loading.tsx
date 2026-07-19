import {
  HeroKPISkeleton,
  KPIStatSkeleton,
  ProgressRingSkeleton,
  TxTableSkeleton,
  Skeleton,
} from '@edukea/ui';

/**
 * Squelette rendu par Next.js pendant la navigation vers /dashboard.
 * Reproduit la silhouette exacte de la page pour eviter le layout shift.
 */
export default function DashboardLoading() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <Skeleton className="mb-2 h-6 w-56" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      <HeroKPISkeleton />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPIStatSkeleton />
        <KPIStatSkeleton />
        <KPIStatSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <ProgressRingSkeleton />
        <TxTableSkeleton rows={5} />
      </div>
    </>
  );
}

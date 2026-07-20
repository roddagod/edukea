import { Skeleton, TxTableSkeleton } from '@edukea/ui';

export default function RecoveryLoading() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <Skeleton className="mb-2 h-6 w-56" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Skeleton className="h-11 w-full sm:w-72 rounded-md" />
        <Skeleton className="h-10 w-full sm:w-40 rounded-md" />
        <Skeleton className="h-10 w-full sm:w-40 rounded-md" />
      </div>
      <TxTableSkeleton rows={8} />
    </>
  );
}

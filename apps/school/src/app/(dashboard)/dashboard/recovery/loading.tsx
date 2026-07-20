import { Skeleton } from '@edukea/ui';

export default function RecoveryHubLoading() {
  return (
    <>
      <div>
        <Skeleton className="mb-2 h-6 w-48" />
        <Skeleton className="h-3.5 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </>
  );
}

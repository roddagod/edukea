import * as React from 'react';
import { Skeleton } from '../primitives/skeleton';

/**
 * Skeleton du HeroKPI : reproduit la silhouette (fond primary + eyebrow + valeur + hairline + underline + sparkline area).
 */
export function HeroKPISkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary p-5 sm:p-6 md:p-7 shadow-hero">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-80 w-80"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%)' }}
      />
      <div className="flex flex-col gap-5 md:grid md:grid-cols-[1.4fr_1fr] md:items-center md:gap-8">
        <div className="relative">
          <Skeleton className="mb-3 h-3.5 w-2/3 bg-white/10" />
          <Skeleton className="mb-4 h-10 w-3/4 bg-white/15 sm:h-12 md:h-14" />
          <div className="mt-4 flex gap-2 border-t border-white/10 pt-3.5">
            <Skeleton className="h-3 w-1/3 bg-white/10" />
            <Skeleton className="h-3 w-1/4 bg-white/10" />
            <Skeleton className="h-3 w-1/4 bg-white/10" />
          </div>
        </div>
        <Skeleton className="h-20 rounded-xl bg-white/5 sm:h-24" />
      </div>
    </div>
  );
}

/**
 * Skeleton d'une KPIStat card. Utiliser en grille grid-cols-3 comme les KPIStat.
 */
export function KPIStatSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4 shadow-flat">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
      <Skeleton className="mt-1 h-6 w-2/3" />
      <div className="mt-2 flex items-baseline justify-between border-t border-dashed border-line pt-2.5">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

/**
 * Skeleton du ProgressRing (recouvrement). Cercle + legende.
 */
export function ProgressRingSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-white p-5 shadow-flat">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <Skeleton className="mb-1 h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-[180px] w-[180px] rounded-full" />
        <div className="flex w-full justify-around gap-3 border-t border-dashed border-line pt-2.5">
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-8 w-14" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton du TxTable : `rows` lignes.
 */
export function TxTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-flat">
      {/* Header desktop uniquement */}
      <div className="hidden md:grid md:grid-cols-[40px_1.5fr_90px_100px_110px_30px] md:gap-3.5 bg-line-soft px-5 py-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-full" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 border-b border-line-soft px-5 py-3.5 last:border-b-0">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-1 h-3.5 w-3/5" />
            <Skeleton className="h-2.5 w-2/5" />
          </div>
          <Skeleton className="hidden h-3 w-14 md:block" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

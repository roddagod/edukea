import * as React from 'react';
import { Avatar, toneFromSeed } from '../primitives/avatar';
import { StatusPill } from './status-pill';
import { formatFCFA } from '../lib/formatters';
import { cn } from '../lib/cn';
import type { TxRowData } from './tx-row';

export interface TxCardProps extends React.HTMLAttributes<HTMLDivElement> {
  data: TxRowData;
  onAction?: (id: string) => void;
}

/**
 * Card verticale mobile pour une transaction. Utilisee par TxTable sous `md`.
 * Le tap declenche onAction (destine a ouvrir la fiche eleve dans le sprint 3).
 */
export function TxCard({ data, onAction, className, ...rest }: TxCardProps) {
  const initials = data.studentName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onAction?.(data.id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onAction?.(data.id)}
      className={cn(
        'flex items-center gap-3 border-b border-line-soft px-4 py-3 text-body-sm transition-colors last:border-b-0 active:bg-line-soft',
        className,
      )}
      {...rest}
    >
      <Avatar initials={initials} tone={toneFromSeed(data.id)} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="truncate font-semibold text-ink">{data.studentName}</div>
          <div className="shrink-0 font-display text-body-md font-semibold tabular-nums text-ink">
            {data.amount === null ? <span className="text-destructive">-</span> : formatFCFA(data.amount, { withoutSuffix: true })}
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="truncate text-caption text-ink-3">
            {data.className}
            {data.studentSub && <> · {data.studentSub}</>}
          </div>
          <StatusPill status={data.status} className="shrink-0" />
        </div>
      </div>
    </div>
  );
}

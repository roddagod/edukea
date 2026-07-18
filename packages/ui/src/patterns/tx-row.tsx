import * as React from 'react';
import { Avatar, toneFromSeed } from '../primitives/avatar';
import { StatusPill, type PaymentStatus } from './status-pill';
import { formatFCFA } from '../lib/formatters';
import { cn } from '../lib/cn';

export interface TxRowData {
  id: string;
  studentName: string;
  studentSub?: string;
  className: string;
  status: PaymentStatus;
  amount: number | null;
}

export interface TxRowProps extends React.HTMLAttributes<HTMLDivElement> {
  data: TxRowData;
  onAction?: (id: string) => void;
}

export function TxRow({ data, onAction, className, ...rest }: TxRowProps) {
  const initials = data.studentName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div
      className={cn(
        'group grid items-center gap-3.5 border-b border-line-soft px-5 py-3.5 text-body-sm transition-colors last:border-b-0 hover:bg-[#FBFCFE]',
        'grid-cols-[40px_1.5fr_90px_100px_110px_30px]',
        className,
      )}
      {...rest}
    >
      <Avatar initials={initials} tone={toneFromSeed(data.id)} size="sm" />
      <div>
        <div className="font-semibold text-ink">{data.studentName}</div>
        {data.studentSub && <div className="mt-0.5 text-caption text-ink-3">{data.studentSub}</div>}
      </div>
      <div className="text-body-xs font-medium text-ink-2">{data.className}</div>
      <div><StatusPill status={data.status} /></div>
      <div className="text-right font-display text-body-md font-semibold tabular-nums text-ink">
        {data.amount === null ? <span className="text-destructive">-</span> : formatFCFA(data.amount, { withoutSuffix: true })}
      </div>
      <button
        type="button"
        aria-label="Actions"
        onClick={() => onAction?.(data.id)}
        className="text-center text-body-md text-ink-3 opacity-60 transition-opacity group-hover:opacity-100 group-hover:text-primary"
      >
        ⋯
      </button>
    </div>
  );
}

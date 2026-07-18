import * as React from 'react';
import { TxRow, type TxRowData } from './tx-row';
import { cn } from '../lib/cn';

export interface TxTableProps {
  rows: TxRowData[];
  onAction?: (id: string) => void;
  className?: string;
}

export function TxTable({ rows, onAction, className }: TxTableProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-line bg-white shadow-flat', className)}>
      <div
        className={cn(
          'grid items-center gap-3.5 bg-line-soft px-5 py-3 text-caption font-semibold text-ink-3',
          'grid-cols-[40px_1.5fr_90px_100px_110px_30px]',
        )}
      >
        <span />
        <span>Eleve</span>
        <span>Classe</span>
        <span>Statut</span>
        <span className="text-right">Montant</span>
        <span />
      </div>
      {rows.map((r) => (
        <TxRow key={r.id} data={r} onAction={onAction} />
      ))}
    </div>
  );
}

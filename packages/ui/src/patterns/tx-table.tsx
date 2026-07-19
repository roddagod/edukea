import * as React from 'react';
import { TxRow, type TxRowData } from './tx-row';
import { TxCard } from './tx-card';
import { cn } from '../lib/cn';

export interface TxTableProps {
  rows: TxRowData[];
  onAction?: (id: string) => void;
  className?: string;
}

/**
 * Affiche les transactions sous forme de table dense (md+) ou de cards verticales (mobile).
 * Le seuil de switch est md (~768px), mais TxCard est aussi le rendu 375/430.
 */
export function TxTable({ rows, onAction, className }: TxTableProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-line bg-white shadow-flat', className)}>
      {/* Table dense a partir de md */}
      <div className="hidden md:block">
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
      {/* Cards mobiles sous md */}
      <div className="md:hidden">
        {rows.map((r) => (
          <TxCard key={r.id} data={r} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}

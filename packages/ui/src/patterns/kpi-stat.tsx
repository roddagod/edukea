import * as React from 'react';
import { cn } from '../lib/cn';
import { formatFCFA } from '../lib/formatters';

export interface KPIStatProps {
  label: string;
  amount: number;
  currency?: 'FCFA';
  icon?: React.ReactNode;
  /** Texte gauche du foot (ex. "12 versements aujourd'hui"). */
  footLeft?: React.ReactNode;
  /** Chiffre droit du foot (ex. "+62 000"). Rendu en Clash Display. */
  footRight?: number | string;
  className?: string;
}

export function KPIStat({
  label,
  amount,
  currency = 'FCFA',
  icon,
  footLeft,
  footRight,
  className,
}: KPIStatProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-line bg-white p-4 shadow-flat transition duration-150 hover:-translate-y-0.5 hover:shadow-hover',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="font-display text-heading-sm font-semibold text-ink">{label}</div>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-md">{icon}</div>
        )}
      </div>
      <div className="font-display text-heading-lg font-semibold tabular-nums text-ink">
        {formatFCFA(amount, { withoutSuffix: true })}
        <span className="ml-1 font-sans text-body-xs font-medium text-ink-3">{currency}</span>
      </div>
      {(footLeft !== undefined || footRight !== undefined) && (
        <div className="mt-1 flex items-baseline justify-between border-t border-dashed border-line pt-2.5 text-body-xs text-ink-3">
          <span>{footLeft}</span>
          {footRight !== undefined && (
            <span className="font-display font-semibold tabular-nums text-ink">
              {typeof footRight === 'number' ? formatFCFA(footRight, { withoutSuffix: true }) : footRight}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

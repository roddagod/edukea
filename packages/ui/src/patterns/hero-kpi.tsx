import * as React from 'react';
import { cn } from '../lib/cn';
import { formatFCFA, formatDateFr } from '../lib/formatters';

export interface HeroKPIProps {
  /** Montant en XOF (entier). */
  amount: number;
  /** Titre du KPI. Ex. "Tresorerie". */
  label: string;
  /** Date affichee dans l'eyebrow. Defaut : maintenant. */
  date?: Date;
  /** Heure "hh'h'mm" affichee dans l'eyebrow. Defaut : maintenant. */
  updatedAt?: string;
  /** Ligne recap sous la hairline. Array de fragments joints par " · ". */
  metrics?: React.ReactNode[];
  /** Sparkline optionnelle a droite. */
  spark?: React.ReactNode;
  className?: string;
}

const defaultTime = (d: Date) =>
  `${d.getHours().toString().padStart(2, '0')}h${d.getMinutes().toString().padStart(2, '0')}`;

export function HeroKPI({
  amount,
  label,
  date,
  updatedAt,
  metrics,
  spark,
  className,
}: HeroKPIProps) {
  const now = date ?? new Date();
  const time = updatedAt ?? defaultTime(now);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-primary p-6 sm:p-7 text-white shadow-hero',
        spark ? 'grid grid-cols-1 items-center gap-8 md:grid-cols-[1.4fr_1fr]' : 'block',
        className,
      )}
    >
      {/* halo top-right + dot pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-80 w-80"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12px 12px, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div className="relative">
        <div className="mb-2.5 flex flex-wrap items-baseline gap-2.5 text-body-sm font-medium text-white/60">
          <span>{label}</span>
          <span className="font-normal text-white/30">·</span>
          <strong className="font-semibold text-white">{formatDateFr(now)}</strong>
          <span className="font-normal text-white/30">·</span>
          <span>mise a jour a {time}</span>
        </div>
        <div className="font-display text-display-lg font-bold leading-none tracking-tight">
          {formatFCFA(amount, { withoutSuffix: true })}
          <span className="ml-1.5 font-sans text-body-md font-medium text-white/55">FCFA</span>
        </div>
        {metrics && metrics.length > 0 && (
          <div className="mt-4 flex flex-wrap items-baseline gap-2.5 border-t border-white/10 pt-3.5 text-body-sm text-white/80">
            {metrics.flatMap((m, i) =>
              i === 0
                ? [<React.Fragment key={i}>{m}</React.Fragment>]
                : [
                    <span key={`sep-${i}`} className="text-white/30">·</span>,
                    <React.Fragment key={i}>{m}</React.Fragment>,
                  ],
            )}
          </div>
        )}
      </div>
      {spark && (
        <div className="relative h-24 overflow-hidden rounded-xl bg-white/5 p-2">
          {spark}
        </div>
      )}
    </div>
  );
}

import * as React from 'react';
import { cn } from '../lib/cn';

export type PaymentStatus = 'solde' | 'debute' | 'impaye';

const LABELS: Record<PaymentStatus, string> = {
  solde:  'Soldé',
  debute: 'Débuté',
  impaye: 'Impayé',
};

const CLASSES: Record<PaymentStatus, { bg: string; text: string; dot: string }> = {
  solde:  { bg: 'bg-status-solde-bg',  text: 'text-status-solde-text',  dot: 'bg-status-solde-dot' },
  debute: { bg: 'bg-status-debute-bg', text: 'text-status-debute-text', dot: 'bg-status-debute-dot' },
  impaye: { bg: 'bg-status-impaye-bg', text: 'text-status-impaye-text', dot: 'bg-status-impaye-dot' },
};

export function labelForStatus(status: PaymentStatus): string {
  return LABELS[status];
}

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: PaymentStatus;
  label?: string;
}

export function StatusPill({ status, label, className, ...rest }: StatusPillProps) {
  const c = CLASSES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-bold',
        c.bg,
        c.text,
        className,
      )}
      {...rest}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {label ?? labelForStatus(status)}
    </span>
  );
}

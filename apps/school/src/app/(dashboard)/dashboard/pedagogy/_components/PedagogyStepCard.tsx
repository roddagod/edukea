'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, Clock, Lock, MinusCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PedagogyStep, StepStatus } from '@edukea/shared';

const STATUS_CONFIG: Record<StepStatus, {
  label: string;
  icon: typeof CheckCircle2;
  badgeClass: string;
  cardClass: string;
  disabled: boolean;
}> = {
  done: {
    label: 'Fait',
    icon: CheckCircle2,
    badgeClass: 'bg-green-100 text-green-700',
    cardClass: 'border-green-200',
    disabled: false,
  },
  partial: {
    label: 'Partiel',
    icon: Clock,
    badgeClass: 'bg-amber-100 text-amber-700',
    cardClass: 'border-amber-200',
    disabled: false,
  },
  todo: {
    label: 'A faire',
    icon: Circle,
    badgeClass: 'bg-slate-100 text-slate-700',
    cardClass: 'border-slate-200',
    disabled: false,
  },
  locked: {
    label: 'Verrouille',
    icon: Lock,
    badgeClass: 'bg-slate-50 text-slate-400',
    cardClass: 'border-slate-100 opacity-60',
    disabled: true,
  },
  optional: {
    label: 'Facultatif',
    icon: MinusCircle,
    badgeClass: 'bg-slate-100 text-slate-500',
    cardClass: 'border-slate-200',
    disabled: false,
  },
};

interface Props {
  step: PedagogyStep;
}

export function PedagogyStepCard({ step }: Props) {
  const config = STATUS_CONFIG[step.status];
  const Icon = config.icon;

  const inner = (
    <div className={cn(
      'flex items-center gap-4 rounded-xl border bg-white p-4 transition-shadow',
      !config.disabled && 'hover:shadow-md',
      config.cardClass,
    )}>
      <div className={cn(
        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-semibold',
        config.badgeClass,
      )}>
        {step.order}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{step.label}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{step.detail}</p>
      </div>
      <span className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium',
        config.badgeClass,
      )}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
      {!config.disabled && <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300" />}
    </div>
  );

  if (config.disabled) {
    return <div aria-disabled="true" role="link">{inner}</div>;
  }

  return <Link href={step.route} className="block">{inner}</Link>;
}

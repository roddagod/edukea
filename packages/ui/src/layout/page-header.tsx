import * as React from 'react';
import { cn } from '../lib/cn';

export interface PageHeaderProps {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, sub, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <div className="font-display text-heading-lg font-semibold text-ink">{title}</div>
        {sub && <div className="mt-0.5 text-body-sm text-ink-3">{sub}</div>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

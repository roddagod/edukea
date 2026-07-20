import * as React from 'react';
import { cn } from '../lib/cn';

export interface PageHeaderProps {
  /** Accepte string ou ReactNode (ex: Skeleton pendant loading). */
  title: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, sub, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className="min-w-0 flex-1">
        <div className="font-display text-heading-lg font-semibold text-ink">{title}</div>
        {sub !== undefined && sub !== null && sub !== '' && (
          <div className="mt-0.5 text-body-sm text-ink-3">{sub}</div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

import * as React from 'react';
import { cn } from '../lib/cn';

export interface ContextPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  showDot?: boolean;
  dotColor?: string;
}

export function ContextPill({ showDot, dotColor = '#F69F13', className, children, ...rest }: ContextPillProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-body-sm font-semibold text-ink-2 transition-colors hover:border-primary hover:text-primary',
        className,
      )}
      {...rest}
    >
      {showDot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor }} />}
      {children}
    </button>
  );
}

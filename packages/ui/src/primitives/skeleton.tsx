import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * Bloc placeholder anime (pulse). Base pour tous les squelettes.
 */
export function Skeleton({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="presentation"
      aria-hidden
      className={cn('animate-pulse rounded-md bg-line-soft', className)}
      {...rest}
    />
  );
}

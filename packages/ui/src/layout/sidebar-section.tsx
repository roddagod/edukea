import * as React from 'react';
import { cn } from '../lib/cn';

export function SidebarSection({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-3 pb-1.5 pt-3.5 text-caption font-semibold text-white/45', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

import * as React from 'react';
import { Avatar } from '../primitives/avatar';
import { cn } from '../lib/cn';

export interface SidebarUserProps {
  initials: string;
  name: string;
  role?: string;
  className?: string;
}

export function SidebarUser({ initials, name, role, className }: SidebarUserProps) {
  return (
    <div className={cn('relative z-10 mx-3 mb-3.5 mt-1.5 flex items-center gap-2.5 rounded-md border border-white/[0.06] bg-white/[0.04] p-3', className)}>
      <Avatar initials={initials} tone="accent" size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-body-xs font-semibold leading-tight text-white">{name}</div>
        {role && <div className="mt-0.5 truncate text-caption leading-tight text-white/45">{role}</div>}
      </div>
    </div>
  );
}

import * as React from 'react';
import { cn } from '../lib/cn';

export interface SidebarWorkspaceProps {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  className?: string;
}

export function SidebarWorkspace({ icon, title, sub, className }: SidebarWorkspaceProps) {
  return (
    <div className={cn('relative z-10 flex items-center gap-3 border-b border-white/[0.06] p-5', className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.08] text-brand-accent">
        {icon}
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="font-display text-heading-sm font-semibold text-white leading-tight">{title}</div>
        {sub && <div className="mt-0.5 text-caption text-white/45">{sub}</div>}
      </div>
    </div>
  );
}

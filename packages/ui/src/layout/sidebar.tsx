import * as React from 'react';
import { cn } from '../lib/cn';

export interface SidebarProps {
  workspace: React.ReactNode;
  user?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Sidebar({ workspace, user, className, children }: SidebarProps) {
  return (
    <aside
      className={cn('relative flex flex-col border-r border-primary-deep bg-primary', className)}
      style={{ width: 232 }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12px 12px, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      {workspace}
      <nav className="relative z-10 flex flex-1 flex-col gap-0.5 p-3">{children}</nav>
      {user}
    </aside>
  );
}

export function SidebarDivider() {
  return <div className="relative z-10 mx-3 my-2 h-px bg-white/[0.06]" />;
}

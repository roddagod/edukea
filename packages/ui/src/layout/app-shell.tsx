import * as React from 'react';
import { cn } from '../lib/cn';

export interface AppShellProps {
  topbar: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Grille globale : topbar en haut, sidebar a gauche, main scrollable. */
export function AppShell({ topbar, sidebar, children, className }: AppShellProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-[#F7F8FB]', className)}>
      {topbar}
      <div className="flex flex-1">
        {sidebar}
        <main className="flex flex-1 flex-col gap-5 overflow-auto p-6 sm:p-7">{children}</main>
      </div>
    </div>
  );
}

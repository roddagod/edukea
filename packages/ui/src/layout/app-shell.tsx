import * as React from 'react';
import { cn } from '../lib/cn';

export interface AppShellProps {
  topbar: React.ReactNode;
  /** Sidebar desktop. Cachee sous lg. */
  sidebar: React.ReactNode;
  /** Bottom nav mobile. Cachee au-dessus de lg. */
  bottomNav?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Grille globale de l'application, mobile-first.
 * - Mobile (< lg) : topbar + main scrollable + bottom nav fixed en bas
 * - Desktop (lg+) : topbar + [sidebar | main scrollable]
 */
export function AppShell({ topbar, sidebar, bottomNav, children, className }: AppShellProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-[#F7F8FB]', className)}>
      {topbar}
      <div className="flex flex-1">
        {/* Sidebar visible uniquement en lg+ */}
        <div className="hidden lg:block">{sidebar}</div>
        {/* Main : pb16 mobile pour laisser place au bottom nav 64px */}
        <main className="flex flex-1 flex-col gap-4 overflow-auto p-4 pb-24 sm:p-5 sm:pb-24 lg:p-7 lg:pb-7">
          {children}
        </main>
      </div>
      {bottomNav}
    </div>
  );
}

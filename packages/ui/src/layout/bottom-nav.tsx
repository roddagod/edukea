import * as React from 'react';
import { cn } from '../lib/cn';

export interface BottomNavProps extends React.HTMLAttributes<HTMLElement> {
  /** Enfants attendus : 3-5 `BottomNavItem`. */
  children: React.ReactNode;
}

/**
 * Bottom navigation mobile (5 slots max). Fixed en bas de l'ecran sous `lg`,
 * cachee au-dessus. Consomme par AppShell.
 */
export function BottomNav({ className, children, ...rest }: BottomNavProps) {
  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-line bg-white shadow-[0_-4px_16px_-8px_rgba(15,23,42,0.10)]',
        'lg:hidden',
        // safe-area sur iPhone home indicator
        'pb-[env(safe-area-inset-bottom,0)]',
        className,
      )}
      {...rest}
    >
      {children}
    </nav>
  );
}

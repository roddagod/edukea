import * as React from 'react';
import { Logo } from '../primitives/logo';
import { cn } from '../lib/cn';

export interface TopbarProps {
  /** Slot brand aligne a la sidebar (width identique). Defaut : 232px. */
  brandSlotWidth?: number;
  /** Zone droite : ContextPills + Avatar utilisateur. */
  right?: React.ReactNode;
  /** Overrides du <Logo/> par defaut. */
  logoSrc?: string;
  className?: string;
}

export function Topbar({ brandSlotWidth = 232, right, logoSrc, className }: TopbarProps) {
  return (
    <header className={cn('flex h-[72px] items-center justify-between border-b border-line bg-white pr-6', className)}>
      <div
        className="flex h-full items-center justify-center border-r border-line px-6"
        style={{ width: brandSlotWidth }}
      >
        <Logo variant="color" src={logoSrc} className="w-full max-w-[180px]" />
      </div>
      <div className="flex items-center gap-3.5">{right}</div>
    </header>
  );
}

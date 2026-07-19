import * as React from 'react';
import { Logo } from '../primitives/logo';
import { cn } from '../lib/cn';

export interface TopbarProps {
  /** Slot brand aligne a la sidebar (width identique) sur desktop. Defaut : 232px. */
  brandSlotWidth?: number;
  /** Zone droite : ContextPills + Avatar utilisateur (cachee sur mobile compact). */
  right?: React.ReactNode;
  /** Zone droite mobile : version compacte (avatar seul par defaut). */
  rightMobile?: React.ReactNode;
  /** Overrides du <Logo/> par defaut. */
  logoSrc?: string;
  className?: string;
}

/**
 * Topbar responsive.
 * Desktop (lg+) : slot brand large 232px + zone droite complete.
 * Mobile : logo centre horizontal + zone droite compacte.
 */
export function Topbar({ brandSlotWidth = 232, right, rightMobile, logoSrc, className }: TopbarProps) {
  return (
    <header className={cn('flex h-14 lg:h-[72px] items-center justify-between border-b border-line bg-white pr-3 lg:pr-6', className)}>
      {/* Desktop brand slot */}
      <div
        className="hidden lg:flex h-full items-center justify-center border-r border-line px-6"
        style={{ width: brandSlotWidth }}
      >
        <Logo variant="color" src={logoSrc} className="w-full max-w-[180px]" />
      </div>
      {/* Mobile brand : logo compact */}
      <div className="flex lg:hidden items-center px-3">
        <Logo variant="color" src={logoSrc} className="h-8 w-auto" />
      </div>
      {/* Droite */}
      <div className="hidden lg:flex items-center gap-3.5">{right}</div>
      <div className="flex lg:hidden items-center gap-2">{rightMobile ?? right}</div>
    </header>
  );
}

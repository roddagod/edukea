import * as React from 'react';
import { cn } from '../lib/cn';

export interface SidebarWorkspaceProps {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  className?: string;
}

/**
 * Bloc workspace en tete de sidebar. Icone 36×36 dans un carre glass, titre + sub
 * a droite. Alignement strict : icone centree via inline-flex + svg forcees 18px,
 * texte truncate pour eviter le wrap sur les noms d'ecoles longs.
 */
export function SidebarWorkspace({ icon, title, sub, className }: SidebarWorkspaceProps) {
  return (
    <div className={cn('relative z-10 flex items-center gap-3 border-b border-white/[0.06] p-5', className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.08] text-brand-accent [&>svg]:h-[18px] [&>svg]:w-[18px]">
        {icon}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="truncate font-display text-heading-sm font-semibold leading-tight text-white">{title}</div>
        {sub && <div className="mt-0.5 truncate text-caption text-white/45">{sub}</div>}
      </div>
    </div>
  );
}

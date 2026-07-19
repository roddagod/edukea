import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * Titre de section dans la sidebar. Sentence case (anti-pattern doc §7 :
 * pas de UPPERCASE + letter-spacing sur les labels produit). Padding-left
 * aligne avec l'icone des items (px-3 = 12px) pour un rythme visuel coherent.
 */
export function SidebarSection({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-3 pb-1.5 pt-4 text-caption font-semibold text-white/45', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

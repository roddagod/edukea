import * as React from 'react';
import { cn } from '../lib/cn';

export interface SidebarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

/**
 * Sidebar item. Alignement strict : icone 18px centree dans un slot 20×20,
 * texte flex-1 truncate, badge shrink-0 a droite. Chaque enfant est un flex
 * item avec sa propre baseline pour eviter les micro-decalages typographiques.
 */
export const SidebarItem = React.forwardRef<HTMLAnchorElement, SidebarItemProps>(
  ({ active, icon, badge, className, children, ...rest }, ref) => (
    <a
      ref={ref}
      className={cn(
        'group relative flex h-10 items-center gap-3 rounded-md px-3 text-body-sm font-medium leading-none text-white/70 transition-colors',
        active
          ? 'bg-white/10 font-semibold text-white ring-1 ring-inset ring-white/10'
          : 'hover:bg-white/5 hover:text-white',
        className,
      )}
      aria-current={active ? 'page' : undefined}
      {...rest}
    >
      {active && (
        <span
          aria-hidden
          className="absolute -left-3 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-[2px] bg-brand-accent"
          style={{ boxShadow: '0 0 12px rgba(246,159,19,0.5)' }}
        />
      )}
      {icon && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center opacity-75 [&>svg]:h-[18px] [&>svg]:w-[18px] group-hover:opacity-100 group-aria-[current=page]:opacity-100">
          {icon}
        </span>
      )}
      <span className="flex-1 truncate">{children}</span>
      {badge && <span className="shrink-0">{badge}</span>}
    </a>
  ),
);
SidebarItem.displayName = 'SidebarItem';

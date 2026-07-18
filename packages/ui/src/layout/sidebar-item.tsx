import * as React from 'react';
import { cn } from '../lib/cn';

export interface SidebarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export const SidebarItem = React.forwardRef<HTMLAnchorElement, SidebarItemProps>(
  ({ active, icon, badge, className, children, ...rest }, ref) => (
    <a
      ref={ref}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-md px-3 py-2.5 text-body-sm font-medium text-white/70 transition-colors',
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
          className="absolute -left-3 h-4 w-[3px] rounded-r-[2px] bg-brand-accent"
          style={{ boxShadow: '0 0 12px rgba(246,159,19,0.5)' }}
        />
      )}
      {icon && <span className="h-4 w-4 opacity-75 group-hover:opacity-100 group-aria-[current=page]:opacity-100">{icon}</span>}
      <span>{children}</span>
      {badge && <span className="ml-auto">{badge}</span>}
    </a>
  ),
);
SidebarItem.displayName = 'SidebarItem';

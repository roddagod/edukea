import * as React from 'react';
import { cn } from '../lib/cn';

export interface BottomNavItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
}

export const BottomNavItem = React.forwardRef<HTMLAnchorElement, BottomNavItemProps>(
  ({ active, icon, label, badge, className, ...rest }, ref) => (
    <a
      ref={ref}
      className={cn(
        'group relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-caption font-medium transition-colors',
        active ? 'text-primary' : 'text-ink-3 hover:text-ink',
        className,
      )}
      aria-current={active ? 'page' : undefined}
      {...rest}
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        {icon}
        {badge && (
          <span className="absolute -right-2 -top-1.5">{badge}</span>
        )}
      </span>
      <span className="truncate leading-none">{label}</span>
      {active && (
        <span
          aria-hidden
          className="absolute inset-x-6 top-0 h-0.5 rounded-b-full bg-brand-accent"
          style={{ boxShadow: '0 0 8px rgba(246,159,19,0.5)' }}
        />
      )}
    </a>
  ),
);
BottomNavItem.displayName = 'BottomNavItem';

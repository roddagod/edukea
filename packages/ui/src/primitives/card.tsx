import * as React from 'react';
import { cn } from '../lib/cn';

export type CardVariant = 'base' | 'hero' | 'dashed-footer';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

/**
 * Card standard du design system. `variant="hero"` = fond primary + shadow-hero
 * pour les moments financiers majeurs (cf. HeroKPI). `variant="dashed-footer"`
 * = card avec footer separe par une hairline dashed (cf. KPIStat).
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'base', className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-line bg-white p-5 shadow-flat transition-shadow duration-150',
        variant === 'hero' &&
          'relative overflow-hidden rounded-2xl border-0 bg-primary p-6 text-white shadow-hero',
        variant === 'dashed-footer' && '[&>.card-foot]:mt-2 [&>.card-foot]:border-t [&>.card-foot]:border-dashed [&>.card-foot]:border-line [&>.card-foot]:pt-2.5',
        className,
      )}
      {...rest}
    />
  ),
);
Card.displayName = 'Card';

export function CardHeader({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-3 flex items-center justify-between', className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-display text-heading-md text-ink', className)}
      {...rest}
    />
  );
}

export function CardSub({ className, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-0.5 text-body-xs text-ink-3', className)} {...rest} />;
}

export function CardFoot({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card-foot flex items-baseline justify-between text-body-xs text-ink-3', className)} {...rest} />;
}

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md text-caption font-bold px-1.5 py-0.5 text-white leading-none',
  {
    variants: {
      tone: {
        accent: 'bg-brand-accent',
        danger: 'bg-destructive',
        neutral: 'bg-ink-3',
      },
    },
    defaultVariants: { tone: 'accent' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...rest }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...rest} />;
}

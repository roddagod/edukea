import * as React from 'react';
import { cn } from '../lib/cn';

export type AvatarTone = 'blue' | 'orange' | 'green' | 'purple' | 'accent';

const toneClass: Record<AvatarTone, string> = {
  blue:   'bg-primary',
  orange: 'bg-brand-accent',
  green:  'bg-success',
  purple: 'bg-[#7C3AED]',
  accent: 'bg-brand-accent',
};

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  initials: string;
  tone?: AvatarTone;
  size?: 'sm' | 'md' | 'lg';
}

/** Rotates deterministically over the 4 base tones from a seed string (e.g. student id). */
export function toneFromSeed(seed: string): AvatarTone {
  const tones: AvatarTone[] = ['blue', 'orange', 'green', 'purple'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return tones[h % tones.length];
}

export function Avatar({ initials, tone = 'accent', size = 'md', className, ...rest }: AvatarProps) {
  const dim = size === 'sm' ? 'h-8 w-8 text-caption' : size === 'lg' ? 'h-10 w-10 text-body-sm' : 'h-9 w-9 text-body-xs';
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold text-white',
        dim,
        toneClass[tone],
        className,
      )}
      {...rest}
    >
      {initials}
    </div>
  );
}

import type { ImgHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export type LogoVariant = 'color' | 'white' | 'black';

export interface LogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  variant?: LogoVariant;
  src?: string;
}

export function Logo({
  variant = 'color',
  src,
  alt = 'Edukea',
  className,
  ...rest
}: LogoProps) {
  const finalSrc = src ?? `/logo-${variant}.png`;
  return (
    <img
      src={finalSrc}
      alt={alt}
      className={cn('block h-auto w-auto', className)}
      {...rest}
    />
  );
}

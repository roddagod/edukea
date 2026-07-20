import * as React from 'react';
import { cn } from '../lib/cn';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Contrôle segmenté (2-4 options) : ligne de boutons pill fusionnés.
 * Plus compact que RadioCards, utilisé pour les modes de paiement.
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  const padClass = size === 'sm' ? 'px-2.5 py-1 text-caption' : 'px-3 py-1.5 text-body-sm';
  return (
    <div
      role="radiogroup"
      className={cn('inline-flex rounded-md border border-line bg-line-soft p-0.5', className)}
    >
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-md font-semibold transition-colors',
              padClass,
              selected ? 'bg-white text-ink shadow-flat' : 'text-ink-3 hover:text-ink',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

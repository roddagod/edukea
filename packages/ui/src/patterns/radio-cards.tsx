import * as React from 'react';
import { cn } from '../lib/cn';

export interface RadioCardOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface RadioCardsProps<T extends string = string> {
  name: string;
  options: RadioCardOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * Grille de cards radio (choix exclusif). Chaque card affiche icon + label + description.
 * L'option sélectionnée a une bordure primary + fond primary/5%.
 */
export function RadioCards<T extends string = string>({
  name,
  options,
  value,
  onChange,
  columns = 3,
  className,
}: RadioCardsProps<T>) {
  const colClass = columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4';
  return (
    <div className={cn('grid gap-2', colClass, className)} role="radiogroup" aria-label={name}>
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
              'flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-all',
              selected
                ? 'border-primary bg-primary/5 shadow-flat'
                : 'border-line bg-white hover:border-ink-4',
            )}
          >
            {o.icon && <div className={cn('mb-1', selected ? 'text-primary' : 'text-ink-3')}>{o.icon}</div>}
            <div className={cn('text-body-sm font-semibold', selected ? 'text-primary' : 'text-ink')}>{o.label}</div>
            {o.description && <div className="text-caption text-ink-3">{o.description}</div>}
          </button>
        );
      })}
    </div>
  );
}

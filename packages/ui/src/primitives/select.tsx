import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

/**
 * Select natif stylé Edukea. Fond blanc + border + chevron custom.
 * En cas d'erreur, la border passe en destructive.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, error, className, ...rest }, ref) => (
    <div className="relative flex w-full items-center">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none rounded-md border bg-white px-3 py-2 pr-9 text-body-sm text-ink transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          error ? 'border-destructive' : 'border-line hover:border-ink-4 focus:border-primary',
          className,
        )}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-ink-3" />
    </div>
  ),
);
Select.displayName = 'Select';

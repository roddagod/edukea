import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../lib/cn';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

/**
 * SearchInput controle avec loupe a gauche + bouton clear a droite quand rempli.
 * Cible mobile : touch target 44px min via py-2.5.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, placeholder = 'Rechercher…', className, ...rest }, ref) => {
    const handleClear = () => {
      onChange('');
      onClear?.();
    };
    return (
      <div
        className={cn(
          'flex h-11 items-center gap-2 rounded-md border border-line bg-white pl-3 pr-1.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1',
          className,
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-ink-3" />
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-body-sm text-ink placeholder:text-ink-4 focus:outline-none"
          {...rest}
        />
        {value && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={handleClear}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-3 hover:bg-line-soft hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';

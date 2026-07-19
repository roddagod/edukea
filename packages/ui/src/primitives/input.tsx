import * as React from 'react';
import { cn } from '../lib/cn';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  hint?: string;
  error?: string;
  /** Prefixe visuel (ex: signe FCFA, icone). Rendu inline avant l'input. */
  prefix?: React.ReactNode;
  /** Suffixe visuel (ex: unite). */
  suffix?: React.ReactNode;
}

/**
 * Champ de formulaire standard. Wrapper label + input + hint/error.
 * En cas d'erreur, la border passe en danger et le hint est remplace par l'error.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, prefix, suffix, className, id: idProp, ...rest }, ref) => {
    const reactId = React.useId();
    const id = idProp ?? `input-${reactId.replace(/:/g, '')}`;
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-body-xs font-semibold text-ink-2">
            {label}
          </label>
        )}
        <div
          className={cn(
            'flex items-center gap-2 rounded-md border bg-white px-3 py-2 transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1',
            error ? 'border-destructive' : 'border-line hover:border-ink-4 focus-within:border-primary',
          )}
        >
          {prefix && <span className="shrink-0 text-body-sm text-ink-3">{prefix}</span>}
          <input
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={cn(
              'min-w-0 flex-1 bg-transparent text-body-sm text-ink placeholder:text-ink-4 focus:outline-none',
              className,
            )}
            {...rest}
          />
          {suffix && <span className="shrink-0 text-body-sm text-ink-3">{suffix}</span>}
        </div>
        {error ? (
          <p id={`${id}-error`} className="text-caption text-destructive">
            {error}
          </p>
        ) : hint ? (
          <p id={`${id}-hint`} className="text-caption text-ink-3">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../lib/cn';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
  hint?: string;
}

/**
 * Checkbox avec label. Utilise input natif + custom paint via CSS pour
 * garantir l'accessibilité et le comportement clavier.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hint, className, id: idProp, ...rest }, ref) => {
    const reactId = React.useId();
    const id = idProp ?? `cb-${reactId.replace(/:/g, '')}`;
    return (
      <div className="flex items-start gap-2.5">
        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className={cn(
              'peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-line bg-white transition-colors',
              'checked:border-primary checked:bg-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              className,
            )}
            {...rest}
          />
          <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" />
        </div>
        {(label || hint) && (
          <label htmlFor={id} className="flex-1 cursor-pointer select-none">
            {label && <div className="text-body-sm font-medium text-ink">{label}</div>}
            {hint && <div className="mt-0.5 text-caption text-ink-3">{hint}</div>}
          </label>
        )}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';

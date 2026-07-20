import * as React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../lib/cn';

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  error?: string;
}

/**
 * Date picker natif (input type=date) stylé. Le navigateur affiche le picker
 * OS/UA. Format ISO YYYY-MM-DD attendu en value.
 */
export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ error, className, ...rest }, ref) => (
    <div className="relative flex w-full items-center">
      <input
        ref={ref}
        type="date"
        className={cn(
          'w-full rounded-md border bg-white px-3 py-2 pr-9 text-body-sm text-ink transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          error ? 'border-destructive' : 'border-line hover:border-ink-4 focus:border-primary',
          className,
        )}
        {...rest}
      />
      <Calendar className="pointer-events-none absolute right-3 h-4 w-4 text-ink-3" />
    </div>
  ),
);
DatePicker.displayName = 'DatePicker';

import * as React from 'react';
import { cn } from '../lib/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'block w-full rounded-md border bg-white px-3 py-2 text-body-sm text-ink transition-colors placeholder:text-ink-4',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
        error ? 'border-destructive' : 'border-line hover:border-ink-4 focus:border-primary',
        className,
      )}
      {...rest}
    />
  ),
);
Textarea.displayName = 'Textarea';

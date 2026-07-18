import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, type ButtonProps } from '../primitives/button';

export interface RefreshButtonProps extends Omit<ButtonProps, 'variant'> {
  loading?: boolean;
  label?: string;
}

export function RefreshButton({ loading, label = 'Actualiser', ...rest }: RefreshButtonProps) {
  return (
    <Button variant="secondary" size="md" disabled={loading} {...rest}>
      <RefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
      {label}
    </Button>
  );
}

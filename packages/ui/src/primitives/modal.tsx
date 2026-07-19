import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../lib/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Footer optionnel (boutons). Alignement flex row justify-end en desktop, colonne en mobile. */
  footer?: React.ReactNode;
  /** Taille max du panneau desktop. Par defaut `md` (~448px). */
  size?: 'sm' | 'md' | 'lg';
  /** Empeche fermeture au clic hors panneau. */
  dismissable?: boolean;
  children: React.ReactNode;
  className?: string;
}

const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

/**
 * Modal + bottom-sheet.
 * - Desktop (sm:+) : centre horizontal, max-width selon `size`, radius-2xl.
 * - Mobile : sheet full-width en bas de l'ecran, radius top only.
 *
 * Portal DOM (createPortal) pour eviter le z-index/overflow parent.
 * Trap ESC pour fermer si `dismissable` (defaut true).
 * Body scroll lock quand open.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  dismissable = true,
  children,
  className,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, dismissable]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        aria-hidden
        onClick={dismissable ? onClose : undefined}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      {/* Panel */}
      <div
        className={cn(
          'relative flex w-full flex-col rounded-t-2xl bg-white shadow-hero',
          'sm:rounded-2xl sm:max-h-[85vh]',
          sizeClass[size],
          className,
        )}
        style={{ maxHeight: 'calc(100vh - env(safe-area-inset-bottom,0px))' }}
      >
        {(title || dismissable) && (
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 className="font-display text-heading-md font-semibold text-ink">{title}</h2>
              )}
              {description && (
                <p className="mt-0.5 text-body-sm text-ink-3">{description}</p>
              )}
            </div>
            {dismissable && (
              <button
                type="button"
                aria-label="Fermer"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-3 hover:bg-line-soft hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line p-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

import * as React from 'react';
import { cn } from '../lib/cn';
import { Button } from '../primitives/button';

// ==================== State helpers (testable) ====================

export function isFirstStep(currentIndex: number): boolean {
  return currentIndex <= 0;
}

export function isLastStep(currentIndex: number, total: number): boolean {
  return currentIndex >= total - 1;
}

export function canGoBack(currentIndex: number): boolean {
  return currentIndex > 0;
}

/** Peut passer à l'étape suivante si pas la dernière ET le step courant est valide. */
export function canGoNext(currentIndex: number, total: number, isValid: boolean): boolean {
  return !isLastStep(currentIndex, total) && isValid;
}

// ==================== Stepper (header) ====================

export interface WizardStepMeta {
  id: string;
  label: string;
  shortLabel?: string;
}

export function Stepper({
  steps,
  current,
  className,
}: {
  steps: WizardStepMeta[];
  current: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto', className)}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-body-xs font-semibold transition-colors',
                done
                  ? 'bg-primary text-white'
                  : active
                    ? 'border-2 border-primary bg-white text-primary'
                    : 'border border-line bg-white text-ink-3',
              )}
            >
              {i + 1}
            </div>
            <div className="hidden sm:block">
              <div
                className={cn(
                  'text-caption font-semibold',
                  active ? 'text-ink' : done ? 'text-ink-2' : 'text-ink-3',
                )}
              >
                {s.shortLabel ?? s.label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('h-px w-6 sm:w-10', done ? 'bg-primary' : 'bg-line')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==================== Wizard container ====================

export interface WizardProps {
  steps: WizardStepMeta[];
  currentIndex: number;
  isCurrentStepValid: boolean;
  isSubmitting?: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Container wizard : Stepper en top + contenu de l'étape + footer avec
 * boutons Précédent / Suivant (ou Soumettre si dernière étape).
 */
export function Wizard({
  steps,
  currentIndex,
  isCurrentStepValid,
  isSubmitting,
  onBack,
  onNext,
  onSubmit,
  submitLabel = 'Confirmer',
  children,
  className,
}: WizardProps) {
  const last = isLastStep(currentIndex, steps.length);
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Stepper steps={steps} current={currentIndex} />
      <div className="min-h-[280px]">{children}</div>
      <div className="flex items-center justify-between border-t border-line pt-4">
        <Button variant="ghost" onClick={onBack} disabled={!canGoBack(currentIndex) || isSubmitting}>
          Précédent
        </Button>
        {last ? (
          <Button variant="primary" size="lg" onClick={onSubmit} disabled={!isCurrentStepValid || isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : submitLabel}
          </Button>
        ) : (
          <Button variant="primary" onClick={onNext} disabled={!isCurrentStepValid}>
            Suivant
          </Button>
        )}
      </div>
    </div>
  );
}

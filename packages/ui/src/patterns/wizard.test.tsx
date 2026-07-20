import { describe, it, expect } from 'vitest';
import { canGoNext, canGoBack, isLastStep, isFirstStep } from './wizard';

describe('Wizard state helpers', () => {
  it('isFirstStep true when currentIndex=0', () => {
    expect(isFirstStep(0)).toBe(true);
    expect(isFirstStep(1)).toBe(false);
  });

  it('isLastStep depends on total', () => {
    expect(isLastStep(4, 5)).toBe(true);
    expect(isLastStep(3, 5)).toBe(false);
  });

  it('canGoBack false at start', () => {
    expect(canGoBack(0)).toBe(false);
    expect(canGoBack(1)).toBe(true);
  });

  it('canGoNext gated by isValid predicate', () => {
    expect(canGoNext(0, 5, true)).toBe(true);
    expect(canGoNext(0, 5, false)).toBe(false);
    // Last step : canGoNext false (Next devient Submit)
    expect(canGoNext(4, 5, true)).toBe(false);
  });
});

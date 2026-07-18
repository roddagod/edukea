import { describe, it, expect } from 'vitest';
import { formatFCFA, formatDateFr } from './formatters';

describe('formatFCFA', () => {
  it('groups thousands with non-breaking spaces', () => {
    expect(formatFCFA(1240500)).toBe('1 240 500 FCFA');
  });

  it('handles zero', () => {
    expect(formatFCFA(0)).toBe('0 FCFA');
  });

  it('handles negative amounts', () => {
    expect(formatFCFA(-500)).toBe('-500 FCFA');
  });

  it('supports withoutSuffix option', () => {
    expect(formatFCFA(50000, { withoutSuffix: true })).toBe('50 000');
  });
});

describe('formatDateFr', () => {
  it('formats a date to "samedi 18 juillet"', () => {
    // Note: 2026-07-18 is a Saturday (samedi) in every timezone.
    const d = new Date('2026-07-18T10:24:00Z');
    expect(formatDateFr(d)).toBe('samedi 18 juillet');
  });
});

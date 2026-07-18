import { describe, it, expect } from 'vitest';
import { labelForStatus, type PaymentStatus } from './status-pill';

describe('labelForStatus', () => {
  it('returns human label for each status', () => {
    const cases: Array<[PaymentStatus, string]> = [
      ['solde', 'Soldé'],
      ['debute', 'Débuté'],
      ['impaye', 'Impayé'],
    ];
    for (const [status, expected] of cases) {
      expect(labelForStatus(status)).toBe(expected);
    }
  });
});

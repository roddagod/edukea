import { describe, it, expect } from 'vitest';
import { buildSparkPath } from './sparkline';

describe('buildSparkPath', () => {
  it('returns a stroke path with correct point count', () => {
    const { stroke } = buildSparkPath([1, 2, 3, 4, 5], { width: 100, height: 50 });
    // 5 points => M + 4 L
    expect(stroke.split('L').length).toBe(5);
    expect(stroke.startsWith('M')).toBe(true);
  });

  it('spans full width from x=0 to x=width', () => {
    const { stroke } = buildSparkPath([10, 20, 30], { width: 300, height: 100 });
    expect(stroke).toMatch(/^M0,/);
    expect(stroke).toMatch(/L300,/);
  });

  it('closes fill path back to baseline', () => {
    const { fill } = buildSparkPath([1, 2, 3], { width: 30, height: 10 });
    expect(fill.endsWith('Z')).toBe(true);
  });
});

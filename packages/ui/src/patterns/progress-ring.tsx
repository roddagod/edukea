import * as React from 'react';
import { cn } from '../lib/cn';

export interface ProgressRingProps {
  /** 0 a 100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSub?: string;
  className?: string;
}

/** Progress ring circulaire (arc bleu Edukea) avec label centre. */
export function ProgressRing({
  value,
  size = 180,
  strokeWidth = 16,
  centerLabel,
  centerSub,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#1D3A6B"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div className="absolute text-center">
        {centerLabel !== undefined && (
          <div className="font-display text-display-md font-bold text-primary">{centerLabel}</div>
        )}
        {centerSub !== undefined && (
          <div className="text-body-xs font-medium text-ink-3">{centerSub}</div>
        )}
      </div>
    </div>
  );
}

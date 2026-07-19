import * as React from 'react';
import { cn } from '../lib/cn';

export interface SparkPaths {
  stroke: string;
  fill: string;
}

export function buildSparkPath(values: number[], opts: { width: number; height: number }): SparkPaths {
  const { width, height } = opts;
  if (values.length < 2) {
    return { stroke: `M0,${height} L${width},${height}`, fill: `M0,${height} L${width},${height} Z` };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });
  const stroke = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const fill = `${stroke} L${width},${height} L0,${height} Z`;
  return { stroke, fill };
}

export interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillOpacity?: number;
  showEndDot?: boolean;
  className?: string;
}

export function Sparkline({
  values,
  width = 300,
  height = 100,
  strokeColor = '#F69F13',
  fillOpacity = 0.35,
  showEndDot = true,
  className,
}: SparklineProps) {
  const paths = React.useMemo(() => buildSparkPath(values, { width, height }), [values, width, height]);
  // useId : SSR-safe et stable entre serveur/client (evite hydration mismatch)
  const reactId = React.useId();
  const gradientId = `spark-fill-${reactId.replace(/:/g, '')}`;
  const [endX, endY] = React.useMemo(() => {
    if (values.length < 2) return [width, height];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const lastY = height - ((values[values.length - 1] - min) / range) * height;
    return [width, lastY];
  }, [values, width, height]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={cn('block h-full w-full', className)}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={paths.fill} fill={`url(#${gradientId})`} />
      <path d={paths.stroke} fill="none" stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {showEndDot && (
        <circle cx={endX} cy={endY} r={4} fill={strokeColor} stroke="white" strokeWidth={2} />
      )}
    </svg>
  );
}

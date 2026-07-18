export const fontFamily = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  display: ['"Clash Display"', 'Inter', 'system-ui', 'sans-serif'],
} as const;

export const fontSize = {
  'display-lg':  ['3.5rem',   { lineHeight: '1',    letterSpacing: '-0.035em' }],
  'display-md':  ['2rem',     { lineHeight: '1',    letterSpacing: '-0.025em' }],
  'heading-lg':  ['1.375rem', { lineHeight: '1.2',  letterSpacing: '-0.015em' }],
  'heading-md':  ['1rem',     { lineHeight: '1.3',  letterSpacing: '-0.015em' }],
  'heading-sm':  ['0.9375rem',{ lineHeight: '1.3',  letterSpacing: '-0.01em' }],
  'body-md':     ['0.875rem', { lineHeight: '1.5' }],
  'body-sm':     ['0.8125rem',{ lineHeight: '1.5' }],
  'body-xs':     ['0.75rem',  { lineHeight: '1.4' }],
  'caption':     ['0.6875rem',{ lineHeight: '1.4' }],
} as const;

export const typography = { fontFamily, fontSize } as const;

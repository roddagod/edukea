export const BRAND_COLORS = {
  primary: '#1D3A6B',
  accent: '#F69F13',
  white: '#FFFFFF',
} as const;

export const BRAND_COLORS_HSL = {
  primary: '218 58% 27%',
  accent: '37 92% 52%',
} as const;

export const FONT_FAMILIES = {
  display: ['Clash Display', 'Inter', 'system-ui', 'sans-serif'],
  sans: ['Inter', 'system-ui', 'sans-serif'],
} as const;

export const BRAND = {
  name: 'Edukea',
  colors: BRAND_COLORS,
  fonts: FONT_FAMILIES,
} as const;

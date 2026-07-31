import type { Config } from 'tailwindcss';
import edukeaPreset from '@edukea/ui/tailwind-preset';

const config: Config = {
  presets: [edukeaPreset as Config],
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Institutional Deep Navy Palette (PEC Official)
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#102a43',
          900: '#0b1f33',
          950: '#061220',
        },
        // Institutional Slate Neutrals
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Restrained Academic Gold Accent
        gold: {
          50: '#fdfbf7',
          100: '#f8f3e6',
          200: '#eee3c7',
          300: '#dfcfa3',
          400: '#ceb77a',
          500: '#ba9e52',
          600: '#9e813a',
          700: '#7e642c',
          800: '#5e4820',
          900: '#423216',
        },
        // Institutional Status Accents
        institutional: {
          primary: '#0b1f33', // Deep Navy
          secondary: '#1e3a5f', // Regal Collegiate Blue
          surface: '#ffffff', // Clean White
          background: '#f8fafc', // Soft Slate
          border: '#e2e8f0', // Crisp Border
          muted: '#64748b', // Professional Slate
          accent: '#b38a38', // Muted Academic Gold
          success: '#166534', // Restrained Forest Green
          warning: '#854d0e', // Restrained Amber
          danger: '#991b1b', // Restrained Crimson
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        serif: [
          'Merriweather',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Courier New"',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.9375rem' }],
      },
      boxShadow: {
        institutional: '0 1px 3px 0 rgba(11, 31, 51, 0.05), 0 1px 2px -1px rgba(11, 31, 51, 0.05)',
        'institutional-md': '0 4px 6px -1px rgba(11, 31, 51, 0.07), 0 2px 4px -2px rgba(11, 31, 51, 0.05)',
        'institutional-lg': '0 10px 15px -3px rgba(11, 31, 51, 0.08), 0 4px 6px -4px rgba(11, 31, 51, 0.04)',
      },
      borderRadius: {
        institutional: '0.5rem',
      },
    },
  },
  plugins: [],
};

export default config;

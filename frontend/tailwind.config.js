/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0B2545', 2: '#123057' },
        primary: { DEFAULT: '#0F5C8C', soft: '#EAF3FB' },
        teal: { DEFAULT: '#14B8A6', soft: '#E4F9F6' },
        alert: {
          green: '#16A34A', 'green-soft': '#E9F9EF',
          amber: '#D97706', 'amber-soft': '#FDF3E3',
          red: '#DC2626', 'red-soft': '#FCEAEA',
        },
        ink: '#101828',
        muted: '#5B6B7B',
        line: '#E3E9EF',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -8px rgba(16,24,40,0.10)',
      },
      borderRadius: {
        xl2: '14px',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A1420',
          900: '#0F1B2D',
          800: '#152640',
          700: '#1D3455',
          600: '#28456E',
        },
        paper: {
          50: '#F7F9FC',
          100: '#EEF1F6',
          200: '#E1E6EF',
        },
        amber: {
          400: '#F0B44E',
          500: '#E8A33D',
          600: '#C9832A',
        },
        slate2: {
          400: '#6F8AA3',
          500: '#3E6E84',
          600: '#2C5266',
        },
        good: '#4C8C6B',
        bad: '#C1503F',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,27,45,0.06), 0 8px 24px -12px rgba(15,27,45,0.18)',
      },
    },
  },
  plugins: [],
}

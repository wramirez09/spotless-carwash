/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: { 400: '#2E6BFF', 500: '#1B4FD9', 600: '#1947c9', 700: '#0A2A6B' },
        sky: { 400: '#5BA8FF' },
        yellow: { 400: '#FFD93D' },
        ink: '#08183F',
        paper: '#F4F7FB',
        paper2: '#E6EEF9',
        line: '#D7E1F2',
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        display: ['"Archivo Black"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        pulse2: {
          '0%,100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.25)', opacity: '.85' },
        },
        scroll: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        pulse2: 'pulse2 1.6s ease-in-out infinite',
        scroll: 'scroll 38s linear infinite',
      },
    },
  },
  plugins: [],
}

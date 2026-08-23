/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(99,102,241,0.3), 0 20px 40px rgba(79,70,229,0.18)',
      },
      colors: {
        brand: {
          50: '#f4f1ff',
          100: '#e7ddff',
          200: '#d1beff',
          300: '#b79aff',
          400: '#9a7af7',
          500: '#7c5cf2',
          600: '#6446d8',
          700: '#5137b1',
          800: '#412d8d',
          900: '#312469',
        },
      },
    },
  },
  plugins: [],
};

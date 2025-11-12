/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF8F2',
          100: '#FFE0CC',
          200: '#FFC299',
          300: '#FFA466',
          400: '#FF9800',
          500: '#F57C00',
          600: '#E65100',
          700: '#BF360C',
          800: '#8D2600',
          900: '#5D1A00',
        },
      },
    },
  },
  plugins: [],
}

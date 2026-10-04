/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F2F6F4',
        surface: '#FFFFFF',
        ink: '#0E2B2B',
        muted: '#4D6666',
        line: '#D8E3DF',
        primary: { DEFAULT: '#0F766E', hover: '#0B5A54', tint: '#D5EDE8' },
        accent: '#C2410C',
        water: '#1D4ED8',
      },
      fontFamily: {
        heading: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '22px' },
      height: { nav: '76px' },
    },
  },
  plugins: [],
}

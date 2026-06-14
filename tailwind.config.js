/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        eden: {
          green: '#1F4D2E',
          leaf: '#4E944F',
          sage: '#A7C4A0',
          cream: '#F7F4EC',
          sand: '#EDE6D6',
          charcoal: '#2B2B26',
          stone: '#6F6F66',
          berry: '#9C3D54',
          amber: '#C98A3A',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Nunito Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

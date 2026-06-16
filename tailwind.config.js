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
      // Tailwind v4 shifted the shadow/radius scales (v3 `shadow-sm` → v4
      // `shadow-xs`, etc.). Pin the v3 values so the existing screens — which
      // use `shadow-sm` and bare `rounded` heavily — keep their original look.
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#0f172a',
          900: '#1e293b',
          800: '#334155',
        },
        primary: {
          600: '#4f46e5',
          500: '#6366f1',
        }
      }
    },
  },
  plugins: [],
}

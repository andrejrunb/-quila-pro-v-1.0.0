/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Matching index.css variables
        primary: "#3b82f6",
        secondary: "#6366f1",
        accent: "#06b6d4",
        danger: "#ef4444",
        success: "#10b981",
        warning: "#f59e0b",
        "bg-dark": "#0f172a",
        "bg-deep": "#020617",
      },
      borderRadius: {
        'xl': '24px',
        '2xl': '32px',
      },
      backdropBlur: {
        '24': '24px',
      }
    },
  },
  plugins: [],
}

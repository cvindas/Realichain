/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-navy': '#0D1117',
        'brand-blue': '#3B82F6',
      }
    },
  },
  plugins: [],
}

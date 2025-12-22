/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../../packages/app/**/*.{js,ts,jsx,tsx}",
    "!../../../packages/app/**/*.test.{js,ts,jsx,tsx}",
    "!../../../packages/app/**/node_modules/**",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}


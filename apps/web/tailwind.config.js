/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef2ff",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
        },
      },
    },
  },
  plugins: [],
};

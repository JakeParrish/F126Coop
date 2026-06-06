/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        f1: {
          red: "#E10600",
          dark: "#0B0B0F",
          panel: "#15151E",
          line: "#2A2A38",
        },
      },
    },
  },
  plugins: [],
};

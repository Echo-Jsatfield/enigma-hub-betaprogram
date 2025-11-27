/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
     extend: {
    colors: {
      enigma: {
        yellow: "#f8cc00",
        purple: "#6d28d9",
        dark: "#18122b",
        bg: "#0b0c1a",
      },
    },
   },
  },
  plugins: [],
};

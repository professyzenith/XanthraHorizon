/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-soft": "pulseSoft 2.5s ease-in-out infinite",
        "spin-slow":  "spin 20s linear infinite",
      },
      keyframes: {
        pulseSoft: {
          "0%,100%": { opacity: "0.5" },
          "50%":     { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#6C3AED",
          600: "#5b21b6",
          700: "#4c1d95",
          800: "#3b0764",
          900: "#2e0a5e",
        },
        navy: {
          200: "#c7cbe0",
          300: "#a3a9c9",
          400: "#7b82ab",
          500: "#565d85",
          700: "#252b47",
          800: "#171b30",
          900: "#0e1122",
        },
      },
      boxShadow: {
        glow: "0 8px 24px -8px rgba(108,58,237,0.35)",
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      keyframes: {
        "pulse-node": {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.35)" },
        },
        "drift": {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
          "100%": { transform: "translateY(0px)" },
        },
      },
      animation: {
        "pulse-node": "pulse-node 3.2s ease-in-out infinite",
        "drift": "drift 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;

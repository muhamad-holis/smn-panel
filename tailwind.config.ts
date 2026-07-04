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
          50: "#f1efff",
          100: "#e3ddff",
          200: "#c3b6ff",
          300: "#a48eff",
          400: "#8b6bff",
          500: "#7c5cff",
          600: "#6845e8",
          700: "#5535bf",
          800: "#432a96",
          900: "#332075",
        },
        teal: {
          50: "#effcfa",
          100: "#d4f7f0",
          200: "#a9efe1",
          300: "#71e2ce",
          400: "#3ecdb6",
          500: "#22b39d",
          600: "#189181",
          700: "#17756a",
          800: "#175d56",
          900: "#164d47",
        },
        navy: {
          50: "#f0f2f8",
          100: "#dde1ee",
          200: "#b8c0dc",
          300: "#8b98c0",
          400: "#5c6a9c",
          500: "#3d4a7a",
          600: "#2a3560",
          700: "#1e2749",
          800: "#151d38",
          850: "#121729",
          900: "#0d111f",
          950: "#080a14",
        },
      },
    },
  },
  plugins: [],
};
export default config;

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
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#b3ccff",
          300: "#80a8ff",
          400: "#4d7fff",
          500: "#265cf5",
          600: "#1a44d1",
          700: "#1633a3",
          800: "#152c7f",
          900: "#152863",
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

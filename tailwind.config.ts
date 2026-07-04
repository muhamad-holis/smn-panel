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
      },
    },
  },
  plugins: [],
};
export default config;

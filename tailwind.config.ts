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
        // Palet gelap untuk admin panel, halaman login & register.
        // Sebelumnya class navy-* dipakai di banyak file tapi TIDAK terdaftar
        // di sini, jadi Tailwind diam-diam tidak menghasilkan CSS apa pun untuk
        // class itu (bg-navy-800/60 dsb jadi transparan/tidak berefek).
        // Akibatnya judul dengan text-white berakhir di atas background putih
        // bawaan (bg-gray-50 dari body) -> teks tidak terlihat / kontras rendah.
        // Definisi ini membuat tema gelap yang sudah dirancang benar-benar aktif.
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
    },
  },
  plugins: [],
};
export default config;

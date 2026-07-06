import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "@/components/whatsapp-button";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Artholic Studio - Layanan Sosial Media Termurah",
  description: "Panel jasa media sosial: followers, likes, views, comments untuk Instagram, TikTok, YouTube, dan lainnya.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${sora.variable} ${inter.variable}`}>
      <body>
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}

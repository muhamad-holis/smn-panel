import type { Metadata } from "next";
import "./globals.css";
import WhatsAppButton from "@/components/whatsapp-button";

export const metadata: Metadata = {
  title: "SMM Panel - Layanan Sosial Media Termurah",
  description: "Panel jasa media sosial: followers, likes, views, comments untuk Instagram, TikTok, YouTube, dan lainnya.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}

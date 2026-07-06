"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Apa itu SMM Panel?",
    a: "SMM Panel adalah platform yang menyediakan layanan peningkatan sosial media seperti followers, likes, views, dan komentar secara otomatis untuk berbagai platform seperti Instagram, TikTok, YouTube, dan Facebook.",
  },
  {
    q: "Bagaimana cara top up saldo?",
    a: "Buka menu Deposit di dashboard, pilih metode pembayaran (QRIS, e-wallet, atau transfer bank), lalu saldo otomatis bertambah begitu pembayaran berhasil dikonfirmasi.",
  },
  {
    q: "Apakah akun media sosial saya aman?",
    a: "Aman. Kami tidak pernah meminta password akun media sosial kamu. Layanan hanya membutuhkan link profil atau link postingan yang sifatnya publik.",
  },
  {
    q: "Apakah ada garansi jika order gagal atau turun?",
    a: "Sebagian besar layanan dilengkapi garansi refill otomatis sesuai ketentuan masing-masing layanan. Kalau order gagal diproses provider, saldo kamu otomatis dikembalikan penuh.",
  },
  {
    q: "Apakah saya bisa jadi reseller?",
    a: "Bisa. Gunakan menu Afiliasi di dashboard untuk membagikan link referral kamu sendiri dan dapatkan komisi otomatis dari setiap order teman yang kamu ajak.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
      {FAQS.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-gray-900 sm:text-base">{item.q}</span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open && (
              <div className="px-5 pb-4">
                <p className="text-sm leading-relaxed text-gray-500">{item.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Rangga P.",
    role: "Reseller Sosmed",
    quote: "Prosesnya cepat banget, order jam 2 pagi pun tetap jalan otomatis tanpa nunggu admin.",
  },
  {
    name: "Sinta W.",
    role: "Owner Toko Online",
    quote: "Harga bersaing dan stok selalu update, jadi gampang atur ulang harga jual ke pelanggan sendiri.",
  },
  {
    name: "Fajar A.",
    role: "Reseller Sosmed",
    quote: "Deposit gampang, dashboard-nya jelas, top up langsung masuk saldo dalam hitungan detik.",
  },
];

export default function TestimonialCarousel() {
  const [index, setIndex] = useState(0);
  const total = TESTIMONIALS.length;

  function prev() {
    setIndex((i) => (i - 1 + total) % total);
  }
  function next() {
    setIndex((i) => (i + 1) % total);
  }

  const t = TESTIMONIALS[index];

  return (
    <div className="mx-auto flex max-w-2xl items-center gap-3 sm:gap-6">
      <button
        onClick={prev}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50"
        aria-label="Testimoni sebelumnya"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex-1 rounded-[24px] border border-gray-100 bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm leading-relaxed text-gray-700 sm:text-base">&ldquo;{t.quote}&rdquo;</p>
        <div className="mt-4 flex items-center justify-center gap-1 text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {t.name.charAt(0)}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">{t.name}</p>
            <p className="text-xs text-gray-400">{t.role}</p>
          </div>
        </div>
      </div>

      <button
        onClick={next}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50"
        aria-label="Testimoni berikutnya"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

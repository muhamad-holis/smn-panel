export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/** Hitung harga jual per 1000 dari harga modal + markup persen */
export function applyMarkup(costRate: number, markupPercent: number): number {
  return Math.ceil(costRate * (1 + markupPercent / 100));
}

/** Hitung total charge untuk quantity tertentu, dibulatkan ke atas ke kelipatan 50 biar rapi */
export function calcCharge(sellRatePer1000: number, quantity: number): number {
  const raw = (sellRatePer1000 / 1000) * quantity;
  return Math.ceil(raw / 50) * 50;
}

/** Label singkat untuk badge status (dipakai di seluruh halaman dashboard, tema terang) */
export function statusBadgeClass(status: string): string {
  switch (status) {
    case "Completed":
      return "bg-green-50 text-green-600 ring-1 ring-green-100";
    case "Partial":
      return "bg-yellow-50 text-yellow-600 ring-1 ring-yellow-100";
    case "In progress":
    case "Processing":
      return "bg-blue-50 text-blue-600 ring-1 ring-blue-100";
    case "Canceled":
    case "Error":
      return "bg-red-50 text-red-600 ring-1 ring-red-100";
    default:
      return "bg-orange-50 text-orange-600 ring-1 ring-orange-100"; // Pending
  }
}

/** Terjemahan status ke Bahasa Indonesia, sesuai istilah di mockup */
export function statusLabel(status: string): string {
  switch (status) {
    case "Completed":
      return "Selesai";
    case "Partial":
      return "Sebagian";
    case "In progress":
    case "Processing":
      return "Proses";
    case "Canceled":
      return "Dibatalkan";
    case "Error":
      return "Error";
    default:
      return "Pending";
  }
}

export function slugifyCategory(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

/** Format ID order jadi kode singkat seperti pada mockup, contoh: #AS123456 */
export function orderCode(id: number | string): string {
  return `#AS${String(id).padStart(6, "0")}`;
}

export type PlatformMeta = {
  key: string;
  label: string;
  bg: string; // warna latar avatar ikon
  text: string; // warna ikon/teks di atas latar
};

/** Deteksi platform dari nama/kategori layanan untuk menampilkan ikon & warna yang konsisten */
export function detectPlatform(nameOrCategory: string | null | undefined): PlatformMeta {
  const s = (nameOrCategory || "").toLowerCase();
  if (s.includes("instagram") || s.includes("ig ")) {
    return { key: "instagram", label: "Instagram", bg: "bg-gradient-to-br from-pink-500 to-orange-400", text: "text-white" };
  }
  if (s.includes("tiktok")) {
    return { key: "tiktok", label: "TikTok", bg: "bg-gray-900", text: "text-white" };
  }
  if (s.includes("youtube")) {
    return { key: "youtube", label: "YouTube", bg: "bg-red-600", text: "text-white" };
  }
  if (s.includes("telegram")) {
    return { key: "telegram", label: "Telegram", bg: "bg-sky-500", text: "text-white" };
  }
  if (s.includes("facebook")) {
    return { key: "facebook", label: "Facebook", bg: "bg-blue-600", text: "text-white" };
  }
  if (s.includes("twitter") || s.includes(" x ") || s.startsWith("x ")) {
    return { key: "twitter", label: "X / Twitter", bg: "bg-black", text: "text-white" };
  }
  if (s.includes("spotify")) {
    return { key: "spotify", label: "Spotify", bg: "bg-green-500", text: "text-white" };
  }
  if (s.includes("whatsapp")) {
    return { key: "whatsapp", label: "WhatsApp", bg: "bg-emerald-500", text: "text-white" };
  }
  return { key: "other", label: "Layanan", bg: "bg-brand-500", text: "text-white" };
}

/** Hitung persentase perubahan antara dua angka, dibulatkan 1 desimal. Null kalau pembanding 0. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

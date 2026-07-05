/**
 * Wrapper untuk API provider SMM MedanPedia.
 * Docs: https://medanpedia.co.id/doc (Dokumentasi API)
 *
 * CATATAN MIGRASI (sebelumnya djuragansosmed.com):
 * - Djuragansosmed pakai 1 parameter `key` untuk auth. MedanPedia butuh 2 parameter
 *   terpisah: `api_id` (int) dan `api_key` (string).
 * - Djuragansosmed pakai 1 endpoint tunggal (`/api/v2`) dengan parameter `action`.
 *   MedanPedia punya endpoint terpisah per aksi (`/services`, `/order`, `/status`, dst).
 * - Semua fungsi & bentuk return di file ini SENGAJA dipertahankan sama persis dengan
 *   versi lama supaya kode lain (routes, sync, dsb) tidak perlu diubah sama sekali.
 *   Penerjemahan format request/response MedanPedia -> format lama dilakukan di sini.
 * - MedanPedia tidak menyediakan endpoint "cancel order" di dokumentasinya. Fungsi
 *   `cancel()` dipertahankan agar tidak merusak pemanggil yang mungkin ada, tapi akan
 *   langsung melempar error yang jelas jika benar-benar dipanggil.
 * - Semua harga & saldo di MedanPedia sudah dalam Rupiah (bukan USD), currency
 *   di-hardcode "IDR" supaya logika konversi USD->IDR di /api/provider/services
 *   otomatis tidak diterapkan (conversionRate = 1).
 */

const BASE_URL = process.env.PROVIDER_API_URL || "https://api.medanpedia.co.id";
const API_ID = process.env.PROVIDER_API_ID || "";
const API_KEY = process.env.PROVIDER_API_KEY || "";

async function call<T = any>(endpoint: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const body = new URLSearchParams();
  body.set("api_id", API_ID);
  body.set("api_key", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) body.set(k, String(v));
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Provider API error: HTTP ${res.status}`);
  }

  return res.json();
}

// Bentuk asli response MedanPedia (internal, tidak diekspor)
interface MedanPediaServiceRaw {
  id: number;
  name: string;
  type: string;
  category: string;
  price: number;
  min: number;
  max: number;
  refill: number; // 0 atau 1
  average_time?: string;
  description?: string;
}

export interface ProviderService {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string | number; // harga per 1000, sudah dalam Rupiah untuk MedanPedia
  min: string | number;
  max: string | number;
  refill: boolean;
  cancel: boolean;
}

export const provider = {
  /** Ambil semua layanan yang tersedia dari provider */
  services: async (): Promise<ProviderService[]> => {
    const res = await call<
      { status: true; msg: string; data: MedanPediaServiceRaw[] } | { status: false; msg: string }
    >("/services");

    if (!res.status) throw new Error(res.msg || "Gagal mengambil daftar layanan.");

    return res.data.map((s) => ({
      service: s.id,
      name: s.name,
      type: s.type,
      category: s.category,
      rate: s.price,
      min: s.min,
      max: s.max,
      refill: !!s.refill,
      cancel: false, // MedanPedia tidak mendukung cancel
    }));
  },

  /** Buat order baru */
  addOrder: async (data: { service: number; link: string; quantity: number }) => {
    const res = await call<
      { status: true; msg: string; data: { id: number } } | { status: false; msg: string }
    >("/order", { service: data.service, target: data.link, quantity: data.quantity });

    if (!res.status) return { error: res.msg || "Order ditolak provider." };
    return { order: res.data.id };
  },

  /** Cek status 1 order */
  status: async (orderId: number) => {
    const res = await call<
      | { status: true; msg: string; data: { id: number; status: string; charge: number; start_count: number; remains: number } }
      | { status: false; msg: string }
    >("/status", { id: orderId });

    if (!res.status) return { error: res.msg || "Pesanan tidak ditemukan." };
    return {
      charge: String(res.data.charge),
      start_count: String(res.data.start_count),
      status: res.data.status,
      remains: String(res.data.remains),
      currency: "IDR",
    };
  },

  /** Cek status banyak order sekaligus (maks 50 id, dipisah koma sesuai dok MedanPedia) */
  multiStatus: async (orderIds: number[]): Promise<Record<string, any>> => {
    const res = await call<
      | { status: true; msg: string; orders: Record<string, any> }
      | { status: false; msg: string }
    >("/status", { id: orderIds.join(",") });

    if (!res.status || !res.orders) return {};

    const result: Record<string, any> = {};
    for (const [id, info] of Object.entries(res.orders)) {
      if (!info || typeof info !== "object" || !("status" in info)) {
        result[id] = { error: (info as any)?.msg || "Pesanan tidak ditemukan." };
      } else {
        const i = info as any;
        result[id] = {
          charge: String(i.charge),
          start_count: String(i.start_count),
          status: i.status,
          remains: String(i.remains),
          currency: "IDR",
        };
      }
    }
    return result;
  },

  /** Minta refill 1 order */
  refill: async (orderId: number) => {
    const res = await call<
      { status: true; msg: string; data: { id_refill: number } } | { status: false; msg: string }
    >("/refill", { id_order: orderId });

    if (!res.status) return { error: res.msg || "Order ini tidak dapat direfill." };
    return { refill: res.data.id_refill };
  },

  /** Cek status refill */
  refillStatus: async (refillId: number) => {
    const res = await call<
      { status: true; msg: string; data: { id: number; status: string } } | { status: false; msg: string }
    >("/refill_status", { id_refill: refillId });

    if (!res.status) return { error: res.msg || "Refill tidak ditemukan." };
    return { status: res.data.status };
  },

  /** Batalkan order — TIDAK DIDUKUNG oleh MedanPedia (tidak ada endpoint cancel di dokumentasi mereka) */
  cancel: async (_orderIds: number[]): Promise<never> => {
    throw new Error(
      "Provider MedanPedia tidak menyediakan endpoint cancel order. Fitur ini tidak tersedia setelah migrasi dari Djuragansosmed."
    );
  },

  /** Cek saldo akun di provider */
  balance: async () => {
    const res = await call<
      | { status: true; msg: string; data: { username: string; full_name: string; balance: number } }
      | { status: false; msg: string }
    >("/profile");

    if (!res.status) throw new Error(res.msg || "Gagal mengambil saldo provider.");
    return { balance: String(res.data.balance), currency: "IDR" };
  },
};

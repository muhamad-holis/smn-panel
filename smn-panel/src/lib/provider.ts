/**
 * Wrapper untuk API provider SMM (djuragansosmed.com, standar API SMM Panel v2)
 * Docs: https://djuragansosmed.com/api/v2
 */

const API_URL = process.env.PROVIDER_API_URL || "https://djuragansosmed.com/api/v2";
const API_KEY = process.env.PROVIDER_API_KEY || "";

async function call<T = any>(params: Record<string, string | number | undefined>): Promise<T> {
  if (!API_KEY) {
    throw new Error("PROVIDER_API_KEY belum diset di environment variable.");
  }

  const body = new URLSearchParams();
  body.set("key", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) body.set(k, String(v));
  }

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch (e: any) {
    if (e?.name === "TimeoutError" || e?.name === "AbortError") {
      throw new Error(`Provider tidak merespons dalam 15 detik. Cek PROVIDER_API_URL: ${API_URL}`);
    }
    throw new Error(`Gagal terhubung ke provider (${API_URL}): ${e?.message || e}`);
  }

  if (!res.ok) {
    throw new Error(`Provider API error: HTTP ${res.status}`);
  }

  return res.json();
}

export interface ProviderService {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;   // harga per 1000 dalam USD atau mata uang provider
  min: string;
  max: string;
  refill: boolean;
  cancel: boolean;
}

export const provider = {
  /** Ambil semua layanan yang tersedia dari provider */
  services: () => call<ProviderService[]>({ action: "services" }),

  /** Buat order baru */
  addOrder: (data: { service: number; link: string; quantity: number }) =>
    call<{ order: number } | { error: string }>({ action: "add", ...data }),

  /** Cek status 1 order */
  status: (orderId: number) =>
    call<{
      charge: string;
      start_count: string;
      status: string;
      remains: string;
      currency: string;
    } | { error: string }>({ action: "status", order: orderId }),

  /** Cek status banyak order sekaligus (maks 100 id, dipisah koma) */
  multiStatus: (orderIds: number[]) =>
    call<Record<string, any>>({ action: "status", orders: orderIds.join(",") }),

  /** Minta refill 1 order */
  refill: (orderId: number) => call<{ refill: number } | { error: string }>({ action: "refill", order: orderId }),

  /** Cek status refill */
  refillStatus: (refillId: number) =>
    call<{ status: string } | { error: string }>({ action: "refill_status", refill: refillId }),

  /** Batalkan order (jika didukung layanan) */
  cancel: (orderIds: number[]) =>
    call<Array<{ order: number; cancel: number | { error: string } }>>({
      action: "cancel",
      orders: orderIds.join(","),
    }),

  /** Cek saldo akun di provider */
  balance: () => call<{ balance: string; currency: string }>({ action: "balance" }),
};

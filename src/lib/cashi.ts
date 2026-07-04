/**
 * Wrapper untuk API CASHI.ID (Payment Gateway QRIS/VA Indonesia)
 * Docs: https://cashi.id/doc (perlu login dashboard untuk lihat API Key)
 *
 * Auth: header "x-api-key"
 * Webhook signature: header "X-Gateway-Signature", HMAC-SHA256 atas raw JSON body.
 */
import crypto from "crypto";

const API_BASE = process.env.CASHI_API_URL || "https://cashi.id/api";
const API_KEY = process.env.CASHI_API_KEY || "";
const WEBHOOK_SECRET = process.env.CASHI_WEBHOOK_SECRET || "";

async function post<T = any>(path: string, body: Record<string, any>): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return res.json();
}

export interface CashiCreateOrderResult {
  success: boolean;
  orderId?: string;
  amount?: number;
  expected_net?: number;
  checkout_url?: string; // hanya ada di QRIS biasa
  qrUrl?: string; // base64 data-uri gambar QR, selalu ada
  expires_at?: string;
  is_qris_custom?: boolean;
  message?: string;
}

export interface CashiCreateVAResult {
  success: boolean;
  orderId?: string;
  amount?: number;
  va_number?: string;
  bank?: string;
  bank_name?: string;
  expires_at?: string;
  message?: string;
}

export interface CashiStatusResult {
  success: boolean;
  status?: "PENDING" | "SETTLED" | "EXPIRED";
  amount?: number;
  order_id?: string;
  message?: string;
}

export const cashi = {
  /** Buat pembayaran QRIS biasa. `order_id` adalah ID unik dari sistem kita sendiri. */
  createQRIS(amount: number, orderId: string) {
    return post<CashiCreateOrderResult>("/create-order", { amount, order_id: orderId });
  },

  /** Buat pembayaran QRIS dengan nama merchant custom (butuh diaktifkan dulu di dashboard cashi.id) */
  createQRISCustom(amount: number, orderId: string) {
    return post<CashiCreateOrderResult>("/create-order", {
      amount,
      order_id: orderId,
      QRIS_CUSTOM: true,
    });
  },

  /** Buat pembayaran via Virtual Account bank */
  createVA(params: {
    amount: number;
    orderId: string;
    vaProvider: "BRI" | "BCA" | "BNI" | "MANDIRI" | "PERMATA" | "CIMB" | "DANAMON" | "BSI";
    customerPhone: string;
  }) {
    return post<CashiCreateVAResult>("/create-order-va", {
      amount: params.amount,
      order_id: params.orderId,
      va_provider: params.vaProvider,
      customer_phone: params.customerPhone,
    });
  },

  /** Cek status transaksi secara manual (fallback kalau webhook belum masuk) */
  async checkStatus(orderId: string): Promise<CashiStatusResult> {
    const res = await fetch(`${API_BASE}/check-status/${encodeURIComponent(orderId)}`, {
      headers: { "x-api-key": API_KEY },
      cache: "no-store",
    });
    return res.json();
  },

  /**
   * Verifikasi signature webhook - WAJIB dipanggil sebelum memproses payload apapun.
   * expected = HMAC-SHA256(rawBody, CASHI_WEBHOOK_SECRET) dalam hex.
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!signatureHeader || !WEBHOOK_SECRET) return false;
    const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
    } catch {
      return false;
    }
  },
};

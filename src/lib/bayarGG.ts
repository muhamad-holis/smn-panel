/**
 * Wrapper untuk API BAYAR GG (Payment Gateway QRIS Indonesia)
 * Docs: https://bayar.gg/api-docs
 */
import crypto from "crypto";

const API_URL = process.env.BAYARGG_API_URL || "https://www.bayar.gg/api";
const API_KEY = process.env.BAYARGG_API_KEY || "";
const WEBHOOK_SECRET = process.env.BAYARGG_WEBHOOK_SECRET || "";

export interface CreatePaymentResult {
  success: boolean;
  payment?: {
    invoice_id: string;
    amount: number;
    unique_code: number;
    final_amount: number;
    payment_method: string;
    status: string;
    expires_at: string;
  };
  payment_url?: string;
  message?: string;
}

export interface PaymentStatusResult {
  success: boolean;
  payment?: {
    invoice_id: string;
    amount: number;
    final_amount: number;
    status: "pending" | "paid" | "expired" | "cancelled";
    payment_method: string;
    paid_at?: string;
  };
  message?: string;
}

export const bayarGG = {
  /** Buat invoice pembayaran baru */
  async createPayment(params: {
    amount: number;
    description: string;
    payment_method?: string;
    redirect_url?: string;
    callback_url?: string;
  }): Promise<CreatePaymentResult> {
    const res = await fetch(`${API_URL}/create-payment.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify({
        payment_method: process.env.BAYARGG_DEFAULT_METHOD || "qris",
        ...params,
      }),
      cache: "no-store",
    });
    return res.json();
  },

  /** Cek status pembayaran berdasarkan invoice_id */
  async checkStatus(invoiceId: string): Promise<PaymentStatusResult> {
    const res = await fetch(
      `${API_URL}/check-status.php?invoice_id=${encodeURIComponent(invoiceId)}`,
      {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store",
      }
    );
    return res.json();
  },

  /**
   * Verifikasi signature webhook. Sesuaikan dengan skema signature resmi
   * BAYAR GG di dashboard Developer > Webhook (biasanya HMAC-SHA256
   * atas raw body memakai BAYARGG_WEBHOOK_SECRET).
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!signatureHeader || !WEBHOOK_SECRET) return false;
    const expected = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
    } catch {
      return false;
    }
  },
};

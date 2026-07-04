import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cashi } from "@/lib/cashi";

/**
 * Menandai 1 invoice topup sebagai lunas & menambah saldo user - aman dipanggil berkali-kali
 * (dicek dulu apakah statusnya sudah "paid" sebelum memproses).
 * Dipakai baik dari webhook (POST) maupun fallback polling (GET) supaya keduanya konsisten
 * dan tidak mungkin menambah saldo dua kali untuk 1 invoice yang sama.
 */
async function settleTopup(orderId: string, rawPayload: any) {
  const admin = createServiceClient();

  const { data: topup } = await admin.from("topups").select("*").eq("invoice_id", orderId).single();
  if (!topup) return { ok: false, reason: "not_found" as const };
  if (topup.status === "paid") return { ok: true, reason: "already_settled" as const };

  await admin
    .from("topups")
    .update({ status: "paid", paid_at: new Date().toISOString(), raw_response: rawPayload })
    .eq("id", topup.id);

  await admin.rpc("adjust_balance", {
    p_user_id: topup.user_id,
    p_amount: topup.amount, // saldo yang ditambahkan = nominal asli, bukan yang sudah + kode unik
    p_type: "topup",
    p_reference: orderId,
    p_description: "Top up via cashi.id",
  });

  return { ok: true, reason: "settled" as const };
}

async function markExpired(orderId: string, rawPayload: any) {
  const admin = createServiceClient();
  await admin
    .from("topups")
    .update({ status: "expired", raw_response: rawPayload })
    .eq("invoice_id", orderId)
    .neq("status", "paid");
}

/**
 * Webhook dari CASHI.ID. Daftarkan URL ini di Dashboard Merchant > Webhook:
 * https://domain-kamu.com/api/topup/webhook/cashi
 *
 * Payload sesuai dokumentasi resmi:
 * {
 *   "event": "PAYMENT_SETTLED",
 *   "data": { "order_id": "...", "amount": 50000, "status": "SETTLED", "payment_method": "...", "timestamp": "..." }
 * }
 * Signature: header "X-Gateway-Signature" = HMAC-SHA256(raw body, CASHI_WEBHOOK_SECRET) dalam hex.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-gateway-signature");

  if (!cashi.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Signature tidak valid." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const orderId: string | undefined = payload?.data?.order_id;

  // Dokumentasi cashi.id menyebutkan order_id berawalan "TEST-" dipakai untuk uji koneksi webhook
  if (orderId?.startsWith("TEST-")) {
    return NextResponse.json({ success: true, message: "Test connection successful" });
  }

  if (payload.event !== "PAYMENT_SETTLED" || !orderId) {
    return NextResponse.json({ success: true, message: "Event diabaikan." });
  }

  const status: string = payload.data.status;

  if (status === "SETTLED") {
    const result = await settleTopup(orderId, payload);
    if (!result.ok) return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
  } else if (status === "EXPIRED") {
    await markExpired(orderId, payload);
  }

  return NextResponse.json({ success: true });
}

/**
 * Fallback polling dari client (dipanggil dari halaman /dashboard/topup tiap beberapa detik)
 * kalau-kalau webhook telat/gagal terkirim. Kalau ternyata sudah SETTLED di sisi cashi.id
 * tapi webhook belum masuk, endpoint ini akan langsung menambah saldo juga (idempotent).
 */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("order_id");
  if (!orderId) return NextResponse.json({ error: "order_id wajib diisi." }, { status: 400 });

  const result = await cashi.checkStatus(orderId);

  if (result.success && result.status === "SETTLED") {
    await settleTopup(orderId, result);
  } else if (result.success && result.status === "EXPIRED") {
    await markExpired(orderId, result);
  }

  return NextResponse.json(result);
}

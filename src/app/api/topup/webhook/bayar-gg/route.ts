import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { bayarGG } from "@/lib/bayarGG";

/**
 * Webhook dari BAYAR GG. Konfigurasikan URL ini
 * (https://domain-kamu.com/api/topup/webhook/bayar-gg) di dashboard BAYAR GG > Developer > Webhook.
 *
 * Catatan keamanan: signature header diasumsikan bernama "X-Signature".
 * Sesuaikan nama header persis dengan yang tertulis di dashboard Developer
 * BAYAR GG kamu (bisa berbeda, mis. "X-BayarGG-Signature").
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") || req.headers.get("x-bayargg-signature");

  if (!bayarGG.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Signature tidak valid." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const invoiceId: string | undefined = payload.invoice_id || payload.payment?.invoice_id;
  const status: string | undefined = payload.status || payload.payment?.status;

  if (!invoiceId) {
    return NextResponse.json({ error: "invoice_id tidak ditemukan di payload." }, { status: 400 });
  }

  const admin = createServiceClient();

  const { data: topup } = await admin
    .from("topups")
    .select("*")
    .eq("invoice_id", invoiceId)
    .single();

  if (!topup) {
    return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
  }

  // Idempotency guard - jangan proses dua kali kalau webhook dikirim ulang
  if (topup.status === "paid") {
    return NextResponse.json({ success: true, message: "Sudah diproses sebelumnya." });
  }

  if (status === "paid") {
    await admin
      .from("topups")
      .update({ status: "paid", paid_at: new Date().toISOString(), raw_response: payload })
      .eq("id", topup.id);

    await admin.rpc("adjust_balance", {
      p_user_id: topup.user_id,
      p_amount: topup.amount, // saldo yang ditambahkan = amount asli (bukan final_amount+kode unik)
      p_type: "topup",
      p_reference: invoiceId,
      p_description: `Top up via ${topup.gateway}`,
    });
  } else if (status === "expired" || status === "cancelled") {
    await admin.from("topups").update({ status, raw_response: payload }).eq("id", topup.id);
  }

  return NextResponse.json({ success: true });
}

/** Endpoint GET untuk cek manual status invoice dari sisi client (polling fallback) */
export async function GET(req: NextRequest) {
  const invoiceId = req.nextUrl.searchParams.get("invoice_id");
  if (!invoiceId) return NextResponse.json({ error: "invoice_id wajib diisi." }, { status: 400 });

  const result = await bayarGG.checkStatus(invoiceId);
  return NextResponse.json(result);
}

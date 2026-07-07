import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cashi } from "@/lib/cashi";

function generateInvoiceId() {
  return `TOPUP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });

  const { amount } = (await req.json()) as { amount: number };

  if (!amount || amount < 10000) {
    return NextResponse.json({ error: "Minimal top up Rp 10.000" }, { status: 400 });
  }
  if (amount > 10_000_000) {
    return NextResponse.json({ error: "Maksimal top up Rp 10.000.000 per transaksi." }, { status: 400 });
  }

  const admin = createServiceClient();
  const invoiceId = generateInvoiceId();

  const useCustom = process.env.CASHI_USE_QRIS_CUSTOM === "true";
  const result = useCustom
    ? await cashi.createQRISCustom(amount, invoiceId)
    : await cashi.createQRIS(amount, invoiceId);

  if (!result.success) {
    return NextResponse.json({ error: result.message || "Gagal membuat pembayaran cashi.id." }, { status: 502 });
  }

  await admin.from("topups").insert({
    user_id: user.id,
    gateway: "cashi",
    invoice_id: invoiceId,
    amount,
    final_amount: result.amount ?? amount,
    payment_method: useCustom ? "qris_custom" : "qris",
    status: "pending",
    raw_response: result,
  });

  return NextResponse.json({
    payment: {
      invoice_id: invoiceId,
      final_amount: result.amount ?? amount,
      payment_url: result.checkout_url || null,
      qr_image: result.qrUrl || null, // data-uri base64, dipakai kalau checkout_url tidak ada
    },
  });
}

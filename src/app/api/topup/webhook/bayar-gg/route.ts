import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { bayarGG } from "@/lib/bayarGG";
import { notify } from "@/lib/notify";
import { formatIDR } from "@/lib/utils";

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
      p_amount: topup.amount,
      p_type: "topup",
      p_reference: invoiceId,
      p_description: `Top up via ${topup.gateway}`,
    });

    await notify({
      userId: topup.user_id,
      type: "topup",
      title: "Top up berhasil",
      message: `Saldo kamu bertambah ${formatIDR(topup.amount)}.`,
      link: "/dashboard/deposit",
    });
  } else if (status === "expired" || status === "cancelled") {
    await admin.from("topups").update({ status, raw_response: payload }).eq("id", topup.id);
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const invoiceId = req.nextUrl.searchParams.get("invoice_id");
  if (!invoiceId) return NextResponse.json({ error: "invoice_id wajib diisi." }, { status: 400 });

  const result = await bayarGG.checkStatus(invoiceId);
  return NextResponse.json(result);
}

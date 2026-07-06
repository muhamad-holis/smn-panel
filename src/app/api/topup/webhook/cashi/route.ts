import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cashi } from "@/lib/cashi";
import { notify } from "@/lib/notify";
import { formatIDR } from "@/lib/utils";

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
    p_amount: topup.amount,
    p_type: "topup",
    p_reference: orderId,
    p_description: "Top up via cashi.id",
  });

  await notify({
    userId: topup.user_id,
    type: "topup",
    title: "Top up berhasil",
    message: `Saldo kamu bertambah ${formatIDR(topup.amount)}.`,
    link: "/dashboard/deposit",
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

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-gateway-signature");

  if (!cashi.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Signature tidak valid." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const orderId: string | undefined = payload?.data?.order_id;

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

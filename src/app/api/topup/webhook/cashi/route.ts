import { NextRequest, NextResponse } from "next/server";
import { cashi } from "@/lib/cashi";
import { settleTopup, markExpired } from "@/lib/topup-sync";

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
    if (!result.ok && result.reason === "not_found") {
      return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
    }
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

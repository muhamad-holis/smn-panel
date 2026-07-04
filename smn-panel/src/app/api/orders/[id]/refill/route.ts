import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { provider } from "@/lib/provider";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orderId = Number(params.id);
  const { data: order } = await supabase
    .from("orders")
    .select("*, services(refill)")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (!order) return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  if (!order.provider_order_id) return NextResponse.json({ error: "Order belum diproses provider." }, { status: 400 });
  if (!(order as any).services?.refill) return NextResponse.json({ error: "Layanan ini tidak mendukung refill." }, { status: 400 });

  const result = await provider.refill(order.provider_order_id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const admin = createServiceClient();
  await admin
    .from("orders")
    .update({ provider_response: { ...(order.provider_response as any), last_refill: result } })
    .eq("id", orderId);

  return NextResponse.json({ refill: result.refill });
}

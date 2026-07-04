import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { provider } from "@/lib/provider";

/**
 * Sinkronisasi status order yang masih aktif (Pending/Processing/In progress)
 * dengan status terbaru dari provider djuragansosmed.
 * Dipanggil oleh /api/cron/sync (Vercel Cron) atau manual oleh admin.
 */
export async function POST() {
  const admin = createServiceClient();

  const { data: activeOrders } = await admin
    .from("orders")
    .select("id, provider_order_id")
    .in("status", ["Pending", "Processing", "In progress"])
    .not("provider_order_id", "is", null)
    .limit(100);

  if (!activeOrders || activeOrders.length === 0) {
    return NextResponse.json({ synced: 0 });
  }

  const ids = activeOrders.map((o) => o.provider_order_id as number);
  const result = await provider.multiStatus(ids);

  let synced = 0;
  for (const order of activeOrders) {
    const info = result[String(order.provider_order_id)];
    if (!info || "error" in info) continue;

    await admin
      .from("orders")
      .update({
        status: info.status,
        start_count: Number(info.start_count) || null,
        remains: Number(info.remains) || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    synced++;
  }

  return NextResponse.json({ synced, total: activeOrders.length });
}

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { provider } from "@/lib/provider";
import { notify } from "@/lib/notify";
import { orderCode, statusLabel } from "@/lib/utils";

const FINAL_STATUSES = ["Completed", "Partial", "Canceled", "Refunded", "Error"];

/**
 * Sinkronisasi status order yang masih aktif (Pending/Processing/In progress)
 * dengan status terbaru dari provider MedanPedia. Kirim notifikasi ke user
 * kalau status berubah jadi status final (selesai/gagal/dibatalkan/refund).
 */
export async function POST() {
  const admin = createServiceClient();

  const { data: activeOrders } = await admin
    .from("orders")
    .select("id, user_id, provider_order_id")
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

    if (FINAL_STATUSES.includes(info.status)) {
      const isSuccess = info.status === "Completed" || info.status === "Partial";
      await notify({
        userId: order.user_id,
        type: "order",
        title: isSuccess ? "Order selesai" : "Order bermasalah",
        message: `Order ${orderCode(order.id)} sekarang berstatus ${statusLabel(info.status)}.`,
        link: "/dashboard/pesanan",
      });
    }

    synced++;
  }

  return NextResponse.json({ synced, total: activeOrders.length });
}

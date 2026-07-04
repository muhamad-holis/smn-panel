import { createServiceClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";
import ProviderBalanceCard from "./provider-balance-card";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const admin = createServiceClient();

  const { data: warningSetting } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "provider_balance_warning_idr")
    .maybeSingle();
  const warningThreshold = Number(warningSetting?.value || 100000);

  const { count: totalUsers } = await admin.from("profiles").select("id", { count: "exact", head: true });
  const { count: totalOrders } = await admin.from("orders").select("id", { count: "exact", head: true });
  const { count: activeOrders } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("status", ["Pending", "Processing", "In progress"]);

  const { data: orderSums } = await admin.from("orders").select("charge, cost");
  const revenue = (orderSums || []).reduce((sum, o) => sum + Number(o.charge), 0);
  const cost = (orderSums || []).reduce((sum, o) => sum + Number(o.cost), 0);
  const profit = revenue - cost;

  const { data: topupSums } = await admin.from("topups").select("amount").eq("status", "paid");
  const totalTopup = (topupSums || []).reduce((sum, t) => sum + Number(t.amount), 0);

  const stats = [
    { label: "Total Pengguna", value: totalUsers ?? 0 },
    { label: "Total Order", value: totalOrders ?? 0 },
    { label: "Order Berjalan", value: activeOrders ?? 0 },
    { label: "Total Top Up (Lunas)", value: formatIDR(totalTopup) },
    { label: "Total Omzet Order", value: formatIDR(revenue) },
    { label: "Estimasi Profit", value: formatIDR(profit), highlight: true },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">Ringkasan</h1>

      <div className="mb-4">
        <ProviderBalanceCard warningThreshold={warningThreshold} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={`card ${s.highlight ? "bg-green-50 border-green-200" : ""}`}>
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.highlight ? "text-green-700" : "text-gray-900"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

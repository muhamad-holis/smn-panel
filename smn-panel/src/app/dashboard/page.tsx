import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate, statusBadgeClass } from "@/lib/utils";
import { Wallet2, Loader2, Crown, ListOrdered } from "lucide-react";

function levelFor(totalSpend: number) {
  if (totalSpend >= 1_000_000) return "VIP Member";
  if (totalSpend >= 250_000) return "Member Aktif";
  return "Member Baru";
}

export default async function DashboardOverview() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, link, quantity, charge, status, remains, created_at, services(name)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const { count: totalOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { count: activeOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .in("status", ["Pending", "In progress", "Processing"]);

  const { data: spendRows } = await supabase
    .from("orders")
    .select("charge")
    .eq("user_id", user!.id);

  const totalSpending = (spendRows || []).reduce((sum, r: any) => sum + (r.charge || 0), 0);
  const level = levelFor(totalSpending);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-400">
            <Wallet2 size={16} />
            <p className="text-xs uppercase tracking-wide">Total Spending</p>
          </div>
          <p className="mt-2 text-xl font-bold text-white">{formatIDR(totalSpending)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-400">
            <Loader2 size={16} />
            <p className="text-xs uppercase tracking-wide">Active Orders</p>
          </div>
          <p className="mt-2 text-xl font-bold text-white">{activeOrders ?? 0} Pesanan</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-400">
            <ListOrdered size={16} />
            <p className="text-xs uppercase tracking-wide">Total Order</p>
          </div>
          <p className="mt-2 text-xl font-bold text-white">{totalOrders ?? 0}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-brand-300">
            <Crown size={16} />
            <p className="text-xs uppercase tracking-wide">Level</p>
          </div>
          <p className="mt-2 text-xl font-bold text-white">{level}</p>
        </div>
      </div>

      <Link
        href="/dashboard/order"
        className="card flex items-center justify-between bg-gradient-to-r from-brand-600/30 to-teal-600/20 transition hover:from-brand-600/40 hover:to-teal-600/30"
      >
        <div>
          <p className="font-semibold text-white">+ Buat Order Baru</p>
          <p className="text-sm text-navy-300">Pilih layanan & mulai order dalam hitungan detik</p>
        </div>
        <span className="btn-primary hidden sm:inline-flex">Pesan Sekarang</span>
      </Link>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Recent Orders Tracking</h2>
          <Link href="/dashboard/pesanan" className="text-sm text-brand-400 hover:underline">
            Lihat semua
          </Link>
        </div>

        {!orders || orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-navy-400">Belum ada order.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-navy-500">
                <tr>
                  <th className="py-2 pr-4">Order ID</th>
                  <th className="py-2 pr-4">Layanan</th>
                  <th className="py-2 pr-4">Jumlah</th>
                  <th className="py-2 pr-4">Sisa</th>
                  <th className="py-2 pr-4">Harga</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {orders.map((o: any) => (
                  <tr key={o.id}>
                    <td className="py-2.5 pr-4 font-medium text-brand-300">#{o.id}</td>
                    <td className="py-2.5 pr-4 font-medium text-white">{o.services?.name}</td>
                    <td className="py-2.5 pr-4 text-navy-300">{o.quantity}</td>
                    <td className="py-2.5 pr-4 text-navy-300">{o.remains ?? "-"}</td>
                    <td className="py-2.5 pr-4 text-navy-300">{formatIDR(o.charge)}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`badge ${statusBadgeClass(o.status)}`}>{o.status}</span>
                    </td>
                    <td className="py-2.5 text-navy-400">{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

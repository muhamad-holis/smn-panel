import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate, statusBadgeClass } from "@/lib/utils";

export default async function DashboardOverview() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, link, quantity, charge, status, created_at, services(name)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { count: totalOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { count: activeOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .in("status", ["Pending", "In progress", "Processing"]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-gray-500">Total Order</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalOrders ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Order Berjalan</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{activeOrders ?? 0}</p>
        </div>
        <Link href="/dashboard/order" className="card flex flex-col justify-center bg-brand-500 text-white hover:bg-brand-600">
          <p className="font-semibold">+ Buat Order Baru</p>
          <p className="text-sm text-brand-100">Pilih layanan & mulai order</p>
        </Link>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Order Terbaru</h2>
          <Link href="/dashboard/pesanan" className="text-sm text-brand-600 hover:underline">
            Lihat semua
          </Link>
        </div>

        {!orders || orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">Belum ada order.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2">Layanan</th>
                  <th className="py-2">Jumlah</th>
                  <th className="py-2">Harga</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o: any) => (
                  <tr key={o.id}>
                    <td className="py-2.5 font-medium text-gray-900">{o.services?.name}</td>
                    <td className="py-2.5 text-gray-600">{o.quantity}</td>
                    <td className="py-2.5 text-gray-600">{formatIDR(o.charge)}</td>
                    <td className="py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-500">{formatDate(o.created_at)}</td>
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

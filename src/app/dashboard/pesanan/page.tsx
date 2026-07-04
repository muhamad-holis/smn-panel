import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate, statusBadgeClass } from "@/lib/utils";
import RefillButton from "./refill-button";

export const dynamic = "force-dynamic";

export default async function PesananPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, provider_order_id, link, quantity, charge, status, remains, created_at, services(name, refill)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-white">Riwayat Order</h1>

      {!orders || orders.length === 0 ? (
        <p className="card text-center text-sm text-navy-400">Belum ada order.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-navy-800 bg-navy-900">
          <table className="w-full text-sm">
            <thead className="bg-navy-800/60 text-left text-xs uppercase text-navy-400">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Layanan</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Jumlah</th>
                <th className="px-4 py-3">Sisa</th>
                <th className="px-4 py-3">Biaya</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {orders.map((o: any) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 text-navy-400">#{o.id}</td>
                  <td className="px-4 py-3 font-medium text-white">{o.services?.name}</td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-navy-400">
                    <a href={o.link} target="_blank" className="hover:underline">
                      {o.link}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-navy-300">{o.quantity}</td>
                  <td className="px-4 py-3 text-navy-300">{o.remains ?? "-"}</td>
                  <td className="px-4 py-3 text-navy-300">{formatIDR(o.charge)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-400">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3">
                    {o.services?.refill && o.status === "Completed" && (
                      <RefillButton orderId={o.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

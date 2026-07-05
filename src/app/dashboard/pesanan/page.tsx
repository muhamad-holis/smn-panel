import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate, statusBadgeClass, statusLabel, orderCode } from "@/lib/utils";
import PlatformIcon from "@/components/platform-icon";
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
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Daftar Order</h1>
        <p className="text-sm text-gray-500">Riwayat lengkap semua order kamu.</p>
      </div>

      {!orders || orders.length === 0 ? (
        <p className="card text-center text-sm text-gray-400">Belum ada order.</p>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-400">
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
              <tbody className="divide-y divide-gray-100">
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-400">{orderCode(o.id)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <PlatformIcon name={o.services?.name} size="sm" />
                        <span className="font-medium text-gray-800">{o.services?.name}</span>
                      </div>
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-gray-400">
                      <a href={o.link} target="_blank" rel="noreferrer" className="hover:underline">
                        {o.link}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{o.quantity.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 text-gray-600">{o.remains ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{formatIDR(o.charge)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(o.status)}`}>
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-3">
                      {o.services?.refill && o.status === "Completed" && <RefillButton orderId={o.id} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import { createServiceClient } from "@/lib/supabase/server";
import { formatIDR, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminTransaksiPage() {
  const admin = createServiceClient();

  const { data: topups } = await admin
    .from("topups")
    .select("id, invoice_id, amount, status, payment_method, created_at, profiles(email)")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: transactions } = await admin
    .from("transactions")
    .select("id, type, amount, balance_after, description, created_at, profiles(email)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-4 text-xl font-bold text-white">Top Up Terbaru</h1>
        <div className="overflow-x-auto rounded-xl border border-navy-800 bg-navy-900">
          <table className="w-full text-sm">
            <thead className="bg-navy-800/60 text-left text-xs uppercase text-navy-400">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Jumlah</th>
                <th className="px-4 py-3">Metode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {(topups || []).map((t: any) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-navy-400">{t.invoice_id}</td>
                  <td className="px-4 py-3 text-white">{t.profiles?.email}</td>
                  <td className="px-4 py-3 font-medium">{formatIDR(t.amount)}</td>
                  <td className="px-4 py-3 text-navy-400">{t.payment_method}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        t.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : t.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-navy-800 text-navy-300"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-400">{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h1 className="mb-4 text-xl font-bold text-white">Mutasi Saldo</h1>
        <div className="overflow-x-auto rounded-xl border border-navy-800 bg-navy-900">
          <table className="w-full text-sm">
            <thead className="bg-navy-800/60 text-left text-xs uppercase text-navy-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Jumlah</th>
                <th className="px-4 py-3">Saldo Akhir</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {(transactions || []).map((t: any) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-white">{t.profiles?.email}</td>
                  <td className="px-4 py-3 text-navy-400 capitalize">{t.type}</td>
                  <td className={`px-4 py-3 font-medium ${t.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {t.amount >= 0 ? "+" : ""}
                    {formatIDR(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-navy-300">{formatIDR(t.balance_after)}</td>
                  <td className="px-4 py-3 text-navy-400">{t.description}</td>
                  <td className="px-4 py-3 text-navy-400">{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

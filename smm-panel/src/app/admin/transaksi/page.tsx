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
        <h1 className="mb-4 text-xl font-bold text-gray-900">Top Up Terbaru</h1>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Jumlah</th>
                <th className="px-4 py-3">Metode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(topups || []).map((t: any) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-gray-500">{t.invoice_id}</td>
                  <td className="px-4 py-3 text-gray-900">{t.profiles?.email}</td>
                  <td className="px-4 py-3 font-medium">{formatIDR(t.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{t.payment_method}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        t.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : t.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h1 className="mb-4 text-xl font-bold text-gray-900">Mutasi Saldo</h1>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Jumlah</th>
                <th className="px-4 py-3">Saldo Akhir</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(transactions || []).map((t: any) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-gray-900">{t.profiles?.email}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{t.type}</td>
                  <td className={`px-4 py-3 font-medium ${t.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {t.amount >= 0 ? "+" : ""}
                    {formatIDR(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatIDR(t.balance_after)}</td>
                  <td className="px-4 py-3 text-gray-500">{t.description}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

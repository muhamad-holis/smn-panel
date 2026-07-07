import { createServiceClient } from "@/lib/supabase/server";
import { formatIDR, formatDate } from "@/lib/utils";
import WithdrawalActions from "./withdrawal-actions";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  processing: "bg-blue-500/10 text-blue-400",
  paid: "bg-emerald-500/10 text-emerald-400",
  rejected: "bg-red-500/10 text-red-400",
};

export default async function AdminWithdrawalsPage() {
  const admin = createServiceClient();

  const { data: withdrawals } = await admin
    .from("withdrawals")
    .select(
      "id, amount, method, destination_name, account_number, account_holder, status, admin_note, created_at, profiles(email)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const pendingCount = (withdrawals || []).filter((w) => w.status === "pending").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Permintaan Withdraw</h1>
        <p className="text-sm text-navy-400">
          {pendingCount > 0 ? `${pendingCount} permintaan menunggu diproses.` : "Tidak ada permintaan yang menunggu."}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-navy-800 bg-navy-900">
        <table className="w-full text-sm">
          <thead className="bg-navy-800/60 text-left text-xs uppercase text-navy-400">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Jumlah</th>
              <th className="px-4 py-3">Tujuan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800">
            {(withdrawals || []).map((w: any) => (
              <tr key={w.id}>
                <td className="px-4 py-3 text-white">{w.profiles?.email}</td>
                <td className="px-4 py-3 font-medium text-white">{formatIDR(w.amount)}</td>
                <td className="px-4 py-3 text-navy-400">
                  <p>{w.method === "bank" ? "Bank" : "E-Wallet"} · {w.destination_name}</p>
                  <p className="text-xs">{w.account_number} a/n {w.account_holder}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[w.status] || ""}`}>
                    {w.status}
                  </span>
                  {w.status === "rejected" && w.admin_note && (
                    <p className="mt-1 text-xs text-navy-500">{w.admin_note}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-navy-400">{formatDate(w.created_at)}</td>
                <td className="px-4 py-3">
                  <WithdrawalActions id={w.id} status={w.status} />
                </td>
              </tr>
            ))}
            {(!withdrawals || withdrawals.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-navy-500">
                  Belum ada permintaan withdraw.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

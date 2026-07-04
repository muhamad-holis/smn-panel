import { createServiceClient } from "@/lib/supabase/server";
import { formatIDR, formatDate } from "@/lib/utils";
import BalanceAdjustForm from "./balance-form";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = createServiceClient();
  const { data: users } = await admin
    .from("profiles")
    .select("id, email, full_name, role, balance, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-white">Kelola Pengguna</h1>
      <div className="overflow-x-auto rounded-xl border border-navy-800 bg-navy-900">
        <table className="w-full text-sm">
          <thead className="bg-navy-800/60 text-left text-xs uppercase text-navy-400">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Saldo</th>
              <th className="px-4 py-3">Bergabung</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800">
            {(users || []).map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-white">{u.full_name || "-"}</td>
                <td className="px-4 py-3 text-navy-300">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-navy-800 text-navy-300"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-brand-400">{formatIDR(u.balance)}</td>
                <td className="px-4 py-3 text-navy-400">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  <BalanceAdjustForm userId={u.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

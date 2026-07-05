import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle, RotateCcw, Settings2 } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  topup: { label: "Top Up", icon: ArrowDownCircle, color: "text-green-600 bg-green-50" },
  order: { label: "Order", icon: ArrowUpCircle, color: "text-red-500 bg-red-50" },
  refund: { label: "Refund", icon: RotateCcw, color: "text-blue-600 bg-blue-50" },
  adjustment: { label: "Penyesuaian", icon: Settings2, color: "text-orange-600 bg-orange-50" },
};

export default async function TransaksiPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, type, amount, balance_after, reference, description, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Riwayat Transaksi</h1>
        <p className="text-sm text-gray-500">Semua mutasi saldo akun kamu: top up, order, refund, dan penyesuaian.</p>
      </div>

      {!transactions || transactions.length === 0 ? (
        <p className="card text-center text-sm text-gray-400">Belum ada transaksi.</p>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {transactions.map((t) => {
              const meta = TYPE_META[t.type] || TYPE_META.adjustment;
              const Icon = meta.icon;
              const positive = Number(t.amount) >= 0;
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {t.description || meta.label}
                    </p>
                    <p className="text-xs text-gray-400">
                      {meta.label} {t.reference ? `· Ref: ${t.reference}` : ""} · {formatDate(t.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${positive ? "text-green-600" : "text-red-500"}`}>
                      {positive ? "+" : ""}
                      {formatIDR(Number(t.amount))}
                    </p>
                    <p className="text-xs text-gray-400">Saldo: {formatIDR(Number(t.balance_after))}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

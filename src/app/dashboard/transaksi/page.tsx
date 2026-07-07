import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate } from "@/lib/utils";
import { syncPendingTopups } from "@/lib/topup-sync";
import { ArrowDownCircle, ArrowUpCircle, RotateCcw, Settings2, Users, Clock, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  topup: { label: "Top Up", icon: ArrowDownCircle, color: "text-green-600 bg-green-50" },
  order: { label: "Order", icon: ArrowUpCircle, color: "text-red-500 bg-red-50" },
  refund: { label: "Refund", icon: RotateCcw, color: "text-blue-600 bg-blue-50" },
  adjustment: { label: "Penyesuaian", icon: Settings2, color: "text-orange-600 bg-orange-50" },
  affiliate: { label: "Komisi Afiliasi", icon: Users, color: "text-purple-600 bg-purple-50" },
};

const PENDING_TOPUP_META = { label: "Top Up (menunggu pembayaran)", icon: Clock, color: "text-amber-600 bg-amber-50" };
const EXPIRED_TOPUP_META = { label: "Top Up (kedaluwarsa)", icon: XCircle, color: "text-gray-500 bg-gray-100" };

type Row = {
  id: string;
  kind: "transaction" | "topup_pending" | "topup_expired";
  type: string | null;
  amount: number;
  balance_after: number | null;
  reference: string | null;
  description: string | null;
  created_at: string;
};

export default async function TransaksiPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sync oportunistik: setiap kali halaman ini dibuka, cek ulang ke cashi.id
  // untuk topup yang masih "pending" tapi sudah lebih dari 10 menit (supaya
  // tidak tabrakan dengan polling di halaman /dashboard/topup). Ini jaring
  // pengaman tambahan di luar cron harian (Vercel Hobby dibatasi 1x/hari).
  try {
    await syncPendingTopups({ onlyOlderThanMinutes: 10, limit: 10 });
  } catch {
    // gagal sync tidak boleh menghalangi halaman tampil, cron harian akan coba lagi
  }

  const [{ data: transactions }, { data: unsettledTopups }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, type, amount, balance_after, reference, description, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("topups")
      .select("id, invoice_id, amount, status, created_at")
      .eq("user_id", user!.id)
      .in("status", ["pending", "expired", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const rows: Row[] = [
    ...(transactions || []).map((t) => ({
      id: `tx-${t.id}`,
      kind: "transaction" as const,
      type: t.type,
      amount: Number(t.amount),
      balance_after: Number(t.balance_after),
      reference: t.reference,
      description: t.description,
      created_at: t.created_at,
    })),
    ...(unsettledTopups || []).map((t) => ({
      id: `topup-${t.id}`,
      kind: (t.status === "pending" ? "topup_pending" : "topup_expired") as const,
      type: null,
      amount: Number(t.amount),
      balance_after: null,
      reference: t.invoice_id,
      description: null,
      created_at: t.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Riwayat Transaksi</h1>
        <p className="text-sm text-gray-500">Semua mutasi saldo akun kamu: top up, order, refund, dan penyesuaian.</p>
      </div>

      {rows.length === 0 ? (
        <p className="card text-center text-sm text-gray-400">Belum ada transaksi.</p>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {rows.map((t) => {
              const meta =
                t.kind === "topup_pending"
                  ? PENDING_TOPUP_META
                  : t.kind === "topup_expired"
                  ? EXPIRED_TOPUP_META
                  : TYPE_META[t.type || ""] || TYPE_META.adjustment;
              const Icon = meta.icon;
              const isTopupPlaceholder = t.kind !== "transaction";
              const positive = t.amount >= 0;
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{t.description || meta.label}</p>
                    <p className="text-xs text-gray-400">
                      {meta.label} {t.reference ? `· Ref: ${t.reference}` : ""} · {formatDate(t.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${isTopupPlaceholder ? "text-gray-400" : positive ? "text-green-600" : "text-red-500"}`}>
                      {!isTopupPlaceholder && positive ? "+" : ""}
                      {formatIDR(t.amount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isTopupPlaceholder ? "Saldo tidak berubah" : `Saldo: ${formatIDR(t.balance_after ?? 0)}`}
                    </p>
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

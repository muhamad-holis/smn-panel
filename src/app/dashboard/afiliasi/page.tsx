import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate, orderCode } from "@/lib/utils";
import CopyLinkButton from "./copy-link-button";
import { Users, Wallet, Percent } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AfiliasiPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://panel-kamu.com";
  const refCode = user!.id.slice(0, 8);
  const refLink = `${baseUrl}/register?ref=${refCode}`;

  // Total orang yang mendaftar lewat link referral kamu
  const { count: totalReferral } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", user!.id);

  // Riwayat komisi (dipakai juga untuk hitung total & ditampilkan sebagai daftar)
  const { data: commissions } = await supabase
    .from("affiliate_commissions")
    .select("id, amount, order_id, created_at")
    .eq("referrer_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const totalCommission = (commissions || []).reduce((sum, c) => sum + Number(c.amount), 0);

  // Persentase komisi saat ini (diatur admin, default 5%)
  const { data: percentSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "affiliate_commission_percent")
    .single();
  const commissionPercent = percentSetting?.value || "5";

  const stats = [
    { label: "Total Referral", value: String(totalReferral || 0), icon: Users, bg: "bg-brand-500" },
    { label: "Komisi Terkumpul", value: formatIDR(totalCommission), icon: Wallet, bg: "bg-green-500" },
    { label: "Komisi per Order", value: `${commissionPercent}%`, icon: Percent, bg: "bg-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Afiliasi</h1>
        <p className="text-sm text-gray-500">
          Ajak teman kamu pakai Artholic Panel, dapatkan komisi otomatis dari setiap order mereka.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${s.bg} text-white`}>
              <s.icon size={18} />
            </div>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-900">Link Referral Kamu</h2>
        <p className="text-sm text-gray-500">
          Bagikan link ini. Setiap pendaftar baru lewat link kamu otomatis tertaut ke akunmu, dan saldo kamu
          otomatis bertambah tiap mereka berhasil order.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input readOnly value={refLink} className="input flex-1 text-gray-600" />
          <CopyLinkButton text={refLink} />
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Riwayat Komisi</h2>
        </div>
        {!commissions || commissions.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-gray-400">
            Belum ada komisi. Yuk mulai bagikan link referral kamu!
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {commissions.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Komisi dari Order {orderCode(c.order_id ?? 0)}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(c.created_at)}</p>
                </div>
                <p className="text-sm font-semibold text-green-600">+{formatIDR(Number(c.amount))}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

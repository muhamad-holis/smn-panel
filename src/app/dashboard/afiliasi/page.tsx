import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";
import CopyLinkButton from "./copy-link-button";
import { Users, Wallet, Percent, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AfiliasiPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://panel-kamu.com";
  const refCode = user!.id.slice(0, 8);
  const refLink = `${baseUrl}/register?ref=${refCode}`;

  const stats = [
    { label: "Total Referral", value: "0", icon: Users, bg: "bg-brand-500" },
    { label: "Komisi Terkumpul", value: formatIDR(0), icon: Wallet, bg: "bg-green-500" },
    { label: "Komisi per Order", value: "5%", icon: Percent, bg: "bg-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Afiliasi</h1>
        <p className="text-sm text-gray-500">Ajak teman kamu pakai Artholic Studio, dapatkan komisi dari setiap order mereka.</p>
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
        <p className="text-sm text-gray-500">Bagikan link ini. Setiap pendaftar baru lewat link kamu otomatis tertaut ke akunmu.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input readOnly value={refLink} className="input flex-1 text-gray-600" />
          <CopyLinkButton text={refLink} />
        </div>
      </div>

      <div className="card flex items-start gap-3 bg-gradient-to-br from-brand-50 to-purple-50">
        <Sparkles className="mt-0.5 shrink-0 text-brand-500" size={20} />
        <div>
          <p className="text-sm font-semibold text-gray-900">Pelacakan komisi otomatis segera hadir</p>
          <p className="text-sm text-gray-600">
            Link referral kamu sudah aktif dan bisa dibagikan sekarang. Dashboard pelacakan komisi
            per-transaksi akan menyusul di pembaruan berikutnya.
          </p>
        </div>
      </div>
    </div>
  );
}

import { createServiceClient } from "@/lib/supabase/server";
import SyncButton from "./sync-button";
import ServiceRow from "./service-row";
import GlobalSettingsForm from "./settings-form";

export const dynamic = "force-dynamic";

export default async function AdminPengaturanPage() {
  const admin = createServiceClient();

  const { data: services } = await admin
    .from("services")
    .select("id, name, category, cost_rate, sell_rate, markup_percent, is_active")
    .order("category", { ascending: true });

  const { data: settings } = await admin
    .from("app_settings")
    .select("key, value")
    .in("key", [
      "default_markup_percent",
      "usd_to_idr_rate",
      "provider_balance_warning_idr",
      "affiliate_commission_percent",
    ]);

  const settingsMap = Object.fromEntries((settings || []).map((s) => [s.key, s.value]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Layanan &amp; Harga</h1>
        <SyncButton />
      </div>

      <GlobalSettingsForm
        defaultMarkup={settingsMap.default_markup_percent || "30"}
        usdToIdrRate={settingsMap.usd_to_idr_rate || "16000"}
        providerBalanceWarning={settingsMap.provider_balance_warning_idr || "100000"}
        affiliateCommissionPercent={settingsMap.affiliate_commission_percent || "5"}
      />

      <div className="card-dark">
        <p className="mb-4 text-sm text-navy-400">
          Harga jual dihitung otomatis dari harga modal provider × markup. Ubah markup per-layanan lalu klik simpan.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-navy-400">
              <tr>
                <th className="py-2">Layanan</th>
                <th className="py-2">Kategori</th>
                <th className="py-2">Modal /1000</th>
                <th className="py-2">Markup %</th>
                <th className="py-2">Jual /1000</th>
                <th className="py-2">Aktif</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {(services || []).map((s) => (
                <ServiceRow key={s.id} service={s} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

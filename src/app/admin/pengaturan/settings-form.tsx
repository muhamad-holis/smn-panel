"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GlobalSettingsForm({
  defaultMarkup,
  usdToIdrRate,
  providerBalanceWarning,
}: {
  defaultMarkup: string;
  usdToIdrRate: string;
  providerBalanceWarning: string;
}) {
  const router = useRouter();
  const [markup, setMarkup] = useState(defaultMarkup);
  const [rate, setRate] = useState(usdToIdrRate);
  const [warning, setWarning] = useState(providerBalanceWarning);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        default_markup_percent: markup,
        usd_to_idr_rate: rate,
        provider_balance_warning_idr: warning,
      }),
    });
    setSaving(false);
    if (res.ok) {
      router.refresh();
    } else {
      alert("Gagal menyimpan pengaturan.");
    }
  }

  return (
    <div className="card">
      <h2 className="mb-4 font-semibold text-gray-900">Pengaturan Global</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Markup Default Layanan Baru (%)
          </label>
          <input className="input" value={markup} onChange={(e) => setMarkup(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Kurs USD → IDR</label>
          <input className="input" value={rate} onChange={(e) => setRate(e.target.value)} />
          <p className="mt-1 text-xs text-gray-400">Provider melaporkan harga dalam USD per 1000.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Ambang Warning Saldo Modal (Rp)
          </label>
          <input className="input" value={warning} onChange={(e) => setWarning(e.target.value)} />
          <p className="mt-1 text-xs text-gray-400">Muncul peringatan di dashboard admin kalau saldo di bawah ini.</p>
        </div>
        <div className="flex items-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>
    </div>
  );
}

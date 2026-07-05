"use client";

import { useEffect, useState } from "react";
import { formatIDR } from "@/lib/utils";

export default function ProviderBalanceCard({ warningThreshold }: { warningThreshold: number }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchBalance() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/provider-balance");
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Gagal mengambil saldo provider.");
      return;
    }
    setBalance(data.balance_idr);
  }

  useEffect(() => {
    fetchBalance();
  }, []);

  const isLow = balance !== null && balance < warningThreshold;

  return (
    <div className={`card-dark ${isLow ? "border-red-300 bg-red-500/10" : ""}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-400">Saldo Modal di MedanPedia</p>
        <button onClick={fetchBalance} className="text-xs text-brand-400 hover:underline">
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <p className="mt-1 text-2xl font-bold text-navy-500">Memuat...</p>
      ) : error ? (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      ) : (
        <>
          <p className={`mt-1 text-2xl font-bold ${isLow ? "text-red-400" : "text-white"}`}>
            {formatIDR(balance || 0)}
          </p>
          {isLow && (
            <p className="mt-2 text-xs font-medium text-red-400">
              ⚠️ Saldo di bawah ambang batas ({formatIDR(warningThreshold)}). Segera top up saldo
              di dashboard MedanPedia sebelum kehabisan saat order masuk. Ingat, penarikan dari
              cashi.id butuh H-1, jadi jangan tunggu sampai benar-benar habis.
            </p>
          )}
        </>
      )}
    </div>
  );
}

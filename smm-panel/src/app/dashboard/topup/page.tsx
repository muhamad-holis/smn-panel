"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatIDR } from "@/lib/utils";

const PRESETS = [20000, 50000, 100000, 250000, 500000, 1000000];

export default function TopupPage() {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(50000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleCreatePayment() {
    setError(null);
    if (amount < 10000) {
      setError("Minimal top up Rp 10.000");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/topup/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Gagal membuat pembayaran.");
      return;
    }
    setPayment(data.payment);
  }

  // Polling status setiap 5 detik sebagai jaring pengaman kalau webhook telat
  useEffect(() => {
    if (!payment) return;

    pollRef.current = setInterval(async () => {
      setChecking(true);
      try {
        const res = await fetch(`/api/topup/webhook/cashi?order_id=${payment.invoice_id}`);
        const data = await res.json();
        if (data.status === "SETTLED") {
          if (pollRef.current) clearInterval(pollRef.current);
          router.push("/dashboard?topup=success");
          router.refresh();
        }
      } catch {
        // abaikan, coba lagi di interval berikutnya
      } finally {
        setChecking(false);
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [payment, router]);

  if (payment) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card text-center">
          <h1 className="text-lg font-bold text-gray-900">Selesaikan Pembayaran</h1>
          <p className="mt-1 text-sm text-gray-500">Invoice: {payment.invoice_id}</p>
          <p className="mt-4 text-3xl font-bold text-brand-600">{formatIDR(payment.final_amount)}</p>
          <p className="mt-1 text-xs text-gray-400">
            (termasuk kode unik agar pembayaran terverifikasi otomatis)
          </p>

          {payment.qr_image && (
            <div className="mx-auto mt-6 w-56">
              <img src={payment.qr_image} alt="QRIS" className="w-full rounded-lg border border-gray-200" />
            </div>
          )}

          {payment.payment_url && (
            <a
              href={payment.payment_url}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-6 w-full"
            >
              Buka Halaman Pembayaran
            </a>
          )}

          <p className="mt-4 text-xs text-gray-400">
            {checking ? "Mengecek status pembayaran..." : "Saldo akan otomatis bertambah begitu pembayaran terkonfirmasi."}
          </p>

          <button onClick={() => setPayment(null)} className="btn-secondary mt-3 w-full">
            Buat Top Up Lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-xl font-bold text-gray-900">Top Up Saldo</h1>
      <div className="card space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition ${
                amount === p
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {formatIDR(p)}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Atau masukkan jumlah lain</label>
          <input
            type="number"
            className="input"
            value={amount}
            min={10000}
            step={1000}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>

        <button onClick={handleCreatePayment} disabled={loading} className="btn-primary w-full">
          {loading ? "Memproses..." : `Bayar ${formatIDR(amount)} via QRIS`}
        </button>
      </div>
    </div>
  );
}

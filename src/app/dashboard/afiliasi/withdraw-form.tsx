"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatIDR } from "@/lib/utils";

const MIN_WITHDRAW = 50000;

export default function WithdrawForm({ available }: { available: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"bank" | "ewallet">("bank");
  const [destinationName, setDestinationName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  function resetForm() {
    setAmount("");
    setDestinationName("");
    setAccountNumber("");
    setAccountHolder("");
    setMethod("bank");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/withdraw/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(amount),
        method,
        destination_name: destinationName,
        account_number: accountNumber,
        account_holder: accountHolder,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Gagal mengajukan withdraw.");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  if (success) {
    return (
      <div className="card space-y-2 border-green-100 bg-green-50/60 text-center">
        <p className="text-sm font-semibold text-green-700">Permintaan withdraw berhasil diajukan!</p>
        <p className="text-xs text-green-600">
          Tim kami akan proses dan transfer manual dalam 1-3 hari kerja. Cek status di riwayat withdraw di bawah.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setOpen(false);
            resetForm();
          }}
          className="text-xs font-medium text-green-700 underline"
        >
          Tutup
        </button>
      </div>
    );
  }

  if (!open) {
    const disabled = available < MIN_WITHDRAW;
    return (
      <div>
        <button
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ajukan Withdraw
        </button>
        {disabled && (
          <p className="mt-2 text-center text-xs text-gray-400">
            Minimal withdraw {formatIDR(MIN_WITHDRAW)}. Komisi kamu masih {formatIDR(available)}.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Ajukan Withdraw</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-400">
          Batal
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</div>}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Jumlah (tersedia {formatIDR(available)})
        </label>
        <input
          type="number"
          required
          min={MIN_WITHDRAW}
          max={available}
          step={1000}
          className="input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Minimal ${formatIDR(MIN_WITHDRAW)}`}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Metode Pencairan</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMethod("bank")}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
              method === "bank" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500"
            }`}
          >
            Transfer Bank
          </button>
          <button
            type="button"
            onClick={() => setMethod("ewallet")}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
              method === "ewallet" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500"
            }`}
          >
            E-Wallet
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {method === "bank" ? "Nama Bank (BCA, Mandiri, BRI, dst)" : "Nama E-Wallet (DANA, OVO, GoPay, ShopeePay)"}
        </label>
        <input
          type="text"
          required
          className="input"
          value={destinationName}
          onChange={(e) => setDestinationName(e.target.value)}
          placeholder={method === "bank" ? "Contoh: BCA" : "Contoh: DANA"}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {method === "bank" ? "Nomor Rekening" : "Nomor E-Wallet"}
        </label>
        <input
          type="text"
          required
          className="input"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Nama Pemilik</label>
        <input
          type="text"
          required
          className="input"
          value={accountHolder}
          onChange={(e) => setAccountHolder(e.target.value)}
          placeholder="Sesuai nama di rekening/akun"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Mengajukan..." : "Ajukan Withdraw"}
      </button>
    </form>
  );
}

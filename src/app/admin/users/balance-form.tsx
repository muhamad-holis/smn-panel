"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BalanceAdjustForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(sign: 1 | -1) {
    const value = Number(amount);
    if (!value) return;
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, amount: value * sign }),
    });
    setLoading(false);
    if (res.ok) {
      setAmount("");
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Gagal menyesuaikan saldo.");
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Jumlah"
        className="w-24 rounded-md border border-gray-300 px-2 py-1 text-xs"
      />
      <button
        disabled={loading}
        onClick={() => submit(1)}
        className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
      >
        + Tambah
      </button>
      <button
        disabled={loading}
        onClick={() => submit(-1)}
        className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
      >
        − Kurangi
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefillButton({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRefill() {
    setLoading(true);
    const res = await fetch(`/api/orders/${orderId}/refill`, { method: "POST" });
    setLoading(false);

    if (res.ok) {
      alert("Permintaan refill berhasil dikirim.");
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Gagal mengirim refill.");
    }
  }

  return (
    <button
      onClick={handleRefill}
      disabled={loading}
      className="rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50"
    >
      {loading ? "..." : "Refill"}
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncOrdersButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    const res = await fetch("/api/orders/sync", { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      alert(`Sinkron selesai. ${data.synced} dari ${data.total ?? 0} order diperbarui.`);
      router.refresh();
    } else {
      alert(data.error || "Gagal sinkronisasi order.");
    }
  }

  return (
    <button onClick={handleSync} disabled={loading} className="btn-secondary text-sm">
      {loading ? "Menyinkronkan..." : "🔄 Sync Status Order Sekarang"}
    </button>
  );
}

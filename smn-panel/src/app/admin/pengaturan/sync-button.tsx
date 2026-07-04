"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      const res = await fetch("/api/provider/services", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert(`Sinkron selesai. ${data.created} layanan baru, ${data.updated} diperbarui.`);
        router.refresh();
      } else {
        alert(data.error || `Gagal sinkronisasi (HTTP ${res.status}).`);
      }
    } catch (e: any) {
      alert("Gagal menghubungi server: " + (e?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleSync} disabled={loading} className="btn-primary">
      {loading ? "Menyinkronkan..." : "🔄 Sinkron dari Provider"}
    </button>
  );
}

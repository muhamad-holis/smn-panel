"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch("/api/provider/services", {
        method: "POST",
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert(`Sinkron selesai. ${data.created} layanan baru, ${data.updated} diperbarui.`);
        router.refresh();
      } else {
        alert(data.error || `Gagal sinkronisasi (HTTP ${res.status}).`);
      }
    } catch (e: any) {
      if (e?.name === "AbortError") {
        alert(
          "Sinkronisasi timeout (25 detik). Kemungkinan PROVIDER_API_URL/PROVIDER_API_KEY salah, atau provider tidak merespons. Cek Environment Variables di Vercel."
        );
      } else {
        alert("Gagal menghubungi server: " + (e?.message || "Unknown error"));
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <button onClick={handleSync} disabled={loading} className="btn-primary">
      {loading ? "Menyinkronkan..." : "🔄 Sinkron dari Provider"}
    </button>
  );
}

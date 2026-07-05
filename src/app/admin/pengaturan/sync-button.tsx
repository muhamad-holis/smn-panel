"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    const res = await fetch("/api/provider/services", { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      alert(
        `Sinkron selesai. ${data.created} layanan baru, ${data.updated} diperbarui.\n\nMata uang akun terdeteksi: ${data.detected_currency}${
          data.conversion_applied ? " (dikonversi ke IDR)" : " (dipakai langsung tanpa konversi)"
        }`
      );
      router.refresh();
    } else {
      alert(data.error || "Gagal sinkronisasi.");
    }
  }

  return (
    <button onClick={handleSync} disabled={loading} className="btn-primary">
      {loading ? "Menyinkronkan..." : "🔄 Sinkron dari Provider"}
    </button>
  );
}

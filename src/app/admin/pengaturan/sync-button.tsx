"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkKeyword, setCheckKeyword] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      const res = await fetch("/api/provider/services", { method: "POST" });
      const data = await res.json();

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
    } catch (e: any) {
      alert("Sinkron gagal atau timeout: " + (e?.message || "Coba lagi dalam beberapa saat."));
    } finally {
      setLoading(false);
    }
  }

  // DIAGNOSTIK: cek apakah kata kunci tertentu (mis. "tiktok") benar-benar ada
  // di RESPONS MENTAH API provider, sebelum disimpan ke DB. Ini menjawab
  // pertanyaan "kenapa kategori X tidak muncul di panel" — apakah karena
  // provider memang tidak pernah mengirimnya (perlu diaktifkan di sisi
  // MedanPedia), atau ada bug di proses sync kita.
  async function handleCheck() {
    if (!checkKeyword.trim()) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/provider/services?check=${encodeURIComponent(checkKeyword.trim())}`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Gagal cek ke provider.");
        return;
      }

      const d = data.diagnostic;
      if (!d || d.found_in_raw_api === 0) {
        alert(
          `Hasil cek kata kunci "${checkKeyword}":\n\nTIDAK ditemukan sama sekali di respons mentah API provider (dari ${data.total} layanan total).\n\nArtinya provider (MedanPedia) memang tidak mengirim layanan ini untuk akun/API key kamu — bukan bug di sync. Kemungkinan kategori ini perlu diaktifkan dulu lewat dashboard MedanPedia (menu pengaturan layanan reseller/API).`
        );
      } else {
        const sampleNames = d.sample.map((s: any) => `- ${s.name} (kategori: ${s.category})`).join("\n");
        alert(
          `Hasil cek kata kunci "${checkKeyword}":\n\nDitemukan ${d.found_in_raw_api} layanan di respons mentah API provider. Contoh:\n${sampleNames}\n\nKalau ini tidak muncul di panel setelah sync, berarti ada bug di proses simpan — beri tahu saya.`
        );
      }
      router.refresh();
    } catch (e: any) {
      alert("Gagal cek: " + (e?.message || "Coba lagi."));
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={handleSync} disabled={loading} className="btn-primary">
        {loading ? "Menyinkronkan..." : "🔄 Sinkron dari Provider"}
      </button>

      <input
        type="text"
        className="input w-40"
        placeholder="Cek kategori, mis. tiktok"
        value={checkKeyword}
        onChange={(e) => setCheckKeyword(e.target.value)}
      />
      <button onClick={handleCheck} disabled={checking || !checkKeyword.trim()} className="btn-secondary">
        {checking ? "Mengecek..." : "Cek ke Provider"}
      </button>
    </div>
  );
}

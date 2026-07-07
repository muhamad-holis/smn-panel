"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WithdrawalActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [note, setNote] = useState("");

  async function updateStatus(newStatus: "processing" | "paid" | "rejected", adminNote?: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, admin_note: adminNote }),
    });
    setLoading(false);

    if (res.ok) {
      router.refresh();
      setShowRejectNote(false);
      setNote("");
    } else {
      const data = await res.json();
      alert(data.error || "Gagal memperbarui status.");
    }
  }

  if (status === "paid" || status === "rejected") {
    return null;
  }

  if (showRejectNote) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Alasan ditolak (opsional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input text-xs"
        />
        <div className="flex gap-2">
          <button
            onClick={() => updateStatus("rejected", note)}
            disabled={loading}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Konfirmasi Tolak
          </button>
          <button onClick={() => setShowRejectNote(false)} className="rounded-lg border px-3 py-1.5 text-xs text-gray-500">
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending" && (
        <button
          onClick={() => updateStatus("processing")}
          disabled={loading}
          className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Proses
        </button>
      )}
      <button
        onClick={() => updateStatus("paid")}
        disabled={loading}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white"
      >
        Tandai Selesai
      </button>
      <button
        onClick={() => setShowRejectNote(true)}
        disabled={loading}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500"
      >
        Tolak
      </button>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatIDR, calcCharge } from "@/lib/utils";

type Service = {
  id: number;
  name: string;
  category: string | null;
  sell_rate: number;
  min_order: number;
  max_order: number;
  refill: boolean;
};

export default function OrderForm({ services }: { services: Service[] }) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState<number | "">(services[0]?.id ?? "");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState<number>(services[0]?.min_order ?? 100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selected = services.find((s) => s.id === serviceId);
  const estimate = useMemo(() => {
    if (!selected || !quantity) return 0;
    return calcCharge(selected.sell_rate, quantity);
  }, [selected, quantity]);

  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    const key = s.category || "Lainnya";
    (acc[key] ||= []).push(s);
    return acc;
  }, {});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selected) return;
    if (quantity < selected.min_order || quantity > selected.max_order) {
      setError(`Jumlah harus antara ${selected.min_order} - ${selected.max_order}`);
      return;
    }
    if (!link.trim()) {
      setError("Link tujuan wajib diisi.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_id: selected.id, link, quantity }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Terjadi kesalahan, coba lagi.");
      return;
    }

    setSuccess(`Order berhasil dibuat! ID Order: #${data.order.id}`);
    setLink("");
    setTimeout(() => router.push("/dashboard/pesanan"), 1200);
  }

  if (services.length === 0) {
    return <p className="card text-sm text-gray-500">Belum ada layanan tersedia saat ini.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Layanan</label>
        <select
          className="input"
          value={serviceId}
          onChange={(e) => {
            const id = Number(e.target.value);
            setServiceId(id);
            const s = services.find((x) => x.id === id);
            if (s) setQuantity(s.min_order);
          }}
        >
          {Object.entries(grouped).map(([category, list]) => (
            <optgroup key={category} label={category}>
              {list.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {formatIDR(s.sell_rate)}/1000
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Link Tujuan</label>
        <input
          type="text"
          className="input"
          placeholder="https://instagram.com/username"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Jumlah {selected && (
            <span className="font-normal text-gray-400">
              (min {selected.min_order}, maks {selected.max_order})
            </span>
          )}
        </label>
        <input
          type="number"
          className="input"
          value={quantity}
          min={selected?.min_order}
          max={selected?.max_order}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
        <span className="text-sm text-gray-600">Estimasi Biaya</span>
        <span className="text-lg font-bold text-brand-600">{formatIDR(estimate)}</span>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Memproses..." : "Buat Order"}
      </button>
    </form>
  );
}

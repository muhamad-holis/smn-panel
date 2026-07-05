"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatIDR, calcCharge } from "@/lib/utils";
import { RefreshCw, CheckCircle2, XCircle, Tag } from "lucide-react";

type Service = {
  id: number;
  name: string;
  category: string | null;
  sell_rate: number;
  min_order: number;
  max_order: number;
  refill: boolean;
  cancel: boolean;
  description: string | null;
};

export default function OrderForm({
  services,
  initialServiceId,
}: {
  services: Service[];
  initialServiceId?: number;
}) {
  const router = useRouter();
  const defaultService =
    (initialServiceId && services.find((s) => s.id === initialServiceId)) || services[0];

  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    const key = s.category || "Lainnya";
    (acc[key] ||= []).push(s);
    return acc;
  }, {});
  const categories = Object.keys(grouped);

  const [category, setCategory] = useState<string>(defaultService?.category || categories[0] || "");
  const [serviceId, setServiceId] = useState<number | "">(defaultService?.id ?? "");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState<number>(defaultService?.min_order ?? 100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const servicesInCategory = grouped[category] || [];
  const selected = services.find((s) => s.id === serviceId);
  const estimate = useMemo(() => {
    if (!selected || !quantity) return 0;
    return calcCharge(selected.sell_rate, quantity);
  }, [selected, quantity]);

  function handleCategoryChange(newCategory: string) {
    setCategory(newCategory);
    const firstInCategory = grouped[newCategory]?.[0];
    setServiceId(firstInCategory?.id ?? "");
    setQuantity(firstInCategory?.min_order ?? 100);
  }

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
    return <p className="card text-sm text-gray-400">Belum ada layanan tersedia saat ini.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">{success}</div>}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Kategori</label>
        <select className="input" value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat} ({grouped[cat].length})
            </option>
          ))}
        </select>
      </div>

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
          {servicesInCategory.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {formatIDR(s.sell_rate)}/1000
            </option>
          ))}
        </select>
      </div>

      {/* Kotak Deskripsi & Info Layanan — tampil begitu layanan dipilih, mengikuti alur MedanPedia */}
      {selected && (
        <div className="space-y-3 rounded-xl border border-gray-200 p-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-brand-500">
              <Tag size={13} />
              {selected.category}
            </p>
            <h3 className="mt-1 font-semibold text-gray-900">{selected.name}</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              Harga: <span className="font-semibold text-gray-900">{formatIDR(selected.sell_rate)}/1000</span>
            </p>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="mb-1 text-xs font-semibold text-gray-700">Deskripsi:</p>
            <p className="whitespace-pre-line text-sm text-gray-500">
              {selected.description || `Min ${selected.min_order} — Maks ${selected.max_order} per order.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              Min {selected.min_order} — Maks {selected.max_order}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                selected.refill ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
              }`}
            >
              <RefreshCw size={12} />
              {selected.refill ? "Refill Tersedia" : "Tanpa Refill"}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                selected.cancel ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"
              }`}
            >
              {selected.cancel ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {selected.cancel ? "Bisa Dibatalkan" : "Tidak Bisa Dibatalkan"}
            </span>
          </div>
        </div>
      )}

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
        <label className="mb-1.5 flex flex-wrap items-center gap-2 text-sm font-medium text-gray-700">
          Jumlah
          {selected && (
            <>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">
                Min: {selected.min_order}
              </span>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">
                Maks: {selected.max_order}
              </span>
            </>
          )}
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            className="input"
            value={quantity}
            min={selected?.min_order}
            max={selected?.max_order}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <button
            type="button"
            className="qty-btn shrink-0"
            onClick={() => setQuantity((q) => Math.min(q + 100, selected?.max_order ?? q + 100))}
          >
            +100
          </button>
          <button
            type="button"
            className="qty-btn shrink-0"
            onClick={() => setQuantity((q) => Math.min(q + 500, selected?.max_order ?? q + 500))}
          >
            +500
          </button>
          <button
            type="button"
            className="qty-btn shrink-0"
            onClick={() => setQuantity((q) => Math.min(q + 1000, selected?.max_order ?? q + 1000))}
          >
            +1000
          </button>
          <button
            type="button"
            className="qty-btn shrink-0"
            onClick={() => selected && setQuantity(selected.max_order)}
          >
            Max
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Biaya</label>
        <div className="input flex items-center bg-gray-50 font-semibold text-brand-600">
          {formatIDR(estimate)}
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Memproses..." : "Buat Order"}
      </button>
    </form>
  );
}

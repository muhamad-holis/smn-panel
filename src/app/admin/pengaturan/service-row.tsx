"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatIDR, applyMarkup } from "@/lib/utils";

type Service = {
  id: number;
  name: string;
  category: string | null;
  cost_rate: number;
  sell_rate: number;
  markup_percent: number;
  is_active: boolean;
};

export default function ServiceRow({ service }: { service: Service }) {
  const router = useRouter();
  const [markup, setMarkup] = useState(service.markup_percent);
  const [active, setActive] = useState(service.is_active);
  const [saving, setSaving] = useState(false);

  const previewSell = applyMarkup(service.cost_rate, markup);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markup_percent: markup, is_active: active }),
    });
    setSaving(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Gagal menyimpan.");
    }
  }

  return (
    <tr>
      <td className="py-2 font-medium text-gray-900">{service.name}</td>
      <td className="py-2 text-gray-500">{service.category}</td>
      <td className="py-2 text-gray-600">{formatIDR(service.cost_rate)}</td>
      <td className="py-2">
        <input
          type="number"
          value={markup}
          onChange={(e) => setMarkup(Number(e.target.value))}
          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs"
        />
      </td>
      <td className="py-2 font-semibold text-brand-600">{formatIDR(previewSell)}</td>
      <td className="py-2">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
      </td>
      <td className="py-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
        >
          {saving ? "..." : "Simpan"}
        </button>
      </td>
    </tr>
  );
}

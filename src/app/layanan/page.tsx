import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";

export const revalidate = 60;

export default async function LayananPage() {
  const supabase = createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, category, sell_rate, min_order, max_order, refill")
    .eq("is_active", true)
    .order("category", { ascending: true });

  const grouped = (services || []).reduce<Record<string, typeof services>>((acc, s) => {
    const key = s.category || "Lainnya";
    (acc[key] ||= []).push(s);
    return acc;
  }, {});

  return (
    <main className="mx-auto min-h-screen max-w-5xl bg-gray-50 px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-brand-600 hover:underline">
            ← Kembali
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Daftar Harga Layanan</h1>
        </div>
        <Link href="/register" className="btn-primary">
          Daftar &amp; Order
        </Link>
      </div>

      {Object.keys(grouped).length === 0 && (
        <p className="text-gray-400">Belum ada layanan tersedia. Silakan cek kembali nanti.</p>
      )}

      {Object.entries(grouped).map(([category, list]) => (
        <div key={category} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">{category}</h2>
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Layanan</th>
                  <th className="px-4 py-3">Harga / 1000</th>
                  <th className="px-4 py-3">Min</th>
                  <th className="px-4 py-3">Maks</th>
                  <th className="px-4 py-3">Refill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list!.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 font-semibold text-brand-600">{formatIDR(s.sell_rate)}</td>
                    <td className="px-4 py-3 text-gray-500">{s.min_order}</td>
                    <td className="px-4 py-3 text-gray-500">{s.max_order}</td>
                    <td className="px-4 py-3">
                      {s.refill ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">Ya</span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Tidak</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </main>
  );
}

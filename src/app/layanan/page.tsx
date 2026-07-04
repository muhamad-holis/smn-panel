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
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-brand-400 hover:underline">
            ← Kembali
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-white">Daftar Harga Layanan</h1>
        </div>
        <Link href="/register" className="btn-primary">
          Daftar &amp; Order
        </Link>
      </div>

      {Object.keys(grouped).length === 0 && (
        <p className="text-navy-400">Belum ada layanan tersedia. Silakan cek kembali nanti.</p>
      )}

      {Object.entries(grouped).map(([category, list]) => (
        <div key={category} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-white">{category}</h2>
          <div className="overflow-hidden rounded-xl border border-navy-800 bg-navy-900">
            <table className="w-full text-sm">
              <thead className="bg-navy-800/60 text-left text-xs uppercase text-navy-400">
                <tr>
                  <th className="px-4 py-3">Layanan</th>
                  <th className="px-4 py-3">Harga / 1000</th>
                  <th className="px-4 py-3">Min</th>
                  <th className="px-4 py-3">Maks</th>
                  <th className="px-4 py-3">Refill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {list!.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                    <td className="px-4 py-3 font-semibold text-brand-400">{formatIDR(s.sell_rate)}</td>
                    <td className="px-4 py-3 text-navy-400">{s.min_order}</td>
                    <td className="px-4 py-3 text-navy-400">{s.max_order}</td>
                    <td className="px-4 py-3">
                      {s.refill ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">Ya</span>
                      ) : (
                        <span className="rounded-full bg-navy-800 px-2 py-0.5 text-xs text-navy-400">Tidak</span>
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

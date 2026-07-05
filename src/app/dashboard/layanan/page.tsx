import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";
import PlatformIcon from "@/components/platform-icon";
import { RefreshCw, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LayananPage({
  searchParams,
}: {
  searchParams: { kategori?: string };
}) {
  const supabase = createClient();
  let query = supabase
    .from("services")
    .select("id, name, category, sell_rate, min_order, max_order, refill, cancel")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("sell_rate", { ascending: true });

  if (searchParams?.kategori) {
    query = query.eq("category", searchParams.kategori);
  }

  const { data: services } = await query;

  const grouped = (services || []).reduce<Record<string, typeof services>>((acc: any, s) => {
    const key = s.category || "Lainnya";
    (acc[key] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Layanan</h1>
          <p className="text-sm text-gray-500">Daftar lengkap layanan yang tersedia beserta harga per 1000.</p>
        </div>
        {searchParams?.kategori && (
          <Link href="/dashboard/layanan" className="btn-secondary text-xs">
            Reset filter: {searchParams.kategori}
          </Link>
        )}
      </div>

      {!services || services.length === 0 ? (
        <p className="card text-center text-sm text-gray-400">Belum ada layanan tersedia.</p>
      ) : (
        Object.entries(grouped).map(([category, list]: [string, any]) => (
          <div key={category}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{category}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s: any) => (
                <div key={s.id} className="card flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <PlatformIcon name={s.name || category} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">
                        Min {s.min_order} - Maks {s.max_order}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-gray-900">
                      {formatIDR(s.sell_rate)}
                      <span className="text-xs font-normal text-gray-400"> /1000</span>
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        s.refill ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.refill ? <RefreshCw size={11} /> : <XCircle size={11} />}
                      {s.refill ? "Refill" : "No Refill"}
                    </span>
                  </div>
                  <Link href={`/dashboard/order?service=${s.id}`} className="btn-primary w-full">
                    Order Sekarang
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

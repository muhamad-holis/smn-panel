import Link from "next/link";
import { fetchAllServices } from "@/lib/fetch-all-services";
import PlatformIcon from "@/components/platform-icon";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function KategoriPage() {
  const services = await fetchAllServices<{ category: string | null }>("category", { onlyActive: true });

  const counts = new Map<string, number>();
  for (const s of services || []) {
    const key = s.category || "Lainnya";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const categories = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kategori</h1>
        <p className="text-sm text-gray-500">Jelajahi layanan berdasarkan platform atau kategori.</p>
      </div>

      {categories.length === 0 ? (
        <p className="card text-center text-sm text-gray-400">Belum ada kategori layanan.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(([name, count]) => (
            <Link
              key={name}
              href={`/dashboard/layanan?kategori=${encodeURIComponent(name)}`}
              className="card flex items-center gap-3 hover:shadow-md"
            >
              <PlatformIcon name={name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{name}</p>
                <p className="text-xs text-gray-400">{count} layanan</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-gray-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

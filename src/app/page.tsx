import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, category, sell_rate, min_order, max_order")
    .eq("is_active", true)
    .order("sell_rate", { ascending: true })
    .limit(6);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-brand-600">SMM Panel</span>
          <nav className="flex items-center gap-3">
            <Link href="/layanan" className="text-sm font-medium text-gray-500 hover:text-gray-900">
              Daftar Harga
            </Link>
            <Link href="/login" className="btn-secondary">
              Masuk
            </Link>
            <Link href="/register" className="btn-primary">
              Daftar Gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Booster Media Sosial <span className="text-brand-500">Termurah &amp; Tercepat</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
          Followers, Likes, Views, Comments untuk Instagram, TikTok, YouTube, Facebook, dan lainnya.
          Proses otomatis 24 jam, garansi refill.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            Mulai Sekarang
          </Link>
          <Link href="/layanan" className="btn-secondary px-6 py-3 text-base">
            Lihat Daftar Harga
          </Link>
        </div>
      </section>

      {/* Featured services */}
      {services && services.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Layanan Termurah</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.id} className="card">
                <p className="text-xs font-medium uppercase tracking-wide text-brand-500">
                  {s.category}
                </p>
                <p className="mt-1 font-semibold text-gray-900">{s.name}</p>
                <p className="mt-3 text-lg font-bold text-gray-900">
                  {formatIDR(s.sell_rate)} <span className="text-sm font-normal text-gray-400">/ 1000</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Min {s.min_order} - Maks {s.max_order}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} SMM Panel. Semua hak dilindungi.
      </footer>
    </main>
  );
}

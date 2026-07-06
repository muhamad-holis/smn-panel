import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";
import PlatformIcon from "@/components/platform-icon";
import TestimonialCarousel from "@/components/testimonial-carousel";
import FaqAccordion from "@/components/faq-accordion";
import { Zap, ShieldCheck, Headphones, ArrowRight, ChevronRight, MessageCircle } from "lucide-react";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, category, sell_rate, min_order, max_order, refill")
    .eq("is_active", true)
    .gt("sell_rate", 0)
    .not("name", "ilike", "%test%")
    .order("sell_rate", { ascending: true })
    .limit(6);

  const [{ count: activeServiceCount }, { count: processedOrderCount }, { data: categoryRows }] =
    await Promise.all([
      supabase
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .gt("sell_rate", 0),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("services").select("category").eq("is_active", true).gt("sell_rate", 0),
    ]);

  const categoryCounts = new Map<string, number>();
  for (const row of categoryRows || []) {
    const key = (row.category || "Lainnya").trim();
    categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
  }
  const topCategories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const stats = [
    { label: "Layanan Aktif", value: (activeServiceCount ?? 0).toLocaleString("id-ID") + "+" },
    { label: "Kategori Platform", value: categoryCounts.size.toLocaleString("id-ID") },
    { label: "Pesanan Diproses", value: (processedOrderCount ?? 0).toLocaleString("id-ID") },
  ];

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-xl font-extrabold tracking-tight text-gray-900">
            Artholic<span className="text-brand-500"> Panel</span>
          </span>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/layanan" className="hidden text-sm font-medium text-gray-500 hover:text-gray-900 sm:block">
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

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-indigo-950">
        <NetworkMotif />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-16 sm:pt-20 lg:grid-cols-2 lg:gap-6 lg:pb-24">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-brand-100">
              <Zap size={13} className="text-brand-300" />
              Sinkron otomatis dari provider — harga selalu update
            </span>
            <h1 className="mx-auto mt-6 max-w-xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:mx-0">
              Satu panel untuk seluruh <span className="text-brand-300">pertumbuhan sosial media</span> kamu
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-brand-100/80 lg:mx-0">
              Followers, likes, views, dan komentar untuk Instagram, TikTok, YouTube, Facebook, dan lainnya.
              Order otomatis 24 jam, harga transparan, garansi refill.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/register" className="btn-primary px-6 py-3 text-base shadow-glow">
                Mulai Sekarang <ArrowRight size={16} className="ml-1.5" />
              </Link>
              <Link
                href="/layanan"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Lihat Daftar Harga
              </Link>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-xs lg:block">
            <Image
              src="/mascot-hero.webp"
              alt="Artholic Panel"
              width={391}
              height={700}
              className="mx-auto drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border-2 border-dashed border-brand-200 bg-white px-6 py-7 text-center"
            >
              <p className="font-display text-3xl font-extrabold text-brand-600 sm:text-4xl">{s.value}</p>
              <p className="mt-1.5 text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-[280px_1fr] lg:gap-14">
          <div className="mx-auto w-full max-w-[220px] lg:mx-0">
            <Image src="/mascot-about.webp" alt="Tentang Artholic Panel" width={392} height={600} className="mx-auto" />
          </div>
          <div className="text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Tentang Kami</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-gray-900 sm:text-3xl">
              Artholic Panel — SMM Panel Indonesia Terbaik dan Termurah
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-500 sm:text-base">
              <span className="font-semibold text-gray-800">Artholic Panel</span> adalah platform SMM Panel
              Indonesia yang menyediakan berbagai layanan social media marketing untuk membantu bisnis dan
              reseller berkembang. Dengan bergabung bersama kami, kamu bisa menjadi reseller jasa media sosial
              seperti <span className="font-semibold text-gray-800">jasa penambah followers, likes, views, dan
              komentar</span>. Tersedia layanan untuk platform terpopuler seperti{" "}
              <span className="font-semibold text-gray-800">Instagram, TikTok, YouTube, Facebook</span>, dan
              lainnya.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-gray-500 sm:text-base">
              Semua order diproses otomatis 24 jam nonstop, harga selalu mengikuti update dari provider, dan
              dilengkapi garansi refill untuk layanan yang mendukung.
            </p>
            <a
              href="https://wa.me/6283803888990"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm"
            >
              <MessageCircle size={16} /> Kontak Kami
            </a>
          </div>
        </div>
      </section>

      {topCategories.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 sm:pt-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Jelajahi</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-gray-900">Kategori Layanan</h2>
            </div>
            <Link href="/layanan" className="hidden items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 sm:flex">
              Lihat semua <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {topCategories.map(([name, count]) => (
              <Link
                key={name}
                href={`/layanan?kategori=${encodeURIComponent(name)}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <PlatformIcon name={name} />
                <div className="w-full min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400">{count} layanan</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Kenapa panel ini</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-gray-900">Dibangun untuk reseller yang serius</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Proses Otomatis 24 Jam",
                desc: "Order langsung diteruskan ke provider begitu dibuat, tanpa perlu menunggu admin approve satu-satu.",
              },
              {
                icon: ShieldCheck,
                title: "Harga & Stok Transparan",
                desc: "Katalog tersinkron otomatis dari provider, jadi harga dan ketersediaan layanan selalu mengikuti kondisi terkini.",
              },
              {
                icon: Headphones,
                title: "Riwayat & Status Jelas",
                desc: "Pantau status tiap pesanan secara real-time dari dashboard, lengkap dengan opsi refill kalau layanannya mendukung.",
              },
            ].map((f) => (
              <div key={f.title} className="card">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <f.icon size={20} />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {services && services.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Harga terbaik</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-gray-900">Layanan Termurah</h2>
            </div>
            <Link href="/layanan" className="hidden items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 sm:flex">
              Lihat semua <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.id} className="card flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <PlatformIcon name={s.category || s.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-brand-500">{s.category}</p>
                    <p className="truncate font-semibold text-gray-900">{s.name}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {formatIDR(s.sell_rate)} <span className="text-sm font-normal text-gray-400">/ 1000</span>
                </p>
                <p className="text-xs text-gray-400">
                  Min {s.min_order} — Maks {s.max_order}{s.refill ? " · Refill tersedia" : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Testimoni</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-gray-900">Apa Kata Mereka?</h2>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">FAQ</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-gray-900">Pertanyaan Umum</h2>
          <p className="mt-2 text-sm text-gray-500">Berikut telah kami rangkum beberapa pertanyaan yang paling sering ditanyakan.</p>
        </div>
        <FaqAccordion />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-600 to-indigo-600 px-6 py-14 text-center shadow-glow sm:px-14">
          <div className="pointer-events-none absolute -right-10 -top-10 hidden opacity-90 sm:block">
            <Image src="/mascot-badge.webp" alt="" width={180} height={180} aria-hidden />
          </div>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Siap naikkan performa sosial media kamu?</h2>
          <p className="max-w-md text-sm text-brand-100">
            Daftar gratis, top up saldo, dan mulai order dalam hitungan menit.
          </p>
          <Link href="/register" className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-base font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50">
            Daftar Gratis <ArrowRight size={16} className="ml-1.5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white py-10 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Artholic Panel. Semua hak dilindungi.
      </footer>
    </main>
  );
}

function NetworkMotif() {
  const nodes = [
    { x: 8, y: 22, delay: "0s" },
    { x: 22, y: 62, delay: "0.4s" },
    { x: 38, y: 15, delay: "0.8s" },
    { x: 55, y: 48, delay: "1.2s" },
    { x: 70, y: 20, delay: "0.2s" },
    { x: 85, y: 58, delay: "1.6s" },
    { x: 94, y: 30, delay: "1s" },
    { x: 15, y: 85, delay: "0.6s" },
    { x: 63, y: 82, delay: "1.4s" },
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [1, 7], [3, 8],
  ];

  return (
    <div className="pointer-events-none absolute inset-0 opacity-[0.55]" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="white"
            strokeOpacity="0.15"
            strokeWidth="0.15"
          />
        ))}
      </svg>
      {nodes.map((n, i) => (
        <span
          key={i}
          className="absolute h-2 w-2 animate-pulse-node rounded-full bg-brand-300"
          style={{ left: `${n.x}%`, top: `${n.y}%`, animationDelay: n.delay }}
        />
      ))}
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate, statusBadgeClass } from "@/lib/utils";
import OrdersLineChart from "./charts/orders-line-chart";
import OrderStatusDonut from "./charts/status-donut-chart";
import {
  Wallet,
  ShoppingCart,
  CheckCircle2,
  Clock,
  ShoppingBag,
  PlusCircle,
  MessageCircleQuestion,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

function statusGroup(status: string): "Selesai" | "Proses" | "Pending" | "Bermasalah" {
  if (status === "Completed") return "Selesai";
  if (status === "Processing" || status === "In progress" || status === "Partial") return "Proses";
  if (status === "Pending") return "Pending";
  return "Bermasalah"; // Error, Canceled
}

export default async function DashboardOverview() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("full_name, balance").eq("id", user!.id).single();

  // Ambil order 90 hari terakhir untuk dipakai di semua kartu/grafik/tabel di halaman ini
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data: orders } = await supabase
    .from("orders")
    .select("id, quantity, charge, status, created_at, services(name)")
    .eq("user_id", user!.id)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  const allOrders = orders || [];

  const totalOrders = allOrders.length;
  const completedOrders = allOrders.filter((o) => o.status === "Completed").length;
  const pendingOrders = allOrders.filter((o) =>
    ["Pending", "Processing", "In progress"].includes(o.status)
  ).length;

  // Data grafik garis: jumlah order per hari, 7 hari terakhir
  const dayLabels: { key: string; day: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayLabels.push({
      key: d.toISOString().slice(0, 10),
      day: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
    });
  }
  const lineData = dayLabels.map(({ key, day }) => ({
    day,
    total: allOrders.filter((o) => o.created_at.slice(0, 10) === key).length,
  }));

  // Data donut: distribusi status
  const statusCounts: Record<string, number> = { Selesai: 0, Proses: 0, Pending: 0, Bermasalah: 0 };
  for (const o of allOrders) statusCounts[statusGroup(o.status)]++;
  const donutData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Layanan terlaris (berdasarkan quantity yang pernah dipesan user ini)
  const serviceTotals = new Map<string, number>();
  for (const o of allOrders) {
    const name = (o as any).services?.name || "Layanan";
    serviceTotals.set(name, (serviceTotals.get(name) || 0) + o.quantity);
  }
  const topServices = [...serviceTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recentOrders = allOrders.slice(0, 5);

  const stats = [
    {
      label: "Total Saldo",
      value: formatIDR(profile?.balance || 0),
      icon: Wallet,
      color: "from-brand-500 to-purple-500",
    },
    {
      label: "Total Order",
      value: totalOrders.toLocaleString("id-ID"),
      icon: ShoppingCart,
      color: "from-blue-500 to-blue-400",
    },
    {
      label: "Order Selesai",
      value: completedOrders.toLocaleString("id-ID"),
      icon: CheckCircle2,
      color: "from-green-500 to-emerald-400",
    },
    {
      label: "Order Pending",
      value: pendingOrders.toLocaleString("id-ID"),
      icon: Clock,
      color: "from-amber-500 to-orange-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Selamat datang kembali, {profile?.full_name?.split(" ")[0] || "kamu"}! 👋
        </h1>
        <p className="text-sm text-gray-500">Ini ringkasan aktivitas akun kamu.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white`}
            >
              <s.icon size={18} />
            </div>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900 sm:text-xl">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-1 font-semibold text-gray-900">Statistik Order</h2>
          <p className="mb-2 text-xs text-gray-400">7 hari terakhir</p>
          <OrdersLineChart data={lineData} />
        </div>
        <div className="card">
          <h2 className="mb-4 font-semibold text-gray-900">Status Order</h2>
          <OrderStatusDonut data={donutData} />
        </div>
      </div>

      {/* Layanan terlaris & Recent order */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold text-gray-900">Layanan Terlaris Kamu</h2>
          {topServices.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Belum ada order.</p>
          ) : (
            <div className="space-y-3">
              {topServices.map(([name, qty], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-600">
                    {i + 1}
                  </span>
                  <p className="flex-1 truncate text-sm font-medium text-gray-800">{name}</p>
                  <span className="text-xs font-semibold text-gray-500">{qty.toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Order Terbaru</h2>
            <Link href="/dashboard/pesanan" className="text-sm font-medium text-brand-600 hover:underline">
              Lihat semua
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Belum ada order.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">{o.services?.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(o.created_at)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(o.status)}`}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 font-semibold text-gray-900">Aksi Cepat</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Link href="/dashboard/order" className="card flex items-center gap-3 hover:shadow-md">
            <ShoppingBag className="text-brand-500" size={20} />
            <span className="text-sm font-medium text-gray-800">Order Baru</span>
          </Link>
          <Link href="/dashboard/topup" className="card flex items-center gap-3 hover:shadow-md">
            <PlusCircle className="text-green-500" size={20} />
            <span className="text-sm font-medium text-gray-800">Tambah Saldo</span>
          </Link>
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noreferrer"
            className="card flex items-center gap-3 hover:shadow-md"
          >
            <MessageCircleQuestion className="text-blue-500" size={20} />
            <span className="text-sm font-medium text-gray-800">Bantuan</span>
          </a>
        </div>
      </div>

      {/* Announcement */}
      <div className="card flex items-start gap-3 bg-gradient-to-br from-brand-50 to-purple-50">
        <Sparkles className="mt-0.5 shrink-0 text-brand-500" size={20} />
        <div>
          <p className="text-sm font-semibold text-gray-900">Selalu ada garansi refill</p>
          <p className="text-sm text-gray-600">
            Layanan dengan badge refill otomatis dijamin diisi ulang kalau ada penurunan jumlah.
          </p>
        </div>
      </div>
    </div>
  );
}

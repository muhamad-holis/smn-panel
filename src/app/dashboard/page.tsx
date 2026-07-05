import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate, statusBadgeClass, statusLabel, orderCode, percentChange } from "@/lib/utils";
import PlatformIcon from "@/components/platform-icon";
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

  const now = new Date();
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const inThisMonth = (d: string) => new Date(d) >= startThisMonth;
  const inLastMonth = (d: string) => new Date(d) >= startLastMonth && new Date(d) < startThisMonth;

  const totalOrders = allOrders.length;
  const completedOrders = allOrders.filter((o) => o.status === "Completed").length;
  const pendingOrders = allOrders.filter((o) =>
    ["Pending", "Processing", "In progress"].includes(o.status)
  ).length;

  const totalThisMonth = allOrders.filter((o) => inThisMonth(o.created_at)).length;
  const totalLastMonth = allOrders.filter((o) => inLastMonth(o.created_at)).length;
  const completedThisMonth = allOrders.filter((o) => o.status === "Completed" && inThisMonth(o.created_at)).length;
  const completedLastMonth = allOrders.filter((o) => o.status === "Completed" && inLastMonth(o.created_at)).length;
  const pendingThisMonth = allOrders.filter(
    (o) => ["Pending", "Processing", "In progress"].includes(o.status) && inThisMonth(o.created_at)
  ).length;
  const pendingLastMonth = allOrders.filter(
    (o) => ["Pending", "Processing", "In progress"].includes(o.status) && inLastMonth(o.created_at)
  ).length;

  // Saldo masuk (topup) bulan ini vs bulan lalu, dipakai sebagai indikator tren saldo
  const { data: topups } = await supabase
    .from("topups")
    .select("final_amount, created_at")
    .eq("user_id", user!.id)
    .eq("status", "paid")
    .gte("created_at", startLastMonth.toISOString());
  const topupThisMonth = (topups || [])
    .filter((t) => inThisMonth(t.created_at))
    .reduce((sum, t) => sum + Number(t.final_amount), 0);
  const topupLastMonth = (topups || [])
    .filter((t) => inLastMonth(t.created_at))
    .reduce((sum, t) => sum + Number(t.final_amount), 0);

  const deltaOrders = percentChange(totalThisMonth, totalLastMonth);
  const deltaCompleted = percentChange(completedThisMonth, completedLastMonth);
  const deltaPending = percentChange(pendingThisMonth, pendingLastMonth);
  const deltaBalance = percentChange(topupThisMonth, topupLastMonth);

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

  function deltaText(delta: number | null) {
    if (delta === null) return "Belum ada data bulan lalu";
    const sign = delta >= 0 ? "+" : "";
    return `${sign}${delta}% dari bulan lalu`;
  }
  function deltaColor(delta: number | null) {
    if (delta === null) return "text-gray-400";
    return delta >= 0 ? "text-green-600" : "text-red-500";
  }

  const stats = [
    {
      label: "Total Saldo",
      value: formatIDR(profile?.balance || 0),
      icon: Wallet,
      bg: "bg-brand-500",
      delta: deltaBalance,
    },
    {
      label: "Total Order",
      value: totalOrders.toLocaleString("id-ID"),
      icon: ShoppingCart,
      bg: "bg-blue-500",
      delta: deltaOrders,
    },
    {
      label: "Order Selesai",
      value: completedOrders.toLocaleString("id-ID"),
      icon: CheckCircle2,
      bg: "bg-green-500",
      delta: deltaCompleted,
    },
    {
      label: "Order Pending",
      value: pendingOrders.toLocaleString("id-ID"),
      icon: Clock,
      bg: "bg-orange-500",
      delta: deltaPending,
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
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${s.bg} text-white`}>
              <s.icon size={18} />
            </div>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900 sm:text-xl">{s.value}</p>
            <p className={`mt-1 text-[11px] font-medium ${deltaColor(s.delta)}`}>{deltaText(s.delta)}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Statistik Order</h2>
            <span className="rounded-xl border border-gray-100 px-3 py-1 text-xs text-gray-500">7 Hari Terakhir</span>
          </div>
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Layanan Terlaris</h2>
            <Link href="/dashboard/layanan" className="text-sm font-medium text-brand-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          {topServices.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Belum ada order.</p>
          ) : (
            <div className="space-y-4">
              {topServices.map(([name, qty], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-600">
                    {i + 1}
                  </span>
                  <PlatformIcon name={name} size="sm" />
                  <p className="flex-1 truncate text-sm font-medium text-gray-800">{name}</p>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Terjual</p>
                    <p className="text-xs font-semibold text-gray-700">{qty.toLocaleString("id-ID")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Order</h2>
            <Link href="/dashboard/pesanan" className="text-sm font-medium text-brand-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Belum ada order.</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center gap-3">
                  <PlatformIcon name={o.services?.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{o.services?.name}</p>
                    <p className="text-xs text-gray-400">
                      {orderCode(o.id)} · {formatDate(o.created_at)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(o.status)}`}>
                    {statusLabel(o.status)}
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
          <Link href="/dashboard/support" className="card flex items-center gap-3 hover:shadow-md">
            <MessageCircleQuestion className="text-blue-500" size={20} />
            <span className="text-sm font-medium text-gray-800">Bantuan</span>
          </Link>
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

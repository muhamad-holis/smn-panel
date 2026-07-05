import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";
import DashboardNav from "./nav";
import UserMenu from "./user-menu";
import { Search, Bell, Plus } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, balance, role")
    .eq("id", user.id)
    .single();

  // Dipakai sebagai badge notifikasi lonceng: jumlah order yang masih pending/diproses
  const { count: pendingCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["Pending", "Processing", "In progress"]);

  const displayName = profile?.full_name || profile?.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const tierLabel = profile?.role === "admin" ? "Admin" : "Member";

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <DashboardNav isAdmin={profile?.role === "admin"} />

      <div className="flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-4 pl-16 lg:pl-6">
          <div className="hidden max-w-xs flex-1 items-center gap-2 rounded-2xl bg-gray-50 px-3.5 py-2.5 text-sm text-gray-400 sm:flex">
            <Search size={16} />
            <span>Cari layanan, order...</span>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
            <Link
              href="/dashboard/topup"
              className="hidden items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-2 sm:flex"
            >
              <div className="text-left">
                <p className="text-[10px] leading-none text-brand-500">Saldo Anda</p>
                <p className="text-sm font-bold leading-tight text-gray-900">
                  {formatIDR(profile?.balance || 0)}
                </p>
              </div>
              <span className="ml-1 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 px-2.5 py-1.5 text-xs font-semibold text-white">
                <Plus size={13} /> Top Up
              </span>
            </Link>

            <Link
              href="/dashboard/pesanan"
              className="relative rounded-2xl border border-gray-100 p-2.5 text-gray-500 hover:bg-gray-50"
              aria-label="Notifikasi order"
            >
              <Bell size={18} />
              {!!pendingCount && pendingCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </Link>

            <UserMenu displayName={displayName} initial={initial} tierLabel={tierLabel} />
          </div>
        </header>

        {/* Saldo mobile (search & saldo desktop disembunyikan di layar kecil) */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 sm:hidden">
          <p className="text-sm text-gray-500">
            Halo, <span className="font-semibold text-gray-900">{displayName}</span>
          </p>
          <Link
            href="/dashboard/topup"
            className="flex items-center gap-1.5 rounded-2xl bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"
          >
            {formatIDR(profile?.balance || 0)} <Plus size={12} />
          </Link>
        </div>

        <main className="p-4 sm:p-6">{children}</main>

        <footer className="border-t border-gray-100 bg-white px-4 py-6 text-center text-xs text-gray-400 sm:px-6">
          © {new Date().getFullYear()} Artholic Studio. All rights reserved. · Panel SMM Terbaik &amp; Terpercaya di Indonesia
        </footer>
      </div>
    </div>
  );
}

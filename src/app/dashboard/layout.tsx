import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";
import DashboardNav from "./nav";
import { Search, Bell, Plus, ChevronDown } from "lucide-react";

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

  const displayName = profile?.full_name || profile?.email || "";
  const initial = displayName.charAt(0).toUpperCase();

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
              <span className="ml-1 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-brand-500 to-purple-500 px-2.5 py-1.5 text-xs font-semibold text-white">
                <Plus size={13} /> Top Up
              </span>
            </Link>

            <button className="relative rounded-2xl border border-gray-100 p-2.5 text-gray-500 hover:bg-gray-50">
              <Bell size={18} />
            </button>

            <div className="flex items-center gap-2 rounded-2xl border border-gray-100 py-1.5 pl-1.5 pr-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-400 text-xs font-bold text-white">
                {initial}
              </div>
              <span className="hidden max-w-[100px] truncate text-sm font-medium text-gray-700 md:inline">
                {displayName}
              </span>
              <ChevronDown size={14} className="hidden text-gray-400 md:inline" />
            </div>
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
      </div>
    </div>
  );
}

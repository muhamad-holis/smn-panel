import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";
import DashboardNav from "./nav";
import UserMenu from "./user-menu";
import NotificationBell from "./notification-bell";
import { Plus } from "lucide-react";

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

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, message, link, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  const displayName = profile?.full_name || profile?.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const tierLabel = profile?.role === "admin" ? "Admin" : "Member";

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <DashboardNav isAdmin={profile?.role === "admin"} />

      <div className="flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-4 pl-16 lg:pl-6">
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
              <Image src="/mascot.webp" alt="Artholic Panel" fill sizes="32px" />
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-900">
              ARTHOLIC<span className="text-brand-500"> PANEL</span>
            </span>
          </Link>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
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

            <NotificationBell initialNotifications={notifications || []} unreadCount={unreadCount} />

            <UserMenu displayName={displayName} initial={initial} tierLabel={tierLabel} />
          </div>
        </header>

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
          © {new Date().getFullYear()} Artholic Panel. All rights reserved. · Panel SMM Terbaik &amp; Terpercaya di Indonesia
        </footer>
      </div>
    </div>
  );
}

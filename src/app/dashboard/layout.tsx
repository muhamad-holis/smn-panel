import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";
import DashboardNav from "./nav";
import { Wallet } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-navy-950 lg:flex">
      <DashboardNav isAdmin={profile?.role === "admin"} />

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-navy-800 bg-navy-900/70 px-6 py-4 pl-16 backdrop-blur-sm lg:pl-6">
          <div>
            <p className="text-sm text-navy-400">Selamat datang,</p>
            <p className="font-semibold text-white">{profile?.full_name || profile?.email}</p>
          </div>
          <Link
            href="/dashboard/topup"
            className="flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-200 transition hover:bg-brand-500/20"
          >
            <Wallet size={16} />
            {formatIDR(profile?.balance || 0)}
          </Link>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

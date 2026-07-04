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
    <div className="min-h-screen bg-gray-50 lg:flex">
      <DashboardNav isAdmin={profile?.role === "admin"} />

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 pl-16 lg:pl-6">
          <div>
            <p className="text-sm text-gray-500">Selamat datang,</p>
            <p className="font-semibold text-gray-900">{profile?.full_name || profile?.email}</p>
          </div>
          <Link
            href="/dashboard/topup"
            className="flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
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

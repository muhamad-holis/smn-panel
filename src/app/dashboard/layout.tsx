import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";
import DashboardNav from "./nav";

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
      <aside className="border-b border-gray-200 bg-white lg:w-64 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-6 py-5 lg:block">
          <Link href="/" className="text-lg font-bold text-brand-600">
            SMM Panel
          </Link>
        </div>
        <DashboardNav isAdmin={profile?.role === "admin"} />
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <p className="text-sm text-gray-500">Selamat datang,</p>
            <p className="font-semibold text-gray-900">{profile?.full_name || profile?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Saldo</p>
            <p className="text-lg font-bold text-brand-600">{formatIDR(profile?.balance || 0)}</p>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

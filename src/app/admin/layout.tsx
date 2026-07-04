import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/users", label: "Pengguna" },
  { href: "/admin/pengaturan", label: "Layanan & Harga" },
  { href: "/admin/transaksi", label: "Transaksi" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-purple-700">Admin - SMM Panel</span>
            <nav className="hidden gap-1 sm:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">
            ← Kembali ke Dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

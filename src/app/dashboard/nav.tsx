"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "Ringkasan", icon: "🏠" },
  { href: "/dashboard/order", label: "Buat Order", icon: "🛒" },
  { href: "/dashboard/pesanan", label: "Riwayat Order", icon: "📋" },
  { href: "/dashboard/topup", label: "Top Up Saldo", icon: "💳" },
];

export default function DashboardNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="space-y-1 px-3 pb-6">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            pathname === link.href
              ? "bg-brand-50 text-brand-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span>{link.icon}</span>
          {link.label}
        </Link>
      ))}

      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-50"
        >
          <span>🛠️</span>
          Panel Admin
        </Link>
      )}

      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <span>🚪</span>
        Keluar
      </button>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Wallet,
  UserCircle,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/order", label: "Order Baru", icon: ShoppingCart },
  { href: "/dashboard/pesanan", label: "Riwayat Order", icon: ClipboardList },
  { href: "/dashboard/topup", label: "Deposit", icon: Wallet },
  { href: "/dashboard/profil", label: "Profil & Keamanan", icon: UserCircle },
];

export default function DashboardNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-2xl bg-white p-2 text-gray-700 shadow-md ring-1 ring-gray-100 lg:hidden"
        aria-label="Buka menu"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-100 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-400 text-sm font-bold text-white shadow-sm">
              A
            </div>
            <div>
              <p className="text-sm font-bold leading-tight tracking-tight text-gray-900">
                ARTHOLIC<span className="text-brand-500"> STUDIO</span>
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">SMM Panel</p>
            </div>
          </Link>
          <button onClick={() => setOpen(false)} className="text-gray-400 lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-gradient-to-r from-brand-500 to-purple-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                {link.label}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-50"
            >
              <Shield size={18} strokeWidth={2} />
              Panel Admin
            </Link>
          )}
        </nav>

        <div className="p-3">
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-purple-500 p-4 text-white shadow-sm">
            <p className="text-sm font-bold">Jadi Reseller</p>
            <p className="mt-0.5 text-xs text-brand-100">Dapatkan harga khusus reseller</p>
            <Link
              href="/layanan"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/25"
            >
              Selengkapnya
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-100 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} strokeWidth={2} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}

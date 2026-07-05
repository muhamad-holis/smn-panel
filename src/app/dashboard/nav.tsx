"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Layers,
  Grid3x3,
  Wallet,
  Receipt,
  Users,
  Code2,
  Settings,
  LifeBuoy,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/order", label: "Order Baru", icon: ShoppingCart },
  { href: "/dashboard/pesanan", label: "Daftar Order", icon: ClipboardList },
  { href: "/dashboard/layanan", label: "Layanan", icon: Layers },
  { href: "/dashboard/kategori", label: "Kategori", icon: Grid3x3 },
  { href: "/dashboard/topup", label: "Deposit", icon: Wallet },
  { href: "/dashboard/transaksi", label: "Riwayat Transaksi", icon: Receipt },
  { href: "/dashboard/afiliasi", label: "Afiliasi", icon: Users },
  { href: "/dashboard/api", label: "API", icon: Code2 },
  { href: "/dashboard/profil", label: "Pengaturan", icon: Settings },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy, badge: "Baru" },
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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto border-r border-gray-100 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-sm">
              <Image src="/mascot-placeholder.png" alt="Artholic Studio" fill sizes="36px" />
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
                    ? "bg-gradient-to-r from-brand-500 to-purple-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                <span className="flex-1">{link.label}</span>
                {link.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      active ? "bg-white/20 text-white" : "bg-brand-50 text-brand-600"
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
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
          <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 p-4 text-white shadow-sm">
            <p className="text-sm font-bold">Jadi Reseller Artholic Studio</p>
            <p className="mt-0.5 text-xs text-white/80">Dapatkan keuntungan lebih besar dengan harga spesial reseller</p>
            <Link
              href="/dashboard/afiliasi"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/25"
            >
              Daftar Sekarang
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

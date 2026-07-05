"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, UserCircle, LifeBuoy, LogOut } from "lucide-react";

export default function UserMenu({
  displayName,
  initial,
  tierLabel,
}: {
  displayName: string;
  initial: string;
  tierLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-2xl border border-gray-100 py-1.5 pl-1.5 pr-2.5 hover:bg-gray-50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 text-xs font-bold text-white">
          {initial}
        </div>
        <div className="hidden text-left md:block">
          <span className="block max-w-[110px] truncate text-sm font-medium leading-tight text-gray-700">
            {displayName}
          </span>
          <span className="inline-block rounded-full bg-brand-50 px-1.5 py-0 text-[10px] font-semibold leading-tight text-brand-600">
            {tierLabel}
          </span>
        </div>
        <ChevronDown size={14} className="hidden text-gray-400 md:inline" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1.5 shadow-lg">
          <Link
            href="/dashboard/profil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <UserCircle size={16} /> Profil &amp; Keamanan
          </Link>
          <Link
            href="/dashboard/support"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <LifeBuoy size={16} /> Support
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      )}
    </div>
  );
}

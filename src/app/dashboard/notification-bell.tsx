"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Package, Wallet, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type Notif = {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

const ICONS: Record<string, typeof Bell> = {
  order: Package,
  topup: Wallet,
  affiliate: Users,
};

export default function NotificationBell({
  initialNotifications,
  unreadCount,
}: {
  initialNotifications: Notif[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unread, setUnread] = useState(unreadCount);
  const supabase = createClient();

  async function handleToggle() {
    const next = !open;
    setOpen(next);

    if (next && unread > 0) {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
      if (unreadIds.length > 0) {
        await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
      }
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative rounded-2xl border border-gray-100 p-2.5 text-gray-500 hover:bg-gray-50"
        aria-label="Notifikasi"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">Notifikasi</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-400">Belum ada notifikasi.</p>
              ) : (
                notifications.map((n) => {
                  const Icon = ICONS[n.type] || Bell;
                  const body = (
                    <div
                      className={`flex gap-3 border-b border-gray-50 px-4 py-3 last:border-0 ${
                        !n.is_read ? "bg-brand-50/40" : ""
                      }`}
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{n.message}</p>
                        <p className="mt-1 text-[10px] text-gray-400">{formatDate(n.created_at)}</p>
                      </div>
                    </div>
                  );

                  return n.link ? (
                    <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>
                      {body}
                    </Link>
                  ) : (
                    <div key={n.id}>{body}</div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

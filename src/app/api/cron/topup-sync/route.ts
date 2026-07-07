import { NextRequest, NextResponse } from "next/server";
import { syncPendingTopups } from "@/lib/topup-sync";

/**
 * Dipanggil otomatis oleh Vercel Cron (lihat vercel.json).
 * Catatan: di Vercel Hobby plan, cron dibatasi maksimal 1x/hari, jadi ini
 * hanya jaring pengaman harian. Sinkronisasi yang lebih cepat ditangani oleh:
 * 1. Polling client-side di halaman /dashboard/topup (tiap 5 detik selama tab masih terbuka)
 * 2. Sync oportunistik saat halaman riwayat transaksi / admin dibuka (lihat src/lib/topup-sync.ts)
 * 3. Webhook cashi.id (kalau sudah didaftarkan di dashboard cashi.id)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncPendingTopups({ onlyOlderThanMinutes: 10, limit: 100 });

  return NextResponse.json({ ok: true, ...result });
}

import { NextRequest, NextResponse } from "next/server";

/**
 * Dipanggil otomatis oleh Vercel Cron (lihat konfigurasi di vercel.json).
 * Diproteksi dengan header Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const res = await fetch(`${appUrl}/api/orders/sync`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  const data = await res.json();

  return NextResponse.json({ ok: true, result: data });
}

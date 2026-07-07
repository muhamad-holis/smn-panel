import { createServiceClient } from "@/lib/supabase/server";
import { cashi } from "@/lib/cashi";
import { notify } from "@/lib/notify";
import { formatIDR } from "@/lib/utils";

/**
 * Tandai topup lunas secara ATOMIK: update hanya berhasil kalau status masih
 * 'pending' saat itu juga, supaya saldo tidak kecatat dua kali kalau dipanggil
 * berkali-kali hampir bersamaan (webhook, polling, cron bisa saling tumpang tindih).
 */
export async function settleTopup(orderId: string, rawPayload: any) {
  const admin = createServiceClient();

  const { data: updated, error } = await admin
    .from("topups")
    .update({ status: "paid", paid_at: new Date().toISOString(), raw_response: rawPayload })
    .eq("invoice_id", orderId)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (error) return { ok: false, reason: "db_error" as const };

  if (!updated) {
    const { data: existing } = await admin.from("topups").select("id").eq("invoice_id", orderId).maybeSingle();
    if (!existing) return { ok: false, reason: "not_found" as const };
    return { ok: true, reason: "already_settled" as const };
  }

  await admin.rpc("adjust_balance", {
    p_user_id: updated.user_id,
    p_amount: updated.amount,
    p_type: "topup",
    p_reference: orderId,
    p_description: "Top up via cashi.id",
  });

  await notify({
    userId: updated.user_id,
    type: "topup",
    title: "Top up berhasil",
    message: `Saldo kamu bertambah ${formatIDR(updated.amount)}.`,
    link: "/dashboard/deposit",
  });

  return { ok: true, reason: "settled" as const };
}

export async function markExpired(orderId: string, rawPayload: any) {
  const admin = createServiceClient();
  await admin.from("topups").update({ status: "expired", raw_response: rawPayload }).eq("invoice_id", orderId).neq("status", "paid");
}

/**
 * Sinkronisasi ulang semua topup yang masih 'pending' ke cashi.id.
 * Dipakai oleh: cron harian (jaring pengaman utama di Hobby plan) dan
 * pemanggilan oportunistik saat halaman topup/admin dibuka.
 *
 * - onlyOlderThanMinutes: skip topup yang baru dibuat, biar tidak dobel-cek
 *   dengan polling client-side yang sudah jalan di halaman topup user.
 * - limit: batasi jumlah pemanggilan ke API cashi.id per eksekusi.
 */
export async function syncPendingTopups(options?: { onlyOlderThanMinutes?: number; limit?: number }) {
  const onlyOlderThanMinutes = options?.onlyOlderThanMinutes ?? 10;
  const limit = options?.limit ?? 25;

  const admin = createServiceClient();
  const cutoff = new Date(Date.now() - onlyOlderThanMinutes * 60_000).toISOString();

  const { data: pending, error } = await admin
    .from("topups")
    .select("invoice_id")
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !pending || pending.length === 0) {
    return { checked: 0, settled: 0, expired: 0 };
  }

  let settled = 0;
  let expired = 0;

  for (const row of pending) {
    try {
      const result = await cashi.checkStatus(row.invoice_id);
      if (result.success && result.status === "SETTLED") {
        const r = await settleTopup(row.invoice_id, result);
        if (r.ok && r.reason === "settled") settled++;
      } else if (result.success && result.status === "EXPIRED") {
        await markExpired(row.invoice_id, result);
        expired++;
      }
    } catch {
      // abaikan satu invoice yang gagal dicek, lanjut ke invoice berikutnya
    }
  }

  return { checked: pending.length, settled, expired };
}

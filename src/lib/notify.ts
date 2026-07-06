import { createServiceClient } from "@/lib/supabase/server";

type NotifyParams = {
  userId: string;
  type: "order" | "topup" | "affiliate";
  title: string;
  message: string;
  link?: string;
};

/** Simpan 1 baris notifikasi untuk user tertentu. Dipanggil dari server (webhook, API route). */
export async function notify({ userId, type, title, message, link }: NotifyParams) {
  const admin = createServiceClient();
  const { error } = await admin.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    link: link ?? null,
  });
  if (error) console.error("Gagal membuat notifikasi:", error);
}

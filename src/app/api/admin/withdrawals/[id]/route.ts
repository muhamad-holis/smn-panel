import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notify";
import { formatIDR } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status, admin_note } = (await req.json()) as {
    status: "processing" | "paid" | "rejected";
    admin_note?: string;
  };

  if (!["processing", "paid", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  const admin = createServiceClient();

  const { data: withdrawal, error } = await admin
    .from("withdrawals")
    .update({ status, admin_note: admin_note || null, processed_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error || !withdrawal) {
    return NextResponse.json({ error: "Gagal memperbarui status withdraw." }, { status: 500 });
  }

  if (status === "paid") {
    await notify({
      userId: withdrawal.user_id,
      type: "affiliate",
      title: "Withdraw berhasil dicairkan",
      message: `Komisi ${formatIDR(Number(withdrawal.amount))} sudah ditransfer ke ${withdrawal.destination_name}.`,
      link: "/dashboard/afiliasi",
    });
  } else if (status === "rejected") {
    await notify({
      userId: withdrawal.user_id,
      type: "affiliate",
      title: "Withdraw ditolak",
      message: `Permintaan withdraw ${formatIDR(Number(withdrawal.amount))} ditolak.${
        admin_note ? " Alasan: " + admin_note : ""
      }`,
      link: "/dashboard/afiliasi",
    });
  }

  return NextResponse.json({ withdrawal });
}

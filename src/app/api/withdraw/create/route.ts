import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";

const MIN_WITHDRAW = 50000;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });

  const body = await req.json();
  const { amount, method, destination_name, account_number, account_holder } = body as {
    amount: number;
    method: "bank" | "ewallet";
    destination_name: string;
    account_number: string;
    account_holder: string;
  };

  if (!amount || !method || !destination_name || !account_number || !account_holder) {
    return NextResponse.json({ error: "Semua kolom wajib diisi." }, { status: 400 });
  }
  if (!["bank", "ewallet"].includes(method)) {
    return NextResponse.json({ error: "Metode pencairan tidak valid." }, { status: 400 });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < MIN_WITHDRAW) {
    return NextResponse.json({ error: `Minimal withdraw ${formatIDR(MIN_WITHDRAW)}.` }, { status: 400 });
  }

  const admin = createServiceClient();

  const { data: available, error: availError } = await admin.rpc("get_available_commission", {
    p_user_id: user.id,
  });

  if (availError) {
    return NextResponse.json({ error: "Gagal mengecek saldo komisi kamu." }, { status: 500 });
  }
  if (amount > Number(available)) {
    return NextResponse.json(
      { error: `Komisi yang bisa dicairkan cuma ${formatIDR(Number(available))}.` },
      { status: 400 }
    );
  }

  const { data: withdrawal, error: insertError } = await admin
    .from("withdrawals")
    .insert({
      user_id: user.id,
      amount,
      method,
      destination_name: destination_name.trim(),
      account_number: account_number.trim(),
      account_holder: account_holder.trim(),
      status: "pending",
    })
    .select()
    .single();

  if (insertError || !withdrawal) {
    return NextResponse.json({ error: "Gagal membuat permintaan withdraw." }, { status: 500 });
  }

  return NextResponse.json({ withdrawal });
}

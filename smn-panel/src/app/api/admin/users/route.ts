import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { user_id, amount } = (await req.json()) as { user_id: string; amount: number };
  if (!user_id || !amount) return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });

  const admin = createServiceClient();

  try {
    const { data: newBalance } = await admin.rpc("adjust_balance", {
      p_user_id: user_id,
      p_amount: amount,
      p_type: "adjustment",
      p_reference: null,
      p_description: `Penyesuaian manual oleh admin (${user.email})`,
    });
    return NextResponse.json({ balance: newBalance });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal menyesuaikan saldo." }, { status: 400 });
  }
}

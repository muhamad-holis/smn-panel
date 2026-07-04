import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { provider } from "@/lib/provider";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const result = await provider.balance();

    const admin = createServiceClient();
    const { data: rateSetting } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "usd_to_idr_rate")
      .maybeSingle();
    const usdToIdr = Number(rateSetting?.value || process.env.USD_TO_IDR_RATE || 16000);

    const balanceUsd = Number(result.balance);
    const balanceIdr = result.currency === "USD" ? balanceUsd * usdToIdr : balanceUsd;

    return NextResponse.json({
      balance_raw: result.balance,
      currency: result.currency,
      balance_idr: balanceIdr,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Gagal menghubungi provider." }, { status: 502 });
  }
}

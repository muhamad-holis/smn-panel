import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { provider } from "@/lib/provider";
import { applyMarkup } from "@/lib/utils";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Hanya admin yang bisa sinkronisasi layanan." }, { status: 403 });
  }

  const admin = createServiceClient();
  const defaultMarkup = Number(process.env.DEFAULT_MARKUP_PERCENT || 30);

  let accountCurrency = "USD";
  try {
    const balanceInfo = await provider.balance();
    accountCurrency = balanceInfo.currency || "USD";
  } catch {
    // default tetap USD kalau gagal cek
  }

  const { data: rateSetting } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "usd_to_idr_rate")
    .maybeSingle();
  const usdToIdr = Number(rateSetting?.value || process.env.USD_TO_IDR_RATE || 16000);
  const conversionRate = accountCurrency === "USD" ? usdToIdr : 1;

  let providerServices;
  try {
    providerServices = await provider.services();
  } catch (e: any) {
    return NextResponse.json({ error: "Gagal menghubungi provider: " + e.message }, { status: 502 });
  }

  if (!Array.isArray(providerServices)) {
    return NextResponse.json({ error: "Respons provider tidak valid." }, { status: 502 });
  }

  const { data: existingRows, error: fetchError } = await admin
    .from("services")
    .select("provider_service_id, markup_percent");

  if (fetchError) {
    return NextResponse.json({ error: "Gagal membaca layanan existing: " + fetchError.message }, { status: 500 });
  }

  const existingMap = new Map<number, number>(
    (existingRows || []).map((r) => [r.provider_service_id, r.markup_percent])
  );

  let created = 0;
  let updated = 0;

  const rows = providerServices.map((ps) => {
    const costRate = Number(ps.rate) * conversionRate;
    const isExisting = existingMap.has(ps.service);
    const markupPercent = isExisting ? existingMap.get(ps.service)! : defaultMarkup;

    if (isExisting) updated++;
    else created++;

    return {
      provider_service_id: ps.service,
      name: ps.name,
      category: ps.category,
      type: ps.type,
      min_order: Number(ps.min),
      max_order: Number(ps.max),
      cost_rate: costRate,
      sell_rate: applyMarkup(costRate, markupPercent),
      markup_percent: markupPercent,
      refill: !!ps.refill,
      cancel: !!ps.cancel,
      is_active: true,
      updated_at: new Date().toISOString(),
    };
  });

  const BATCH_SIZE = 300;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error: upsertError } = await admin
      .from("services")
      .upsert(batch, { onConflict: "provider_service_id" });

    if (upsertError) {
      return NextResponse.json(
        { error: `Gagal menyimpan batch ke-${i / BATCH_SIZE + 1}: ${upsertError.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    created,
    updated,
    total: providerServices.length,
    detected_currency: accountCurrency,
    conversion_applied: conversionRate !== 1,
  });
}

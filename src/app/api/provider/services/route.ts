import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { provider } from "@/lib/provider";
import { applyMarkup } from "@/lib/utils";

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

  const providerServices = await provider.services();

  if (!Array.isArray(providerServices)) {
    return NextResponse.json({ error: "Respons provider tidak valid." }, { status: 502 });
  }

  let created = 0;
  let updated = 0;

  for (const ps of providerServices) {
    const costRate = Number(ps.rate) * conversionRate;

    const { data: existing } = await admin
      .from("services")
      .select("id, markup_percent")
      .eq("provider_service_id", ps.service)
      .maybeSingle();

    if (existing) {
      await admin
        .from("services")
        .update({
          name: ps.name,
          category: ps.category,
          type: ps.type,
          min_order: Number(ps.min),
          max_order: Number(ps.max),
          cost_rate: costRate,
          sell_rate: applyMarkup(costRate, existing.markup_percent),
          refill: !!ps.refill,
          cancel: !!ps.cancel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      updated++;
    } else {
      await admin.from("services").insert({
        provider_service_id: ps.service,
        name: ps.name,
        category: ps.category,
        type: ps.type,
        min_order: Number(ps.min),
        max_order: Number(ps.max),
        cost_rate: costRate,
        sell_rate: applyMarkup(costRate, defaultMarkup),
        markup_percent: defaultMarkup,
        refill: !!ps.refill,
        cancel: !!ps.cancel,
        is_active: true,
      });
      created++;
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

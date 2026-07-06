import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { provider } from "@/lib/provider";
import { applyMarkup } from "@/lib/utils";
import { cleanServiceText } from "@/lib/sanitize";

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

  // CATATAN: Provider saat ini (MedanPedia) SELALU melaporkan harga dalam Rupiah
  // (lihat provider.ts). Sebelumnya kode ini mencoba mendeteksi currency lewat
  // provider.balance() dan fallback ke "USD" kalau panggilan itu gagal (network
  // error, timeout, dll). Fallback diam-diam itu menyebabkan rate yang SUDAH
  // dalam Rupiah dikalikan lagi dengan kurs USD->IDR (mis. x16000), sehingga
  // nilainya meledak dan melebihi batas kolom numeric(14,4) -> error
  // "numeric field overflow" saat upsert batch. Karena provider ini dipastikan
  // IDR-native, konversi dikunci ke 1 tanpa bergantung pada network call yang
  // rapuh tersebut.
  const accountCurrency = "IDR";
  const conversionRate = 1;

  let providerServices;
  try {
    providerServices = await provider.services();
  } catch (e: any) {
    return NextResponse.json({ error: "Gagal menghubungi provider: " + e.message }, { status: 502 });
  }

  if (!Array.isArray(providerServices)) {
    return NextResponse.json({ error: "Respons provider tidak valid." }, { status: 502 });
  }

  // DIAGNOSTIK: cek langsung di respons MENTAH dari API provider (sebelum disimpan
  // ke DB sama sekali) apakah ada layanan/kategori yang mengandung kata kunci
  // tertentu (mis. "tiktok"). Ini untuk memastikan apakah kategori yang "hilang"
  // di panel memang tidak pernah dikirim oleh API provider (berarti akun/API key
  // kita tidak diaktifkan untuk kategori itu di sisi provider), atau sebenarnya
  // ADA di respons API tapi hilang saat proses simpan (berarti bug di kode ini).
  const diagnosticKeyword = req.nextUrl.searchParams.get("check")?.toLowerCase();
  let diagnostic: { keyword: string; found_in_raw_api: number; sample: any[] } | undefined;
  if (diagnosticKeyword) {
    const matches = providerServices.filter(
      (ps) =>
        ps.name?.toLowerCase().includes(diagnosticKeyword) ||
        ps.category?.toLowerCase().includes(diagnosticKeyword)
    );
    diagnostic = {
      keyword: diagnosticKeyword,
      found_in_raw_api: matches.length,
      sample: matches.slice(0, 5).map((ps) => ({ service: ps.service, name: ps.name, category: ps.category })),
    };
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

  // Batas aman kolom numeric(14,4) di DB: bagian bulat maksimal 10 digit.
  const MAX_RATE = 9_999_999_999;
  const skipped: { service: number; name: string; rate: number }[] = [];

  const rows = providerServices
    .map((ps) => {
      const costRate = Number(ps.rate) * conversionRate;
      const isExisting = existingMap.has(ps.service);
      const markupPercent = isExisting ? existingMap.get(ps.service)! : defaultMarkup;
      const sellRate = applyMarkup(costRate, markupPercent);

      // Lewati layanan dengan rate tidak wajar (NaN atau melebihi kapasitas kolom)
      // supaya satu layanan bermasalah tidak menggagalkan seluruh batch upsert.
      if (!Number.isFinite(costRate) || !Number.isFinite(sellRate) || costRate > MAX_RATE || sellRate > MAX_RATE) {
        skipped.push({ service: ps.service, name: ps.name, rate: costRate });
        return null;
      }

      if (isExisting) updated++;
      else created++;

      return {
        provider_service_id: ps.service,
        name: cleanServiceText(ps.name),
        category: cleanServiceText(ps.category),
        type: ps.type,
        min_order: Number(ps.min),
        max_order: Number(ps.max),
        cost_rate: costRate,
        sell_rate: sellRate,
        markup_percent: markupPercent,
        refill: !!ps.refill,
        cancel: !!ps.cancel,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

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
    skipped: skipped.length,
    skipped_services: skipped.slice(0, 20), // contoh maks 20 biar respons tidak membengkak
    ...(diagnostic ? { diagnostic } : {}),
  });
}

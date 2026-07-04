import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { provider } from "@/lib/provider";
import { applyMarkup } from "@/lib/utils";

export const maxDuration = 60;

/**
 * Sinkronisasi daftar layanan dari provider djuragansosmed ke tabel services.
 * - Layanan baru akan ditambahkan dengan markup_percent = DEFAULT_MARKUP_PERCENT.
 * - Layanan lama akan diupdate cost_rate & sell_rate-nya mengikuti markup yang sudah diset admin
 *   (kalau admin sudah pernah override markup, itu akan dipertahankan).
 * - Hanya boleh dipanggil oleh admin.
 */
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

  try {
    const providerServices = await provider.services();

    if (!Array.isArray(providerServices)) {
      return NextResponse.json(
        { error: "Respons provider tidak valid. Cek PROVIDER_API_URL / PROVIDER_API_KEY.", raw: providerServices },
        { status: 502 }
      );
    }

    let created = 0;
    let updated = 0;

    for (const ps of providerServices) {
      // djuragansosmed melaporkan rate per 1000 dalam Rupiah (bukan USD),
      // jadi dipakai langsung tanpa konversi kurs.
      const costRate = Number(ps.rate);

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

    return NextResponse.json({ created, updated, total: providerServices.length });
  } catch (e: any) {
    console.error("Sync provider services failed:", e);
    return NextResponse.json(
      { error: e?.message || "Gagal menghubungi provider. Cek API key & koneksi." },
      { status: 502 }
    );
  }
}

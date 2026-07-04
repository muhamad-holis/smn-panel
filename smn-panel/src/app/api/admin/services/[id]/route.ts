import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { applyMarkup } from "@/lib/utils";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { markup_percent, is_active } = (await req.json()) as {
    markup_percent: number;
    is_active: boolean;
  };

  const admin = createServiceClient();
  const { data: service } = await admin.from("services").select("cost_rate").eq("id", params.id).single();
  if (!service) return NextResponse.json({ error: "Layanan tidak ditemukan." }, { status: 404 });

  const sellRate = applyMarkup(service.cost_rate, markup_percent);

  const { error } = await admin
    .from("services")
    .update({
      markup_percent,
      sell_rate: sellRate,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sell_rate: sellRate });
}

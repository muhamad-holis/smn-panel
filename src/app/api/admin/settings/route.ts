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

  const body = (await req.json()) as Record<string, string>;
  const admin = createServiceClient();

  for (const [key, value] of Object.entries(body)) {
    await admin
      .from("app_settings")
      .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: "key" });
  }

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const refCode = searchParams.get("ref");
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  if (code) {
    const supabase = createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data.user;

    if (user && refCode && refCode.length >= 6) {
      // Pakai service client di sini supaya bisa baca & tautkan lintas-user,
      // karena RLS profiles hanya izinkan user lihat baris miliknya sendiri.
      const admin = createServiceClient();

      const { data: profile } = await admin
        .from("profiles")
        .select("referred_by")
        .eq("id", user.id)
        .single();

      if (profile && !profile.referred_by) {
        const { data: referrer } = await admin
          .from("profiles")
          .select("id")
          .like("id", `${refCode}%`)
          .neq("id", user.id)
          .limit(1)
          .single();

        if (referrer) {
          await admin.from("profiles").update({ referred_by: referrer.id }).eq("id", user.id);
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}

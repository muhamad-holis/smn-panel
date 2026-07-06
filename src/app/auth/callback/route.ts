import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const refCode = searchParams.get("ref");
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  if (code) {
    const supabase = createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data.user;

    // Kalau daftar via Google bawa kode referral, tautkan manual
    // (trigger handle_new_user tidak bisa baca ref_code dari OAuth).
    if (user && refCode && refCode.length >= 6) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("referred_by")
        .eq("id", user.id)
        .single();

      if (profile && !profile.referred_by) {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id")
          .like("id", `${refCode}%`)
          .neq("id", user.id)
          .limit(1)
          .single();

        if (referrer) {
          await supabase.from("profiles").update({ referred_by: referrer.id }).eq("id", user.id);
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}

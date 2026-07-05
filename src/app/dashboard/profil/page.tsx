import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./profile-form";
import PasswordForm from "./password-form";

export default async function ProfilPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, created_at")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500">Kelola profil dan keamanan akun kamu.</p>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold text-gray-900">Informasi Akun</h2>
        <ProfileForm initialName={profile?.full_name || ""} email={profile?.email || ""} />
      </div>

      <div className="card">
        <h2 className="mb-1 font-semibold text-gray-900">Ubah Password</h2>
        <p className="mb-4 text-sm text-gray-400">Minimal 6 karakter.</p>
        <PasswordForm />
      </div>
    </div>
  );
}

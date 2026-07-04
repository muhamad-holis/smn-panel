"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSuccess(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name })
      .eq("id", user!.id);

    setSaving(false);

    if (error) {
      alert("Gagal menyimpan: " + error.message);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">Perubahan disimpan.</div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-200">Nama Lengkap</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-200">Email</label>
        <input className="input bg-navy-800/60 text-navy-400" value={email} disabled />
        <p className="mt-1 text-xs text-navy-500">Email tidak bisa diubah.</p>
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </div>
  );
}

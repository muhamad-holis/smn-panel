"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Jika project Supabase mensyaratkan konfirmasi email
    if (data.session === null) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="card max-w-sm text-center">
          <h1 className="text-lg font-bold text-gray-900">Cek Email Kamu</h1>
          <p className="mt-2 text-sm text-gray-600">
            Kami sudah mengirim link konfirmasi ke <b>{email}</b>. Klik link tersebut untuk mengaktifkan akun.
          </p>
          <Link href="/login" className="btn-primary mt-6 w-full">
            Ke Halaman Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-brand-600">
            SMM Panel
          </Link>
          <p className="mt-2 text-sm text-gray-600">Buat akun baru, gratis</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input
              type="text"
              required
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama kamu"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  );
}

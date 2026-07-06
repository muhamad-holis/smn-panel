"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      setLoading(false);
      return;
    }

    // Kode referral dari link afiliasi, contoh: /register?ref=3fa85f64
    const refCode = searchParams.get("ref");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          ...(refCode ? { ref_code: refCode } : {}),
        },
      },
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

  async function handleGoogleRegister() {
    setGoogleLoading(true);
    setError(null);

    // Kode referral tetap dibawa lewat callback, karena OAuth tidak lewat signUp()
    const refCode = searchParams.get("ref");
    const params = new URLSearchParams({ redirect: "/dashboard" });
    if (refCode) params.set("ref", refCode);

    const callbackUrl = `${window.location.origin}/auth/callback?${params.toString()}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-navy-800/60 px-6">
        <div className="card max-w-sm text-center">
          <h1 className="text-lg font-bold text-white">Cek Email Kamu</h1>
          <p className="mt-2 text-sm text-navy-300">
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
    <main className="flex min-h-screen items-center justify-center bg-navy-800/60 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-brand-400">
            SMM Panel
          </Link>
          <p className="mt-2 text-sm text-navy-300">Buat akun baru, gratis</p>
        </div>

        <div className="card space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
          )}

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-navy-600 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.6 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4c-7.4 0-13.7 4.2-16.9 10.4z"/>
              <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5C29.6 35 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8H5.1v6.2C8.3 39.8 15.6 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.2 5.6l6.5 5.5C40.9 36.5 44 30.9 44 24c0-1.2-.1-2.4-.4-3.5z"/>
            </svg>
            {googleLoading ? "Menghubungkan..." : "Daftar dengan Google"}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-navy-600" />
            <span className="text-xs text-navy-400">atau</span>
            <div className="h-px flex-1 bg-navy-600" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-200">Nama Lengkap</label>
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
              <label className="mb-1.5 block text-sm font-medium text-navy-200">Email</label>
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
              <label className="mb-1.5 block text-sm font-medium text-navy-200">Password</label>
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
        </div>

        <p className="mt-4 text-center text-sm text-navy-300">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-brand-400 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  );
}

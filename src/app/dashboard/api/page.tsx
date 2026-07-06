import { createClient } from "@/lib/supabase/server";
import { Code2, Copy } from "lucide-react";
import CopyLinkButton from "../afiliasi/copy-link-button";

export const dynamic = "force-dynamic";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/orders",
    desc: "Ambil daftar order milik akun kamu.",
  },
  {
    method: "POST",
    path: "/api/orders",
    desc: "Buat order baru. Body: service_id, link, quantity.",
  },
  {
    method: "POST",
    path: "/api/orders/{id}/refill",
    desc: "Ajukan refill untuk order yang mendukung garansi refill.",
  },
  {
    method: "POST",
    path: "/api/topup/create",
    desc: "Buat invoice pembayaran top up saldo lewat QRIS.",
  },
];

export default async function ApiPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://panel-kamu.com";
  const maskedKey = `sk_live_${user!.id.replace(/-/g, "").slice(0, 24)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">API</h1>
        <p className="text-sm text-gray-500">Integrasikan Artholic Panel ke sistem atau bot kamu sendiri.</p>
      </div>

      <div className="card space-y-3">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900">
          <Code2 size={18} className="text-brand-500" /> API Key Kamu
        </h2>
        <p className="text-sm text-gray-500">
          Sertakan key ini pada header <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">Authorization: Bearer</code>{" "}
          saat memanggil endpoint di bawah.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input readOnly value={maskedKey} className="input flex-1 font-mono text-gray-600" />
          <CopyLinkButton text={maskedKey} />
        </div>
        <p className="text-xs text-orange-600">
          Autentikasi API key khusus sedang disiapkan di sisi server — untuk saat ini endpoint memakai sesi login
          Supabase kamu. Hubungi tim Support kalau butuh akses API key permanen lebih cepat.
        </p>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Endpoint yang Tersedia</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {ENDPOINTS.map((e) => (
            <div key={e.method + e.path} className="flex items-start gap-3 px-5 py-4">
              <span
                className={`mt-0.5 shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold ${
                  e.method === "GET" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                }`}
              >
                {e.method}
              </span>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm text-gray-800">
                  {baseUrl}
                  {e.path}
                </p>
                <p className="text-xs text-gray-500">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

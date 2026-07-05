import { MessageCircle, Clock, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

const FAQS = [
  {
    q: "Berapa lama order diproses?",
    a: "Sebagian besar layanan mulai berjalan dalam hitungan menit setelah order dibuat, tergantung antrean provider.",
  },
  {
    q: "Bagaimana cara klaim garansi refill?",
    a: "Buka menu Daftar Order, cari order dengan badge refill, lalu klik tombol Refill pada order yang sudah selesai.",
  },
  {
    q: "Metode pembayaran apa saja yang tersedia?",
    a: "Saat ini top up saldo tersedia lewat QRIS, bisa dibayar dari e-wallet atau mobile banking apa pun.",
  },
];

export default function SupportPage() {
  const phone = "6283803888990";
  const message = "Halo, saya butuh bantuan terkait akun Artholic Studio.";
  const waHref = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Support</h1>
        <p className="text-sm text-gray-500">Butuh bantuan? Tim kami siap membantu 24/7.</p>
      </div>

      <div className="card flex flex-col items-start gap-4 bg-gradient-to-br from-brand-50 to-purple-50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white">
            <MessageCircle size={22} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Chat via WhatsApp</p>
            <p className="text-sm text-gray-600">Respon rata-rata di bawah 5 menit.</p>
          </div>
        </div>
        <a href={waHref} target="_blank" rel="noreferrer" className="btn-primary w-full sm:w-auto">
          Mulai Chat
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card flex items-center gap-3">
          <Clock className="text-brand-500" size={20} />
          <div>
            <p className="text-sm font-semibold text-gray-900">24/7 Support</p>
            <p className="text-xs text-gray-500">Tim siap membantu kapan saja.</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <ShieldCheck className="text-brand-500" size={20} />
          <div>
            <p className="text-sm font-semibold text-gray-900">Garansi Layanan</p>
            <p className="text-xs text-gray-500">Refund atau refill jika order bermasalah.</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold text-gray-900">Pertanyaan Umum</h2>
        <div className="divide-y divide-gray-100">
          {FAQS.map((f) => (
            <div key={f.q} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-medium text-gray-800">{f.q}</p>
              <p className="mt-1 text-sm text-gray-500">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

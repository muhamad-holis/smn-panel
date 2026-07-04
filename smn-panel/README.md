# SMM Panel

Website reseller SMM Panel (jual followers/likes/views/comments dsb) — Next.js 14 + Supabase,
reseller ke provider **djuragansosmed.com**, pembayaran top-up saldo via **BAYAR GG** (QRIS).

## Fitur

- Auth email/password (Supabase Auth)
- Daftar harga publik (`/layanan`) — auto sinkron dari provider
- Order layanan, potong saldo otomatis, order langsung diteruskan ke provider
- Riwayat order + status live (sinkron otomatis tiap 10 menit via cron) + refill
- Top up saldo via QRIS (BAYAR GG), saldo bertambah otomatis lewat webhook
- Panel admin: kelola user & saldo, atur markup harga per layanan, sinkron layanan dari provider, lihat transaksi & estimasi profit

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, copy-paste seluruh isi `supabase/migration.sql`, lalu Run.
3. Buka **Authentication > Providers**, pastikan **Email** aktif.
   - Kalau mau langsung bisa login tanpa verifikasi email dulu (untuk testing cepat), matikan
     "Confirm email" di Authentication > Settings.
4. Daftar akun pertama lewat halaman `/register` di aplikasi (setelah dijalankan), lalu jadikan admin:
   ```sql
   update public.profiles set role = 'admin' where email = 'email-kamu@example.com';
   ```
5. Ambil kredensial di **Project Settings > API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (RAHASIA, jangan expose ke browser)

## 2. Setup API Key Provider (djuragansosmed)

Ambil API key dari akun djuragansosmed.com kamu di menu **Account**, isi ke `PROVIDER_API_KEY`.

## 3. Setup Payment Gateway

Project ini mendukung 2 gateway, **cashi.id sebagai default** (gratis, tanpa langganan, limit lebih
tinggi) dan **bayar.gg sebagai alternatif** (limit QRIS gratis cuma Rp 500.000/transaksi kecuali upgrade).

### cashi.id (default)

1. Daftar/login di [cashi.id](https://cashi.id), ambil **API Key** di Dashboard → Settings → API Keys.
2. Isi ke `CASHI_API_KEY`.
3. Daftarkan **Webhook URL** di dashboard: `https://domain-kamu.com/api/topup/webhook/cashi`
4. Ambil **Webhook Secret** dari dashboard, isi ke `CASHI_WEBHOOK_SECRET`.
5. (Opsional) Kalau mau QRIS dengan nama toko sendiri, aktifkan fitur "QRIS Custom" di dashboard
   cashi.id, lalu set `CASHI_USE_QRIS_CUSTOM=true`. Perlu diaktifkan dulu di sisi mereka, kalau
   belum tetap pakai QRIS biasa (limit modal Rp 2.000 - Rp 10.000.000).

### bayar.gg (alternatif)

1. Daftar/login di [bayar.gg](https://bayar.gg), ambil API Key dari dashboard **Developer**.
2. Set **Webhook URL** ke: `https://domain-kamu.com/api/topup/webhook/bayar-gg`
3. Ambil webhook secret dari dashboard, isi ke `BAYARGG_WEBHOOK_SECRET`.
4. **Penting**: nama header signature webhook bisa berbeda tergantung akun kamu. Cek dashboard
   Developer > Webhook di bayar.gg untuk nama header pastinya, lalu sesuaikan di
   `src/app/api/topup/webhook/bayar-gg/route.ts` (baris yang membaca `x-signature`).

Untuk ganti gateway default, ubah `DEFAULT_PAYMENT_GATEWAY` di `.env` (`cashi` atau `bayar_gg`).

## 4. Environment Variables

Copy `.env.example` menjadi `.env.local`, isi semua nilai. Untuk deploy ke Vercel, masukkan
variabel yang sama di **Project Settings > Environment Variables**.

## 5. Jalankan Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## 6. Sinkronisasi Layanan Pertama Kali

Setelah login sebagai admin, buka `/admin/pengaturan`, klik **🔄 Sinkron dari Provider**.
Ini akan menarik semua layanan dari djuragansosmed dan menyimpannya dengan markup default
(atur dulu kurs USD→IDR dan markup % di kotak "Pengaturan Global" sebelum sinkron pertama).

## 7. Deploy ke Vercel

```bash
npm install -g vercel   # kalau belum ada
vercel
```

Atau lewat dashboard Vercel: **Import Project** → hubungkan repo GitHub → isi Environment
Variables → Deploy.

Cron job (`vercel.json`) otomatis aktif di Vercel untuk sinkron status order tiap 10 menit —
tidak perlu setup tambahan, asal `CRON_SECRET` sudah diisi di Environment Variables (Vercel
otomatis mengirim header `Authorization: Bearer $CRON_SECRET` ke endpoint cron kamu).

## Struktur Folder

```
src/
  lib/
    provider.ts       -> wrapper API djuragansosmed
    bayarGG.ts         -> wrapper API BAYAR GG
    supabase/          -> client Supabase (browser/server/middleware)
    utils.ts           -> format harga, hitung markup, dsb
  app/
    (public)           -> landing, /layanan, /login, /register
    dashboard/          -> area user: order, riwayat, top up
    admin/              -> area admin: user, harga, transaksi
    api/                -> semua route handler (order, topup, webhook, cron, admin)
supabase/
  migration.sql         -> skema database lengkap, jalankan di SQL Editor
```

## Alur Uang & Order (ringkas)

1. User top up → `POST /api/topup/create` → invoice dibuat di BAYAR GG → user bayar QRIS.
2. BAYAR GG kirim webhook ke `/api/topup/webhook` → saldo user bertambah otomatis (idempotent).
3. User buat order → `POST /api/orders` → saldo dipotong dulu (atomik via RPC `adjust_balance`)
   → order dikirim ke provider → kalau provider gagal, saldo otomatis dikembalikan (refund).
4. Cron `/api/cron/sync` tiap 10 menit memanggil `/api/orders/sync` → status semua order aktif
   diperbarui dari provider (start_count, remains, status).

## Yang Perlu Kamu Cek Sebelum Go-Live

- [ ] Isi semua Environment Variables (jangan sampai ada yang placeholder)
- [ ] Test 1 transaksi top up kecil (Rp 10.000) end-to-end via cashi.id, pastikan saldo bertambah otomatis
- [ ] Test 1 order layanan termurah, pastikan status tersinkron setelah beberapa menit
- [ ] Pastikan webhook cashi.id terdaftar & `CASHI_WEBHOOK_SECRET` benar (cek log invoice yang stuck "pending" di `/admin/transaksi`)
- [ ] Set kurs USD→IDR yang realistis di `/admin/pengaturan` sebelum sinkron layanan
- [ ] Ganti markup default sesuai strategi harga kamu
- [ ] Pertimbangkan menambah Terms of Service & kebijakan refund di footer (disarankan untuk
      bisnis yang melibatkan pembayaran)

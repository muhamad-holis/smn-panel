-- =====================================================================
-- SMM PANEL - FIXES MIGRATION (jalankan SEKALI di Supabase SQL Editor,
-- setelah migration.sql yang lama, aman diulang / idempotent)
-- =====================================================================

-- ---------------------------------------------------------------------
-- FIX #1 (KRITIS): Kunci kolom balance & role dari tabel profiles supaya
-- tidak bisa diubah langsung oleh user lewat client (Supabase JS),
-- HANYA bisa diubah lewat fungsi security definer (adjust_balance, dst)
-- atau lewat SQL Editor sebagai admin.
--
-- Cara kerja: security definer function (adjust_balance) berjalan sebagai
-- current_user = pemilik fungsi (postgres), sedangkan request langsung
-- dari client (PostgREST) berjalan sebagai current_user = 'authenticated'.
-- Trigger ini menolak perubahan balance/role HANYA kalau current_user
-- adalah 'authenticated' (request langsung dari user biasa).
-- ---------------------------------------------------------------------
create or replace function public.protect_profile_columns()
returns trigger as $$
begin
  if current_user = 'authenticated' then
    new.balance := old.balance;
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_protect_profile_columns on public.profiles;
create trigger trg_protect_profile_columns
  before update on public.profiles
  for each row execute procedure public.protect_profile_columns();

-- ---------------------------------------------------------------------
-- FIX #7 (SEDANG): Cabut izin insert langsung ke orders & topups dari
-- client. Kedua tabel ini SELALU diisi lewat service role di API route
-- (bukan lewat client Supabase langsung), jadi policy insert ini tidak
-- dipakai aplikasi dan cuma jadi celah orang bikin order/topup palsu.
-- ---------------------------------------------------------------------
drop policy if exists "orders_insert_own" on public.orders;
drop policy if exists "topups_insert_own" on public.topups;

-- ---------------------------------------------------------------------
-- FIX #5 (TINGGI): Tambahkan 'Refunded' ke daftar status order yang sah.
-- Sebelumnya kode sync order coba set status ini tapi database menolaknya
-- karena tidak ada di constraint, sehingga update gagal diam-diam.
-- ---------------------------------------------------------------------
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('Pending','In progress','Processing','Completed','Partial','Canceled','Error','Refunded'));

-- ---------------------------------------------------------------------
-- FIX #4 (TINGGI): Pengaman tambahan di level database supaya top up
-- dengan invoice_id yang sama tidak bisa dikreditkan dua kali walau
-- webhook terpanggil berkali-kali hampir bersamaan (defense-in-depth,
-- perbaikan utama ada di kode webhook: update atomik pending->paid).
-- ---------------------------------------------------------------------
drop index if exists idx_transactions_topup_reference_unique;
create unique index idx_transactions_topup_reference_unique
  on public.transactions (reference)
  where type = 'topup';

-- =====================================================================
-- SELESAI. Tidak ada langkah manual tambahan.
-- =====================================================================

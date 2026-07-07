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

-- ---------------------------------------------------------------------
-- FIX #10 (MINOR): Pisahkan komisi afiliasi dari "adjustment" (penyesuaian
-- manual admin) supaya riwayat transaksi lebih jelas dan tidak ambigu.
-- ---------------------------------------------------------------------
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check
  check (type in ('topup','order','refund','adjustment','affiliate'));

create or replace function public.credit_affiliate_commission(
  p_referrer_id uuid,
  p_referred_user_id uuid,
  p_order_id bigint,
  p_amount numeric
) returns void as $$
begin
  if p_amount is null or p_amount <= 0 then
    return;
  end if;

  perform public.adjust_balance(
    p_referrer_id,
    p_amount,
    'affiliate',
    concat('order:', p_order_id),
    'Komisi afiliasi dari referral'
  );

  insert into public.affiliate_commissions (referrer_id, referred_user_id, order_id, amount)
  values (p_referrer_id, p_referred_user_id, p_order_id, p_amount);
end;
$$ language plpgsql security definer;

-- =====================================================================
-- SELESAI. Tidak ada langkah manual tambahan.
-- =====================================================================

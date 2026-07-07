-- =====================================================================
-- FITUR WITHDRAW KOMISI AFILIASI
-- Jalankan SEKALI di Supabase SQL Editor (aman diulang / idempotent)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabel permintaan withdraw. Tidak ada policy insert/update untuk client
-- (auth 'authenticated') secara sengaja -- semua insert/update HARUS lewat
-- API route dengan service role, supaya validasi jumlah & saldo komisi
-- tidak bisa dilewati (pelajaran dari FIX #7 sebelumnya).
-- ---------------------------------------------------------------------
create table if not exists public.withdrawals (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  method text not null check (method in ('bank','ewallet')),
  destination_name text not null,   -- nama bank (BCA/Mandiri/dst) atau e-wallet (DANA/OVO/GoPay/ShopeePay)
  account_number text not null,
  account_holder text not null,
  status text not null default 'pending' check (status in ('pending','processing','paid','rejected')),
  admin_note text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_withdrawals_user on public.withdrawals(user_id);

alter table public.withdrawals enable row level security;

drop policy if exists "withdrawals_select_own" on public.withdrawals;
create policy "withdrawals_select_own" on public.withdrawals
  for select using (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------
-- Hitung sisa komisi yang boleh dicairkan:
-- total komisi afiliasi yang pernah didapat, dikurangi withdraw yang
-- sudah diajukan (pending/processing/paid). Withdraw yang ditolak TIDAK
-- mengurangi, jadi otomatis "balik" jadi tersedia lagi.
-- ---------------------------------------------------------------------
create or replace function public.get_available_commission(p_user_id uuid)
returns numeric as $$
  select
    coalesce((select sum(amount) from public.affiliate_commissions where referrer_id = p_user_id), 0)
    -
    coalesce((select sum(amount) from public.withdrawals where user_id = p_user_id and status in ('pending','processing','paid')), 0);
$$ language sql security definer stable;

-- =====================================================================
-- SELESAI.
-- =====================================================================

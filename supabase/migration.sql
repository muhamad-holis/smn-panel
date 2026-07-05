-- =====================================================================
-- SMM PANEL - SUPABASE MIGRATION
-- Jalankan file ini di Supabase SQL Editor (satu kali, aman diulang / idempotent)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILES (extend auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper function: cek apakah user yang login adalah admin.
-- security definer supaya query di dalamnya bypass RLS (menghindari infinite recursion
-- kalau dipakai di policy tabel profiles sendiri).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile saat user baru daftar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. SERVICES (cache dari provider + harga jual kamu)
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id bigserial primary key,
  provider_service_id bigint not null unique,
  name text not null,
  category text,
  type text,
  min_order integer not null default 1,
  max_order integer not null default 10000,
  cost_rate numeric(14,4) not null default 0,   -- harga modal per 1000 dari provider (dalam Rupiah)
  sell_rate numeric(14,4) not null default 0,   -- harga jual per 1000 ke customer (dalam Rupiah)
  markup_percent numeric(6,2) not null default 30,
  refill boolean not null default false,
  cancel boolean not null default false,
  is_active boolean not null default true,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.services enable row level security;

drop policy if exists "services_select_all" on public.services;
create policy "services_select_all" on public.services
  for select using (true);

drop policy if exists "services_admin_write" on public.services;
create policy "services_admin_write" on public.services
  for all using (public.is_admin());

-- ---------------------------------------------------------------------
-- 3. ORDERS
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  service_id bigint not null references public.services(id),
  provider_order_id bigint,               -- order id dari djuragansosmed
  link text not null,
  quantity integer not null,
  charge numeric(14,2) not null,          -- total yang dipotong dari saldo user
  cost numeric(14,2) not null default 0,  -- harga modal aktual (untuk laporan profit admin)
  start_count integer,
  remains integer,
  status text not null default 'Pending' check (
    status in ('Pending','In progress','Processing','Completed','Partial','Canceled','Error')
  ),
  provider_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_provider_id on public.orders(provider_order_id);

alter table public.orders enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 4. TRANSACTIONS (mutasi saldo: topup, order, refund, adjustment)
-- ---------------------------------------------------------------------
create table if not exists public.transactions (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('topup','order','refund','adjustment')),
  amount numeric(14,2) not null,     -- positif = nambah saldo, negatif = potong saldo
  balance_after numeric(14,2) not null,
  reference text,                    -- invoice_id topup atau order id
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user on public.transactions(user_id);

alter table public.transactions enable row level security;

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------
-- 5. TOPUPS (invoice payment gateway)
-- ---------------------------------------------------------------------
create table if not exists public.topups (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  gateway text not null default 'cashi',
  invoice_id text not null unique,
  amount numeric(14,2) not null,
  final_amount numeric(14,2) not null,
  payment_method text,
  status text not null default 'pending' check (status in ('pending','paid','expired','cancelled')),
  paid_at timestamptz,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_topups_user on public.topups(user_id);
create index if not exists idx_topups_invoice on public.topups(invoice_id);

alter table public.topups enable row level security;

drop policy if exists "topups_select_own" on public.topups;
create policy "topups_select_own" on public.topups
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "topups_insert_own" on public.topups;
create policy "topups_insert_own" on public.topups
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 6. APP SETTINGS (key-value, diedit dari admin panel)
-- ---------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "settings_select_all" on public.app_settings;
create policy "settings_select_all" on public.app_settings
  for select using (true);

drop policy if exists "settings_admin_write" on public.app_settings;
create policy "settings_admin_write" on public.app_settings
  for all using (public.is_admin());

insert into public.app_settings (key, value)
values ('default_markup_percent', '30')
on conflict (key) do nothing;

insert into public.app_settings (key, value)
values ('usd_to_idr_rate', '16000')
on conflict (key) do nothing;

insert into public.app_settings (key, value)
values ('provider_balance_warning_idr', '100000')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 7. AFILIASI / REFERRAL
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id);

create table if not exists public.affiliate_commissions (
  id bigserial primary key,
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null references public.profiles(id) on delete cascade,
  order_id bigint references public.orders(id) on delete set null,
  amount numeric(14,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_affiliate_commissions_referrer on public.affiliate_commissions(referrer_id);

alter table public.affiliate_commissions enable row level security;

drop policy if exists "affiliate_commissions_select_own" on public.affiliate_commissions;
create policy "affiliate_commissions_select_own" on public.affiliate_commissions
  for select using (auth.uid() = referrer_id or public.is_admin());

insert into public.app_settings (key, value)
values ('affiliate_commission_percent', '5')
on conflict (key) do nothing;

-- Update handle_new_user supaya menautkan referred_by dari ref_code (8 karakter awal UUID referrer),
-- dikirim lewat raw_user_meta_data saat signUp supaya tetap tersimpan walau email konfirmasi belum diklik.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_ref_code text;
  v_referrer_id uuid;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));

  v_ref_code := new.raw_user_meta_data->>'ref_code';
  if v_ref_code is not null and length(v_ref_code) >= 6 then
    select id into v_referrer_id
    from public.profiles
    where id::text like v_ref_code || '%' and id <> new.id
    limit 1;

    if v_referrer_id is not null then
      update public.profiles set referred_by = v_referrer_id where id = new.id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- RPC: kreditkan komisi afiliasi ke saldo referrer + catat riwayatnya, dipanggil dari server saat order berhasil
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
    'adjustment',
    concat('order:', p_order_id),
    'Komisi afiliasi dari referral'
  );

  insert into public.affiliate_commissions (referrer_id, referred_user_id, order_id, amount)
  values (p_referrer_id, p_referred_user_id, p_order_id, p_amount);
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------
-- 8. RPC: potong / tambah saldo secara atomik
-- ---------------------------------------------------------------------
create or replace function public.adjust_balance(
  p_user_id uuid,
  p_amount numeric,
  p_type text,
  p_reference text default null,
  p_description text default null
) returns numeric as $$
declare
  v_new_balance numeric;
begin
  update public.profiles
    set balance = balance + p_amount
    where id = p_user_id
    returning balance into v_new_balance;

  if v_new_balance is null then
    raise exception 'User % tidak ditemukan', p_user_id;
  end if;

  if v_new_balance < 0 then
    raise exception 'Saldo tidak mencukupi';
  end if;

  insert into public.transactions (user_id, type, amount, balance_after, reference, description)
  values (p_user_id, p_type, p_amount, v_new_balance, p_reference, p_description);

  return v_new_balance;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------
-- SELESAI. Langkah selanjutnya (manual, di dashboard Supabase):
-- 1. Buat user pertama lewat Authentication > Add User, lalu jalankan:
--    update public.profiles set role = 'admin' where email = 'email-admin-kamu@example.com';
-- 2. Pastikan Authentication > Providers > Email aktif.
-- =====================================================================

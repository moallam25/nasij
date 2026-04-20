-- ============================================
-- NASIJ v4 — Sizes Management + RBAC + Profit
-- Run AFTER schema.sql + migration_v2.sql + migration_v3.sql
-- Idempotent: safe to re-run
-- ============================================

-- ---------- SIZES TABLE ----------
create table if not exists sizes (
  id uuid primary key default gen_random_uuid(),
  label text not null,                     -- e.g. "80 × 120"
  width_cm integer not null,
  length_cm integer not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (width_cm, length_cm)
);

create or replace function bump_sizes_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists trg_bump_sizes on sizes;
create trigger trg_bump_sizes before update on sizes
  for each row execute function bump_sizes_updated_at();

alter table sizes enable row level security;

drop policy if exists "public read active sizes" on sizes;
create policy "public read active sizes" on sizes
  for select using (active = true);

drop policy if exists "auth manage sizes" on sizes;
create policy "auth manage sizes" on sizes for all
  using (auth.role() = 'authenticated');

-- Seed the three legacy presets so the customer form keeps working
insert into sizes (label, width_cm, length_cm, sort_order) values
  ('80 × 120', 80, 120, 10),
  ('120 × 180', 120, 180, 20),
  ('160 × 230', 160, 230, 30)
on conflict (width_cm, length_cm) do nothing;

create index if not exists sizes_active_idx on sizes (active, sort_order);

-- ---------- RBAC: admin_users table ----------
-- Roles: 'admin' (full access) | 'staff' (orders only — no products/sizes/users)
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz default now()
);

alter table admin_users enable row level security;

-- Authenticated users can read their own row (so the dashboard knows their role)
drop policy if exists "self read admin_users" on admin_users;
create policy "self read admin_users" on admin_users
  for select using (auth.uid() = user_id);

-- Only admins can manage other admins (recursive — check via SECURITY DEFINER fn)
create or replace function is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_users where user_id = uid and role = 'admin'
  );
$$;

drop policy if exists "admin manage admin_users" on admin_users;
create policy "admin manage admin_users" on admin_users
  for all using (is_admin(auth.uid()));

-- ---------- PROFIT: products.cost ----------
-- Allow admin to record cost-of-goods so analytics can compute profit
alter table products add column if not exists cost numeric(10,2) default 0;

-- Mirror on orders so historical profit isn't broken if product cost changes later
alter table orders add column if not exists cost_at_order numeric(10,2);

-- ---------- HELPFUL INDEXES ----------
create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_paid_at_idx on orders (paid_at desc);

-- DONE

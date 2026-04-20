-- ============================================
-- NASIJ - Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- PRODUCTS TABLE
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image text,
  price numeric(10,2) not null default 0,
  description text,
  created_at timestamptz default now()
);

-- ORDERS TABLE
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  address text not null,
  notes text,
  design_url text,
  size text,
  colors text,
  status text not null default 'pending',
  created_at timestamptz default now()
);

-- ENABLE RLS
alter table products enable row level security;
alter table orders enable row level security;

-- PUBLIC READ PRODUCTS
drop policy if exists "public read products" on products;
create policy "public read products" on products for select using (true);

-- PUBLIC CREATE ORDERS (so website visitors can order)
drop policy if exists "public insert orders" on orders;
create policy "public insert orders" on orders for insert with check (true);

-- AUTH MANAGE ALL (admin)
drop policy if exists "auth manage products" on products;
create policy "auth manage products" on products for all using (auth.role() = 'authenticated');

drop policy if exists "auth read orders" on orders;
create policy "auth read orders" on orders for select using (auth.role() = 'authenticated');

drop policy if exists "auth update orders" on orders;
create policy "auth update orders" on orders for update using (auth.role() = 'authenticated');

drop policy if exists "auth delete orders" on orders;
create policy "auth delete orders" on orders for delete using (auth.role() = 'authenticated');

-- ============================================
-- STORAGE BUCKETS
-- ============================================
insert into storage.buckets (id, name, public)
values ('designs', 'designs', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- PUBLIC UPLOAD DESIGNS (customer rug uploads)
drop policy if exists "public upload designs" on storage.objects;
create policy "public upload designs" on storage.objects
  for insert with check (bucket_id = 'designs');

drop policy if exists "public read designs" on storage.objects;
create policy "public read designs" on storage.objects
  for select using (bucket_id in ('designs', 'products'));

-- AUTH MANAGE PRODUCTS IMAGES
drop policy if exists "auth upload products" on storage.objects;
create policy "auth upload products" on storage.objects
  for insert with check (bucket_id = 'products' and auth.role() = 'authenticated');

drop policy if exists "auth delete products" on storage.objects;
create policy "auth delete products" on storage.objects
  for delete using (bucket_id = 'products' and auth.role() = 'authenticated');

-- ============================================
-- SEED SAMPLE PRODUCTS (optional)
-- ============================================
insert into products (name, price, description, image) values
  ('Desert Bloom', 280, 'A hand-tufted rug inspired by the dunes of the Western Desert — warm sand tones with a blush of terracotta.', 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800'),
  ('Olive Grove', 340, 'Deep greens and golden threads woven into a Mediterranean-inspired pattern.', 'https://images.unsplash.com/photo-1558882224-dda166733046?w=800'),
  ('Cairo Mist', 420, 'A soft geometric piece in muted neutrals, hand-finished with fringed edges.', 'https://images.unsplash.com/photo-1587500154541-fb48f21f1b42?w=800')
on conflict do nothing;

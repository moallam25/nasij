-- ============================================
-- NASIJ v5 — Product Categories
-- Run AFTER migration_v4.sql
-- Idempotent: safe to re-run
-- ============================================

-- Add a category column to products. We use a free-text column rather than
-- a separate categories table because the brand has a small, curated set
-- of categories that change rarely. RLS already allows public reads on
-- products so no policy changes needed.
alter table products add column if not exists category text default 'all';

-- Backfill existing rows so the filter "All" doesn't hide them
update products set category = 'all' where category is null;

-- Index for filter queries (small table, but cheap insurance)
create index if not exists products_category_idx on products (category);

-- DONE

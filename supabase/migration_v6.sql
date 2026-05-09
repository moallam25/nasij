-- ─────────────────────────────────────────────────────────────────────────────
-- migration_v6.sql — Product discount, visibility & merchandising controls
-- Run against your Supabase project in the SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- Discount percentage (0–100). NULL or 0 = no discount.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0
    CHECK (discount_percent >= 0 AND discount_percent <= 100);

-- Is this a featured/highlighted product?
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- Is the product currently available / in stock?
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS in_stock BOOLEAN NOT NULL DEFAULT true;

-- Should the product appear in the public gallery?
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_is_visible  ON products (is_visible);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products (is_featured);

-- ── Backfill: assume all existing products are visible + in stock ─────────────
UPDATE products
SET is_visible = true, in_stock = true
WHERE is_visible IS NULL OR in_stock IS NULL;

-- ── Gallery query helper ─────────────────────────────────────────────────────
-- The public gallery should only show: is_visible = true, ordered by
-- is_featured DESC so featured items appear first.
-- Example query:
-- SELECT * FROM products WHERE is_visible = true ORDER BY is_featured DESC, created_at DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- migration_v9.sql — Dynamic price ranges for rug sizes
-- Run against your Supabase project in the SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- Add estimated price range columns to the existing sizes table.
-- NULL means no price estimate is configured for that size yet.
ALTER TABLE sizes
  ADD COLUMN IF NOT EXISTS price_min INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS price_max INTEGER DEFAULT NULL;

-- Constraint: if either is set, min must be ≤ max
ALTER TABLE sizes
  ADD CONSTRAINT sizes_price_range_check CHECK (
    price_min IS NULL OR price_max IS NULL OR price_min <= price_max
  );

-- Optional seed: remove/edit to match your real pricing
-- UPDATE sizes SET price_min = 1800, price_max = 2800 WHERE width_cm <= 80;
-- UPDATE sizes SET price_min = 2500, price_max = 4200 WHERE width_cm BETWEEN 81 AND 120;
-- UPDATE sizes SET price_min = 4000, price_max = 7000 WHERE width_cm > 120;

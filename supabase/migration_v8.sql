-- ─────────────────────────────────────────────────────────────────────────────
-- migration_v8.sql — Shipping zones & payment config for cart/checkout
-- Run against your Supabase project in the SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Shipping zones ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipping_zones (
  id                     TEXT        PRIMARY KEY,   -- 'cairo_giza' | 'delta' | 'upper' | 'remote'
  name_ar                TEXT        NOT NULL,
  name_en                TEXT        NOT NULL,
  base_fee               NUMERIC     NOT NULL DEFAULT 0,
  large_order_extra      NUMERIC     NOT NULL DEFAULT 0,
  large_order_threshold  NUMERIC     NOT NULL DEFAULT 0,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Payment config ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_config (
  id             TEXT        PRIMARY KEY,   -- 'vodafone_cash' | 'instapay' | 'cod'
  name_ar        TEXT        NOT NULL,
  name_en        TEXT        NOT NULL,
  account_number TEXT        NOT NULL DEFAULT '',
  is_enabled     BOOLEAN     NOT NULL DEFAULT true,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE shipping_zones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config  ENABLE ROW LEVEL SECURITY;

-- Public read (needed by checkout form on the storefront)
CREATE POLICY "public_read_shipping" ON shipping_zones  FOR SELECT USING (true);
CREATE POLICY "public_read_payment"  ON payment_config  FOR SELECT USING (true);

-- Only authenticated admin can mutate
CREATE POLICY "admin_write_shipping" ON shipping_zones
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_write_payment" ON payment_config
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ── Seed: shipping zones ──────────────────────────────────────────────────────
INSERT INTO shipping_zones (id, name_ar, name_en, base_fee, large_order_extra, large_order_threshold)
VALUES
  ('cairo_giza', 'القاهرة والجيزة', 'Cairo & Giza',        60,  50, 8000),
  ('delta',      'الدلتا والساحل',  'Delta & North Coast',  75,  50, 8000),
  ('upper',      'الصعيد',           'Upper Egypt',          90,  50, 8000),
  ('remote',     'المناطق النائية',  'Remote Areas',        110,  50, 8000)
ON CONFLICT (id) DO NOTHING;

-- ── Seed: payment methods ─────────────────────────────────────────────────────
INSERT INTO payment_config (id, name_ar, name_en, account_number, is_enabled)
VALUES
  ('vodafone_cash', 'فودافون كاش',   'Vodafone Cash', '01000000000', true),
  ('instapay',      'إنستاباي',       'InstaPay',       '',            true),
  ('cod',           'الدفع عند الاستلام', 'Cash on Delivery', '', true)
ON CONFLICT (id) DO NOTHING;

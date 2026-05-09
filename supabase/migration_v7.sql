-- ─────────────────────────────────────────────────────────────────────────────
-- migration_v7.sql — Notification logs for event-driven push fallback
-- Run against your Supabase project in the SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- Stores every failed notification attempt so nothing is silently lost
CREATE TABLE IF NOT EXISTS notification_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   TEXT        NOT NULL,            -- 'order.created' | 'order.status_changed' | ...
  channel      TEXT        NOT NULL,            -- 'push' | 'email'
  recipient    TEXT        NOT NULL,            -- 'admin' | order_code | email address
  payload      JSONB       NOT NULL DEFAULT '{}',
  status       TEXT        NOT NULL DEFAULT 'failed', -- 'sent' | 'failed'
  attempts     INTEGER     NOT NULL DEFAULT 0,
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notif_logs_event   ON notification_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_notif_logs_status  ON notification_logs (status);
CREATE INDEX IF NOT EXISTS idx_notif_logs_created ON notification_logs (created_at DESC);

-- ── RLS — only the service role (server) can write ───────────────────────────
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
-- No public policies → only accessible via SUPABASE_SERVICE_ROLE_KEY

-- ── Realtime broadcast for new orders ──────────────────────────────────────
-- Ensure the orders table is in the realtime publication.
-- Run this if not already done:
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;

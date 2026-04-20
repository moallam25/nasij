-- ============================================
-- NASIJ v3 — Payment + Timeline + Notifications
-- Run AFTER schema.sql + migration_v2.sql
-- Idempotent: safe to re-run
-- ============================================

-- Custom dimensions (cm)
alter table orders add column if not exists length_cm integer;
alter table orders add column if not exists width_cm integer;

-- Payment fields
alter table orders add column if not exists payment_status text default 'unpaid';
alter table orders add column if not exists payment_id text;
alter table orders add column if not exists payment_method text;
alter table orders add column if not exists paid_at timestamptz;

-- Notification tracking (for idempotency)
alter table orders add column if not exists email_price_sent_at timestamptz;
alter table orders add column if not exists email_paid_sent_at timestamptz;
alter table orders add column if not exists customer_email text;

-- Timeline timestamps (so /track can show when each step happened)
alter table orders add column if not exists submitted_at timestamptz default now();
alter table orders add column if not exists pricing_added_at timestamptz;
alter table orders add column if not exists confirmed_at timestamptz;
alter table orders add column if not exists in_production_at timestamptz;
alter table orders add column if not exists delivered_at timestamptz;

-- Add new statuses (paid, in_production, delivered)
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check check (status in (
  'pending_review',
  'pricing_added',
  'waiting_customer_confirmation',
  'confirmed',
  'paid',
  'in_production',
  'delivered',
  'rejected',
  'completed',
  'pending', 'in_progress', 'cancelled'  -- legacy
));

-- Payment status check
alter table orders drop constraint if exists orders_payment_status_check;
alter table orders add constraint orders_payment_status_check check (payment_status in (
  'unpaid', 'pending', 'paid', 'failed', 'refunded'
));

-- Auto-stamp timeline columns when status changes
create or replace function stamp_timeline()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'pricing_added' and new.pricing_added_at is null then
      new.pricing_added_at := now();
    end if;
    if new.status = 'confirmed' and new.confirmed_at is null then
      new.confirmed_at := now();
    end if;
    if new.status = 'in_production' and new.in_production_at is null then
      new.in_production_at := now();
    end if;
    if new.status = 'delivered' and new.delivered_at is null then
      new.delivered_at := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_timeline on orders;
create trigger trg_stamp_timeline
  before update on orders
  for each row execute function stamp_timeline();

-- Backfill submitted_at for old rows
update orders set submitted_at = created_at where submitted_at is null;

-- Indexes
create index if not exists orders_payment_status_idx on orders (payment_status);
create index if not exists orders_payment_id_idx on orders (payment_id);

-- DONE

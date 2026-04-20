-- ============================================
-- NASIJ v2 — Production Order Workflow
-- Run AFTER schema.sql (or instead of it on a fresh project)
-- Idempotent: safe to re-run
-- ============================================

-- ORDERS table additions
alter table orders add column if not exists order_code text unique;
alter table orders add column if not exists admin_price numeric(10,2);
alter table orders add column if not exists admin_notes text;
alter table orders add column if not exists confirmation_sent boolean default false;
alter table orders add column if not exists updated_at timestamptz default now();

-- Update default status to pending_review for new flow
alter table orders alter column status set default 'pending_review';

-- Status check constraint
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check check (status in (
  'pending_review',
  'pricing_added',
  'waiting_customer_confirmation',
  'confirmed',
  'rejected',
  'completed',
  'pending',           -- legacy, still allowed
  'in_progress',       -- legacy
  'cancelled'          -- legacy
));

-- Order code generator: NAS-XXXXX (5 digits, zero padded, sequential-ish via random)
create or replace function generate_order_code()
returns text
language plpgsql
as $$
declare
  new_code text;
  attempts int := 0;
begin
  loop
    new_code := 'NAS-' || lpad(floor(random() * 100000)::text, 5, '0');
    exit when not exists (select 1 from orders where order_code = new_code);
    attempts := attempts + 1;
    if attempts > 50 then
      raise exception 'Could not generate unique order_code';
    end if;
  end loop;
  return new_code;
end;
$$;

-- Trigger: auto-set order_code on insert
create or replace function set_order_code()
returns trigger
language plpgsql
as $$
begin
  if new.order_code is null then
    new.order_code := generate_order_code();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_set_order_code on orders;
create trigger trg_set_order_code
  before insert on orders
  for each row execute function set_order_code();

-- Trigger: bump updated_at on update
create or replace function bump_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_bump_updated_at on orders;
create trigger trg_bump_updated_at
  before update on orders
  for each row execute function bump_updated_at();

-- Backfill existing orders without codes
update orders set order_code = generate_order_code() where order_code is null;

-- PUBLIC can read a single order by order_code (for /track page)
drop policy if exists "public read by code" on orders;
create policy "public read by code" on orders
  for select using (order_code is not null);
-- Note: in practice, customer must know the code; combine with anon-key + filtered query

-- INDEX for fast lookup
create index if not exists orders_order_code_idx on orders (order_code);
create index if not exists orders_status_idx on orders (status);

-- ============================================
-- DONE
-- ============================================

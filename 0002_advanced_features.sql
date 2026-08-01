-- =========================================================
-- AiSalesForesight — advanced features migration
-- Adds: suppliers, purchase orders, notification logging,
-- and supplier/lead-time fields on products.
-- =========================================================

create table suppliers (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  email text,
  whatsapp_number text,
  default_lead_time_days int default 14,
  created_at timestamptz default now()
);

alter table products add column if not exists supplier_id uuid references suppliers(id) on delete set null;
alter table products add column if not exists lead_time_days int; -- overrides org default when set

-- ---------- PURCHASE ORDERS ----------
create table purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','sent','received','cancelled')),
  total_estimated_cost numeric default 0,
  created_at timestamptz default now(),
  sent_at timestamptz
);

create table purchase_order_items (
  id uuid primary key default uuid_generate_v4(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity numeric not null,
  estimated_unit_cost numeric,
  reason text -- e.g. "Reorder point reached: 4 days of stock left"
);

-- ---------- NOTIFICATIONS LOG (WhatsApp / email digests) ----------
create table notifications_log (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  channel text not null check (channel in ('whatsapp','email')),
  kind text not null, -- e.g. 'reorder_alert', 'weekly_digest'
  recipient text not null,
  payload_json jsonb,
  status text not null default 'sent' check (status in ('sent','failed')),
  created_at timestamptz default now()
);

-- ---------- RLS ----------
alter table suppliers enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
alter table notifications_log enable row level security;

create policy "org read" on suppliers for select using (org_id in (select auth_org_ids()));
create policy "org write" on suppliers for insert with check (org_id in (select auth_org_ids()));
create policy "org update" on suppliers for update using (org_id in (select auth_org_ids()));

create policy "org read" on purchase_orders for select using (org_id in (select auth_org_ids()));
create policy "org write" on purchase_orders for insert with check (org_id in (select auth_org_ids()));
create policy "org update" on purchase_orders for update using (org_id in (select auth_org_ids()));

create policy "org read" on purchase_order_items for select using (
  purchase_order_id in (select id from purchase_orders where org_id in (select auth_org_ids()))
);
create policy "org write" on purchase_order_items for insert with check (
  purchase_order_id in (select id from purchase_orders where org_id in (select auth_org_ids()))
);

create policy "org read" on notifications_log for select using (org_id in (select auth_org_ids()));

-- Add 'bundle' as a recognized analytics_insights type (no enum constraint exists,
-- `type` is free text, so no migration needed there — just documenting it):
-- bundle: cross-sell / market-basket pairing recommendation

alter table calendar add column if not exists festival_name text;

alter table subscriptions add column if not exists currency text default 'usd' check (currency in ('usd','inr','aed','sar'));
alter table subscriptions add column if not exists payment_provider text default 'stripe' check (payment_provider in ('stripe','razorpay'));
alter table subscriptions add column if not exists razorpay_customer_id text;
alter table subscriptions add column if not exists razorpay_subscription_id text;

alter table organizations add column if not exists owner_whatsapp_number text;
alter table organizations add column if not exists digest_email text;

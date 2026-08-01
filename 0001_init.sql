-- =========================================================
-- AiSalesForesight — initial schema
-- Run via: supabase db push  (or paste into SQL editor)
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------- ORGANIZATIONS & MEMBERSHIP ----------
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  timezone text default 'UTC',
  default_lead_time_days int default 14,
  created_at timestamptz default now()
);

create table memberships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz default now(),
  unique (user_id, org_id)
);

-- Helper: returns org_ids the current JWT user belongs to
create or replace function auth_org_ids()
returns setof uuid
language sql stable
as $$
  select org_id from memberships where user_id = auth.uid();
$$;

-- ---------- UPLOADS / DATASETS ----------
create table uploads (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  storage_path text not null,
  kind text not null check (kind in ('sales','inventory')),
  status text not null default 'pending' check (status in ('pending','processing','ready','failed')),
  error_message text,
  created_at timestamptz default now(),
  processed_at timestamptz
);

-- ---------- PRODUCTS ----------
create table products (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  external_product_id text,        -- id as it appeared in the uploaded file
  name text not null,
  category text,
  unit_cost numeric,
  created_at timestamptz default now(),
  unique (org_id, external_product_id)
);

-- ---------- CALENDAR ----------
create table calendar (
  date date primary key,
  week int,
  month int,
  year int,
  season text,
  is_holiday boolean default false
);

-- ---------- SALES ----------
create table sales (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  date date not null,
  quantity numeric not null,
  price numeric not null,
  location text,
  discount_flag boolean default false,
  order_id text,
  created_at timestamptz default now()
);
create index sales_org_date_idx on sales (org_id, date);
create index sales_org_product_idx on sales (org_id, product_id);

-- ---------- INVENTORY SNAPSHOTS ----------
create table inventory_snapshots (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  date date not null,
  stock_qty numeric not null,
  location text,
  created_at timestamptz default now()
);
create index inv_org_product_idx on inventory_snapshots (org_id, product_id);

-- ---------- FORECASTS ----------
create table forecasts (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  date date not null,               -- future date being predicted
  predicted_qty numeric not null,
  model_version text not null,
  forecast_run_id uuid not null,
  created_at timestamptz default now()
);
create index forecasts_org_product_idx on forecasts (org_id, product_id, date);

-- ---------- INVENTORY INSIGHTS (risk tags) ----------
create table inventory_insights (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  location text,
  status text not null check (status in ('reorder_now','at_risk','healthy','overstock')),
  avg_daily_demand numeric,
  demand_std numeric,
  reorder_point numeric,
  safety_stock numeric,
  revenue_at_risk numeric,
  capital_locked numeric,
  computed_at timestamptz default now()
);
create index inv_insights_org_status_idx on inventory_insights (org_id, status);

-- ---------- ANALYTICS INSIGHTS (trends, promo, elasticity, etc.) ----------
create table analytics_insights (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  type text not null,               -- trend_up | trend_down | cannibalization | promo_impact | elasticity | rebalance | hidden_gem
  product_id uuid references products(id) on delete set null,
  message text not null,
  metrics_json jsonb,
  created_at timestamptz default now()
);
create index analytics_org_type_idx on analytics_insights (org_id, type, created_at desc);

-- ---------- CHAT ----------
create table chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  referenced_products jsonb,
  created_at timestamptz default now()
);

-- ---------- SUBSCRIPTIONS ----------
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'trial' check (plan in ('trial','basic','pro','enterprise')),
  status text not null default 'active',
  product_limit int default 25,
  features_json jsonb default '{}',
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table organizations enable row level security;
alter table memberships enable row level security;
alter table uploads enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table inventory_snapshots enable row level security;
alter table forecasts enable row level security;
alter table inventory_insights enable row level security;
alter table analytics_insights enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table subscriptions enable row level security;

create policy "org members can read their org" on organizations
  for select using (id in (select auth_org_ids()));

create policy "members can read own memberships" on memberships
  for select using (user_id = auth.uid());

-- Generic pattern applied to every org-scoped table:
create policy "org read" on uploads for select using (org_id in (select auth_org_ids()));
create policy "org write" on uploads for insert with check (org_id in (select auth_org_ids()));

create policy "org read" on products for select using (org_id in (select auth_org_ids()));
create policy "org write" on products for insert with check (org_id in (select auth_org_ids()));
create policy "org update" on products for update using (org_id in (select auth_org_ids()));

create policy "org read" on sales for select using (org_id in (select auth_org_ids()));
create policy "org write" on sales for insert with check (org_id in (select auth_org_ids()));

create policy "org read" on inventory_snapshots for select using (org_id in (select auth_org_ids()));
create policy "org write" on inventory_snapshots for insert with check (org_id in (select auth_org_ids()));

create policy "org read" on forecasts for select using (org_id in (select auth_org_ids()));

create policy "org read" on inventory_insights for select using (org_id in (select auth_org_ids()));

create policy "org read" on analytics_insights for select using (org_id in (select auth_org_ids()));

create policy "org read" on chat_sessions for select using (org_id in (select auth_org_ids()));
create policy "org write" on chat_sessions for insert with check (org_id in (select auth_org_ids()));

create policy "org read" on chat_messages for select using (org_id in (select auth_org_ids()));
create policy "org write" on chat_messages for insert with check (org_id in (select auth_org_ids()));

create policy "org read" on subscriptions for select using (org_id in (select auth_org_ids()));

-- NOTE: the FastAPI service uses the SUPABASE SERVICE ROLE key for writes that
-- happen outside a user session (ingest pipeline, ML jobs). The service role
-- bypasses RLS, so the service code MUST always filter/write with an explicit
-- org_id taken from a verified JWT or trusted internal call — never trust a
-- client-supplied org_id on write endpoints.

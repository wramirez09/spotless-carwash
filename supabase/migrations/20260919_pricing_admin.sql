-- Pricing + sales administration — the data behind /admin/pricing.
--
-- Apply to BOTH Supabase projects (spotless-customers and
-- spotless-customers-dev). There is no migration runner wired up for this
-- repo; this file is the source of truth for what was applied by hand.
--
-- These tables REPLACE hardcoded config, they do not duplicate it:
--   * catalog_prices  <- the PROD_/DEV_STRIPE_PRICE_{PACK,SINGLE}_* env vars
--   * sales           <- the SEASONAL_SALES constant in lib/salesSchedule.ts
--   * pricing_settings<- the PROD_/DEV_STRIPE_COUPON_PACK_DISCOUNT env var
-- The env vars stay in place as the fallback for when Supabase is unreachable
-- or unconfigured (see lib/pricingStore.ts), so an outage here degrades to
-- today's behavior rather than taking checkout down.

-- ---------------------------------------------------------------------------
-- catalog_prices — one row per (kind, wash_value) generation.
-- ---------------------------------------------------------------------------
-- Stripe Prices are IMMUTABLE: changing what a 4-pack costs means creating a
-- new Price object and repointing at it. So this table is append-only — a
-- price change inserts a new row and flips the old one's `active` to false,
-- which leaves a free audit trail of what the pack cost and when.
create table if not exists public.catalog_prices (
  id uuid primary key default gen_random_uuid(),

  -- 'pack' (4 tokens) | 'single' (1 token)
  kind text not null check (kind in ('pack', 'single')),
  -- Wash denomination: '8' | '9' | '10' | '12'
  wash_value text not null check (wash_value in ('8', '9', '10', '12')),

  unit_amount_cents integer not null check (unit_amount_cents > 0),

  stripe_price_id text not null,
  stripe_product_id text,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  created_by text
);

-- Exactly one live Price per SKU. A partial unique index (rather than a plain
-- one on (kind, wash_value)) is what lets the superseded rows stick around.
create unique index if not exists catalog_prices_active_sku_idx
  on public.catalog_prices (kind, wash_value)
  where active;

create index if not exists catalog_prices_created_at_idx
  on public.catalog_prices (created_at desc);

-- ---------------------------------------------------------------------------
-- sales — scheduled seasonal discounts.
-- ---------------------------------------------------------------------------
-- `extra_discount_cents` is the amount stacked ON TOP of the always-on 4-pack
-- bundle discount. The Stripe coupon is created with the COMBINED amount
-- (base + extra) because Stripe Checkout applies only one coupon per session;
-- the two-chip display on the pack cards is presentation only. See the notes
-- in lib/stripePricing.ts, which this preserves.
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),

  -- URL/metadata-safe identifier, e.g. 'labor-day-2026'. Also the suffix of
  -- the `pack_discount` value written to Stripe session metadata.
  slug text not null unique,

  -- Copy shown to customers.
  label text not null,        -- coupon chip, e.g. "Labor Day"
  badge text not null,        -- SalesBanner badge, e.g. "LABOR DAY"
  emoji text not null default '✨',
  end_label text,             -- "Mon, Sep 7" — derived from ends_at when null

  starts_at timestamptz not null,
  ends_at timestamptz not null,
  constraint sales_window_ordered check (ends_at > starts_at),

  extra_discount_cents integer not null check (extra_discount_cents > 0),

  -- Set once the coupon has been provisioned in Stripe.
  stripe_coupon_id text,
  -- Combined amount (base + extra) the Stripe coupon was created with, so a
  -- later change to the base discount is detectable as drift.
  stripe_amount_off_cents integer,

  -- 'draft'     — not provisioned, never customer-facing
  -- 'scheduled' — provisioned, window is in the future or in progress
  -- 'canceled'  — manually pulled; never goes live again
  -- Whether a scheduled sale is LIVE is derived from the window at read time,
  -- not stored, so a stale cron run can't strand a sale in the wrong state.
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'canceled')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text
);

create index if not exists sales_window_idx on public.sales (starts_at, ends_at);
create index if not exists sales_status_idx on public.sales (status);

-- ---------------------------------------------------------------------------
-- pricing_settings — single-row table for site-wide pricing knobs.
-- ---------------------------------------------------------------------------
-- The `id` check pins this to exactly one row, so callers can read it with
-- `.single()` and writers can upsert without a where-clause race.
create table if not exists public.pricing_settings (
  id integer primary key default 1 check (id = 1),

  -- The always-on 4-pack bundle discount, in cents ($5.00 = 500).
  base_discount_cents integer not null default 500 check (base_discount_cents > 0),
  base_coupon_id text,

  updated_at timestamptz not null default now(),
  updated_by text
);

insert into public.pricing_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- pricing_audit_log — who changed what.
-- ---------------------------------------------------------------------------
-- Pricing and sale edits move real money, and both the Supabase row and the
-- Stripe object are written by the same action. When those two disagree this
-- log is the only record of what was attempted, so it is written on failure
-- as well as success.
create table if not exists public.pricing_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_email text,
  action text not null,
  -- Free-form payload: the before/after amounts, Stripe IDs, error message.
  detail jsonb not null default '{}'::jsonb,
  succeeded boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists pricing_audit_log_created_at_idx
  on public.pricing_audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- RLS — these tables are only ever touched by the service-role client
-- (lib/supabase.ts), which bypasses RLS. Enabling it with no policy means the
-- anon/publishable key can read nothing, which is what we want: pricing writes
-- must go through the admin server actions.
-- ---------------------------------------------------------------------------
alter table public.catalog_prices enable row level security;
alter table public.sales enable row level security;
alter table public.pricing_settings enable row level security;
alter table public.pricing_audit_log enable row level security;

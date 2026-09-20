-- Wash Token Subscription — subscriptions + fulfillments.
--
-- Apply to BOTH Supabase projects (spotless-customers and
-- spotless-customers-dev). There is no migration runner wired up for this repo;
-- this file is the source of truth for what was applied by hand.
--
-- Requires the existing `customers` table (see the buy-tokens order schema).

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,

  stripe_subscription_id text not null unique,
  stripe_customer_id text,

  email text not null,
  name text,
  phone text,

  -- 'weekly' | 'frequent' | 'family' — see lib/subscriptionPricing.ts.
  plan text,
  tokens_per_cycle integer,
  -- Wash value of the tokens shipped ('12' = Lustre). Stored rather than
  -- hardcoded so the shipped denomination is explicit on every row, matching
  -- the `wash_value` column on `orders`.
  wash_value text not null default '12',

  -- 'active' | 'past_due' | 'paused' | 'canceled' | 'incomplete'
  status text not null default 'active',

  ship_line1 text,
  ship_line2 text,
  ship_city text,
  ship_state text,
  ship_postal_code text,
  ship_country text not null default 'US',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscriptions_email_idx on public.subscriptions (email);
create index if not exists subscriptions_stripe_customer_idx
  on public.subscriptions (stripe_customer_id);

-- One row per paid invoice = one shipment. `stripe_invoice_id` is the
-- idempotency key: Stripe redelivers webhooks, and a dunning retry that
-- succeeds fires invoice.paid again for the SAME invoice. The unique
-- constraint is what collapses those into a single shipment.
create table if not exists public.fulfillments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions (id) on delete cascade,

  stripe_invoice_id text not null unique,

  period_start timestamptz,
  period_end timestamptz,

  tokens_count integer not null,
  wash_value text not null default '12',

  -- 'pending' | 'shipped'
  status text not null default 'pending',
  -- Null for nearly every row: USPS tracking only exists on Ground Advantage,
  -- and these ship as First-Class letters. `status` is the completion signal.
  tracking_number text,
  shipped_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists fulfillments_status_idx on public.fulfillments (status);
create index if not exists fulfillments_subscription_idx
  on public.fulfillments (subscription_id);
create index if not exists fulfillments_created_idx on public.fulfillments (created_at desc);

-- Server-only access. Both tables are written and read exclusively through the
-- service-role client in lib/supabase.ts, so RLS is on with no policies —
-- matching customers / orders / promotion_signups.
alter table public.subscriptions enable row level security;
alter table public.fulfillments enable row level security;

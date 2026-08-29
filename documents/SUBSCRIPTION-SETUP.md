# Wash Token Subscription — go-live runbook

Everything in the code is committed (`cf989ac` on `dev`, not pushed). The
feature is **inert** until the steps below are done: with no price IDs
configured, the page falls back to the proposal's prices for display and
`POST /api/subscription-checkout` returns `500 Subscriptions not configured`.

Nothing here deploys anything. Setting env vars alone cannot expose the page —
production still runs the previous commit until `dev` is merged and deployed.

---

## Why this isn't already done

The recurring Stripe Prices have never been created, and there is no working
Stripe credential on this machine to create them with:

| Route | State |
|---|---|
| Stripe MCP connector | Requires OAuth; this session is non-interactive |
| `.env.local` | Every `*_STRIPE_SECRET_KEY` is empty |
| Vercel env vars | All Stripe vars are type **Secret** — `vercel env pull` returns `[SENSITIVE]` by design |
| Stripe CLI (`~/.config/stripe/config.toml`) | All three stored keys are expired/invalid |

**`stripe login` unblocks most of this.** It's interactive (opens a browser), so
it has to be you — but once the CLI has a fresh key, the test-mode half below
can be done for you in one pass.

---

## Step 1 — Create the Stripe Product and Prices

Subscribers choose which wash token they receive, so each plan needs **one Price
per denomination** — 12 Prices per mode, 24 in total across test and live. One
Product is enough; the denomination lives on the Price.

Monthly amounts in dollars:

| Plan | Tokens | $8 | $9 | $10 | $12 |
|---|---|---|---|---|---|
| Weekly (`WEEKLY`) | 4 | 24 | 28 | 32 | **40** |
| Frequent (`FREQUENT`) | 8 | 44 | 52 | 60 | **76** |
| Family / Fleet (`FAMILY`) | 12 | 60 | 72 | 84 | **108** |

The **$12 column is the proposal, unchanged**. The rest come from a per-token
discount off the list wash price — $2.00 / $2.50 / $3.00 by plan — which keeps
every cell on a whole dollar and beats the equivalent one-time 4-pack at every
denomination. The source of truth is `PLAN_PER_TOKEN_DISCOUNT_CENTS` in
`lib/subscriptionPricing.ts`, pinned by `lib/subscriptionPricing.test.ts`.

Currency `usd`, `recurring.interval = month`.

```bash
stripe products create --name "Spotless Wash Token Subscription" --description "Wash tokens mailed monthly"
```

Then one Price per cell, using the returned `prod_…`:

```bash
stripe prices create --product prod_XXX --currency usd --unit-amount 4000 --recurring.interval month --nickname "Weekly · 4 × \$12"
```

Repeat for all 12 amounts, then again with `--live`. Keep every `price_…` id
against its plan + denomination.

## Step 2 — Configure the Customer Portal

Enable the Billing Customer Portal in both modes, allowing: cancel, switch plan,
update payment method, update billing/shipping address. Note the `bpc_…`
configuration id if you want to pin one — it's optional, and Stripe falls back
to the account default when `*_STRIPE_BILLING_PORTAL_CONFIG` is unset.

## Step 3 — Set the Vercel env vars

Project `spotless-carwash`, scope `spotless-carwash`. Twenty-four required, two optional.

| Variable | Value | Environments |
|---|---|---|
| `DEV_STRIPE_PRICE_SUB_<PLAN>_<WASH>` | test `price_…` | Preview, Production |
| `PROD_STRIPE_PRICE_SUB_<PLAN>_<WASH>` | live `price_…` | Preview, Production |
| `DEV_STRIPE_BILLING_PORTAL_CONFIG` | test `bpc_…` *(optional)* | Preview, Production |
| `PROD_STRIPE_BILLING_PORTAL_CONFIG` | live `bpc_…` *(optional)* | Preview, Production |

`<PLAN>` is `WEEKLY` | `FREQUENT` | `FAMILY`; `<WASH>` is `8` | `9` | `10` | `12`
— e.g. `DEV_STRIPE_PRICE_SUB_FAMILY_10`. That is 24 price vars in total, keyed
the same way the existing `DEV_STRIPE_PRICE_PACK_<v>` vars already are.

Any variant left unset simply falls back to the computed price for display and
returns "Subscriptions not configured" at checkout, so you can configure one
denomination at a time.

Both prefixes go on both environments, matching how the existing
`DEV_`/`PROD_STRIPE_PRICE_PACK_*` vars are already set. `lib/stripeEnv.ts`
selects by prefix at runtime: `VERCEL_ENV === 'production'` reads `PROD_*`,
everything else reads `DEV_*` — so Preview deploys stay on the sandbox account.

```bash
vercel env add DEV_STRIPE_PRICE_SUB_WEEKLY_12 preview
```

**Gotcha:** piping a value into `vercel env add` via stdin has silently saved an
empty value on this project before. Type the value at the prompt, or set it in
the dashboard, and read it back with `vercel env ls` to confirm it took.

An empty value is now handled safely — `lib/stripeEnv.ts` treats blank as unset,
so a half-configured deploy degrades to "Subscriptions not configured" instead
of sending an empty price id to Stripe — but it also means a blank var silently
leaves the feature off. Verify rather than assume.

## Step 4 — Apply the database migration

`supabase/migrations/20260828_subscriptions.sql`, by hand, to **both** projects:
`spotless-customers` (prod) and `spotless-customers-dev`. There is no migration
runner in this repo.

Check first whether `orders` exists — it was missing from both projects at last
check, which also breaks one-time token persistence.

## Step 5 — Add the webhook events

The existing Stripe webhook endpoint must also send:

- `invoice.paid` — the only fulfillment trigger
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.updated` — keeps shipping addresses current after portal edits

`checkout.session.completed` is already subscribed.

## Step 6 — Studio copy

Author the **Token subscription page** singleton in the Sanity Studio. Nothing
was seeded; the page renders inline fallbacks until you fill it in.

The footer link to `/buy-tokens/subscribe` also has to be added in the Studio —
the footer's columns come from Sanity, so editing the code fallback has no
effect on the live site.

---

## Verifying before merge

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Subscribe with card `4242 4242 4242 4242`, then check `spotless-customers-dev`:
one `subscriptions` row and **exactly one** `fulfillments` row for cycle 1.
Two rows would mean the `session.mode` branch regressed — Stripe fires both
`checkout.session.completed` and `invoice.paid` for a first payment.

Then advance a Stripe test clock a cycle and confirm one further shipment, and
use `4000 0000 0000 0341` to confirm a failed payment marks the subscription
`past_due` and queues nothing.

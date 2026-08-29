# Wash Token Subscription — go-live runbook

Everything in the code is committed (`cf989ac` on `dev`, not pushed). The
feature is **inert** until the steps below are done: with no price IDs
configured, the page falls back to the proposal's prices for display and
`POST /api/subscription-checkout` returns `500 Subscriptions not configured`.

Nothing here deploys anything. Setting env vars alone cannot expose the page —
production still runs the previous commit until `dev` is merged and deployed.

---

## Why this isn't already done

The three recurring Stripe Prices have never been created, and there is no
working Stripe credential on this machine to create them with:

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

One Product, three monthly recurring Prices, **in both test and live mode**.

| Plan | Amount | Interval | Env suffix |
|---|---|---|---|
| Weekly — 4 tokens | `$40.00` (4000) | month | `WEEKLY` |
| Frequent — 8 tokens | `$76.00` (7600) | month | `FREQUENT` |
| Family / Fleet — 12 tokens | `$108.00` (10800) | month | `FAMILY` |

Currency `usd`. Prices come from the proposal, Section 3.1.

Via the CLI once logged in (repeat with `--live` for live mode):

```bash
stripe products create --name "Spotless Wash Token Subscription" --description "Wash tokens mailed monthly"
```

Then, using the returned `prod_…` id:

```bash
stripe prices create --product prod_XXX --currency usd --unit-amount 4000 --recurring.interval month --nickname "Weekly · 4 tokens"
```

Repeat for 7600 (Frequent) and 10800 (Family). Keep the six resulting `price_…`
ids — three from test mode, three from live.

## Step 2 — Configure the Customer Portal

Enable the Billing Customer Portal in both modes, allowing: cancel, switch plan,
update payment method, update billing/shipping address. Note the `bpc_…`
configuration id if you want to pin one — it's optional, and Stripe falls back
to the account default when `*_STRIPE_BILLING_PORTAL_CONFIG` is unset.

## Step 3 — Set the Vercel env vars

Project `spotless-carwash`, scope `spotless-carwash`. Six required, two optional.

| Variable | Value | Environments |
|---|---|---|
| `DEV_STRIPE_PRICE_SUB_WEEKLY` | test `price_…` | Preview, Production |
| `DEV_STRIPE_PRICE_SUB_FREQUENT` | test `price_…` | Preview, Production |
| `DEV_STRIPE_PRICE_SUB_FAMILY` | test `price_…` | Preview, Production |
| `PROD_STRIPE_PRICE_SUB_WEEKLY` | live `price_…` | Preview, Production |
| `PROD_STRIPE_PRICE_SUB_FREQUENT` | live `price_…` | Preview, Production |
| `PROD_STRIPE_PRICE_SUB_FAMILY` | live `price_…` | Preview, Production |
| `DEV_STRIPE_BILLING_PORTAL_CONFIG` | test `bpc_…` *(optional)* | Preview, Production |
| `PROD_STRIPE_BILLING_PORTAL_CONFIG` | live `bpc_…` *(optional)* | Preview, Production |

Both prefixes go on both environments, matching how the existing
`DEV_`/`PROD_STRIPE_PRICE_PACK_*` vars are already set. `lib/stripeEnv.ts`
selects by prefix at runtime: `VERCEL_ENV === 'production'` reads `PROD_*`,
everything else reads `DEV_*` — so Preview deploys stay on the sandbox account.

```bash
vercel env add DEV_STRIPE_PRICE_SUB_WEEKLY preview
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

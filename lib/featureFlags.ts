// Customer-facing feature gates.
//
// Pure and dependency-free so it runs in server components, route handlers and
// tests alike. Anything gated here must also be gated at its own route, not
// just at the links pointing to it — a hidden link is not access control, and
// these URLs are in the sitemap and may already be indexed.

// Indexed rather than a closed shape so `process.env` (ProcessEnv) satisfies
// it, while tests can still pass a plain literal.
type Env = { [key: string]: string | undefined }

/**
 * Whether the wash-token subscription is offered to customers.
 *
 * Defaults to OFF on Vercel Production and ON everywhere else, so the feature
 * stays fully exercisable in local dev, preview deploys and e2e while staying
 * invisible on spotlessautowash.com. It needs a Stripe Product, 12 Prices per
 * mode and 24 env vars before it works (documents/SUBSCRIPTION-SETUP.md);
 * shipping the links before that exists would let a customer fill in the form
 * and get "Subscriptions not configured" at checkout.
 *
 * Set SUBSCRIPTIONS_ENABLED=true in Vercel Production to turn it on — one env
 * var, no deploy needed.
 */
export function subscriptionsEnabled(env: Env = process.env): boolean {
  const raw = env.SUBSCRIPTIONS_ENABLED?.trim().toLowerCase()
  if (raw === 'true' || raw === '1') return true
  if (raw === 'false' || raw === '0') return false
  return env.VERCEL_ENV !== 'production'
}

/** True for any link pointing at the subscription flow. */
export function isSubscribeHref(href: string | undefined | null): boolean {
  return (href ?? '').includes('/buy-tokens/subscribe')
}

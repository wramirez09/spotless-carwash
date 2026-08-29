import 'server-only'

type WashValue = '8' | '9' | '10' | '12'

/** Subscription plan ids, uppercased for the env-var suffix. */
type SubscriptionPlanEnvKey = 'WEEKLY' | 'FREQUENT' | 'FAMILY'

// VERCEL_ENV is auto-set by Vercel: 'production' | 'preview' | 'development'.
// Locally it's undefined. We swap to PROD_* only on Vercel Production so that
// Preview deploys and local dev stay on the sandbox (DEV_*) account.
function isProductionEnv(): boolean {
  return process.env.VERCEL_ENV === 'production'
}

function pickEnv(prodKey: string, devKey: string): string | undefined {
  const raw = isProductionEnv() ? process.env[prodKey] : process.env[devKey]
  // Treat a present-but-empty value as unset. Both Vercel and .env files make
  // it easy to declare a key with no value, and `''` is not nullish — so every
  // `?? fallback` downstream would be skipped and the empty string handed to
  // Stripe as a price or coupon id. That surfaces far from the cause: an empty
  // coupon id breaks checkout, and two empty ids collide as React keys on the
  // pack cards.
  const trimmed = raw?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * Like `pickEnv`, but throws when running on Vercel Production with an unset
 * PROD_* value. Use for price + coupon IDs where silently falling back to a
 * sandbox ID would surface as a late, opaque Stripe error at checkout time.
 * Secrets keep the soft-undefined behavior so API routes can return their
 * controlled 500 "not configured" response.
 */
function pickEnvOrThrowOnProd(prodKey: string, devKey: string): string | undefined {
  const value = pickEnv(prodKey, devKey)
  if (isProductionEnv() && !value) {
    throw new Error(
      `[stripeEnv] ${prodKey} is required on Vercel Production but was not set. ` +
        `Add it to the Production environment variables in the Vercel dashboard.`,
    )
  }
  return value
}

export function getStripeSecretKey(): string | undefined {
  return pickEnv('PROD_STRIPE_SECRET_KEY', 'DEV_STRIPE_SECRET_KEY')
}

export function getStripeWebhookSecret(): string | undefined {
  return pickEnv('PROD_STRIPE_WEBHOOK_SECRET', 'DEV_STRIPE_WEBHOOK_SECRET')
}

export function getPackPriceId(v: WashValue): string | undefined {
  return pickEnvOrThrowOnProd(
    `PROD_STRIPE_PRICE_PACK_${v}`,
    `DEV_STRIPE_PRICE_PACK_${v}`,
  )
}

export function getSinglePriceId(v: WashValue): string | undefined {
  return pickEnvOrThrowOnProd(
    `PROD_STRIPE_PRICE_SINGLE_${v}`,
    `DEV_STRIPE_PRICE_SINGLE_${v}`,
  )
}

/**
 * Recurring Price ID for a subscription plan (e.g. 'WEEKLY' →
 * PROD_/DEV_STRIPE_PRICE_SUB_WEEKLY). Throws on Vercel Production when unset —
 * a silent sandbox fallback there would surface as an opaque Stripe error at
 * checkout rather than at deploy time.
 */
export function getSubscriptionPriceId(
  plan: SubscriptionPlanEnvKey,
): string | undefined {
  return pickEnvOrThrowOnProd(
    `PROD_STRIPE_PRICE_SUB_${plan}`,
    `DEV_STRIPE_PRICE_SUB_${plan}`,
  )
}

/**
 * Optional Customer Portal configuration ID. Unset is fine — Stripe falls back
 * to the account's default portal configuration — so this uses the soft
 * `pickEnv` rather than throwing on production.
 */
export function getBillingPortalConfigId(): string | undefined {
  return pickEnv(
    'PROD_STRIPE_BILLING_PORTAL_CONFIG',
    'DEV_STRIPE_BILLING_PORTAL_CONFIG',
  )
}

export function getPackDiscountCouponId(): string | undefined {
  return pickEnvOrThrowOnProd(
    'PROD_STRIPE_COUPON_PACK_DISCOUNT',
    'DEV_STRIPE_COUPON_PACK_DISCOUNT',
  )
}

/**
 * Coupon ID for a seasonal sale, keyed by the sale's `couponEnvSuffix`
 * (e.g. 'LABOR_DAY_2026' → PROD_/DEV_STRIPE_COUPON_LABOR_DAY_2026).
 * Every new seasonal sale needs its own pair of env vars.
 */
export function getSeasonalCouponId(envSuffix: string): string | undefined {
  return pickEnvOrThrowOnProd(
    `PROD_STRIPE_COUPON_${envSuffix}`,
    `DEV_STRIPE_COUPON_${envSuffix}`,
  )
}

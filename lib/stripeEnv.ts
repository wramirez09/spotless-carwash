import 'server-only'

type WashValue = '8' | '9' | '10' | '12'

// VERCEL_ENV is auto-set by Vercel: 'production' | 'preview' | 'development'.
// Locally it's undefined. We swap to PROD_* only on Vercel Production so that
// Preview deploys and local dev stay on the sandbox (DEV_*) account.
function isProductionEnv(): boolean {
  return process.env.VERCEL_ENV === 'production'
}

function pickEnv(prodKey: string, devKey: string): string | undefined {
  return isProductionEnv() ? process.env[prodKey] : process.env[devKey]
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

export function getPackDiscountCouponId(): string | undefined {
  return pickEnvOrThrowOnProd(
    'PROD_STRIPE_COUPON_PACK_DISCOUNT',
    'DEV_STRIPE_COUPON_PACK_DISCOUNT',
  )
}

export function getFathersDayCouponId(): string | undefined {
  return pickEnvOrThrowOnProd(
    'PROD_STRIPE_COUPON_FATHERS_DAY_2026',
    'DEV_STRIPE_COUPON_FATHERS_DAY_2026',
  )
}

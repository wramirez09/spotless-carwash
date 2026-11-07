import 'server-only'
import Stripe from 'stripe'
import { getStripeSecretKey, getSubscriptionPriceId } from './stripeEnv'
import { loadSubscriptionPrices } from './stripeCatalog'
import { subscriptionLookupKey } from './pricing/model'
import { getPricingSnapshot } from './pricingStore'

// Wash Token Subscription pricing.
//
// Deliberately does NOT import from lib/stripePricing. Subscription tiers are
// set by the business proposal and are independent of one-time pack/single
// pricing — keeping them apart stops the seasonal-coupon logic in stripePricing
// from ever leaking into a recurring charge, and stops a pack price change from
// silently moving a subscriber's monthly bill.

export const SUBSCRIPTION_PLAN_IDS = ['weekly', 'frequent', 'family'] as const
export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLAN_IDS)[number]

/** Token denominations a subscriber can choose, matching the one-time store. */
export const SUBSCRIPTION_WASH_VALUES = ['8', '9', '10', '12'] as const
export type SubscriptionWashValue = (typeof SUBSCRIPTION_WASH_VALUES)[number]

/** Pre-selected denomination — the tier the proposal anchors its prices on. */
export const DEFAULT_SUBSCRIPTION_WASH_VALUE: SubscriptionWashValue = '12'

/** Env-var suffix for each plan (see lib/stripeEnv getSubscriptionPriceId). */
const PLAN_ENV_KEY = {
  weekly: 'WEEKLY',
  frequent: 'FREQUENT',
  family: 'FAMILY',
} as const

/** List price of one wash at each denomination, in cents. */
const WASH_LIST_CENTS: Record<SubscriptionWashValue, number> = {
  '8': 800,
  '9': 900,
  '10': 1000,
  '12': 1200,
}

const PLAN_TOKENS: Record<SubscriptionPlanId, number> = {
  weekly: 4,
  frequent: 8,
  family: 12,
}

/**
 * Per-token discount off the list wash price, by plan, in cents.
 *
 * Chosen so the $12 (Lustre) column reproduces the proposal's headline prices
 * exactly — $40 / $76 / $108 — while every other denomination lands on a whole
 * dollar. The discount widens with plan size, which is the proposal's intent:
 * the more you commit to, the less each wash costs.
 *
 *   weekly   ($12 − $2.00) × 4  = $40
 *   frequent ($12 − $2.50) × 8  = $76
 *   family   ($12 − $3.00) × 12 = $108
 */
const PLAN_PER_TOKEN_DISCOUNT_CENTS: Record<SubscriptionPlanId, number> = {
  weekly: 200,
  frequent: 250,
  family: 300,
}

export type SubscriptionVariant = {
  washValue: SubscriptionWashValue
  /** Monthly charge in cents. */
  price: number
  /** price / tokensPerCycle, cents. */
  perToken: number
  /** Undiscounted wash price, cents — for the "vs" figure on the card. */
  listPerToken: number
  /** listPerToken - perToken, cents. */
  savePerToken: number
}

export type SubscriptionPlan = {
  id: SubscriptionPlanId
  /** Customer-facing plan name from the proposal. */
  name: string
  tokensPerCycle: number
  blurb: string
  featured?: boolean
  /** One entry per selectable token denomination. */
  variants: SubscriptionVariant[]
}

const PLAN_COPY: Record<SubscriptionPlanId, { name: string; blurb: string }> = {
  weekly: {
    name: 'Weekly',
    blurb: 'A wash a week. Four tokens in the mailbox every month.',
  },
  frequent: {
    name: 'Frequent',
    blurb: 'For drivers who wash more than most — eight tokens a month.',
  },
  family: {
    name: 'Family / Fleet',
    blurb: 'Two cars, or a car and a work truck. Twelve tokens a month.',
  },
}

export type SubscriptionPricing = {
  plans: SubscriptionPlan[]
}

/** Monthly charge for a plan at a given denomination, in cents. */
export function subscriptionMonthlyCents(
  plan: SubscriptionPlanId,
  washValue: SubscriptionWashValue,
): number {
  const perToken = WASH_LIST_CENTS[washValue] - PLAN_PER_TOKEN_DISCOUNT_CENTS[plan]
  return perToken * PLAN_TOKENS[plan]
}

/** Live single-token price per denomination, cents — the "vs" figure. */
type ListPrices = Partial<Record<SubscriptionWashValue, number>>

function buildVariant(
  plan: SubscriptionPlanId,
  washValue: SubscriptionWashValue,
  overrideCents?: number,
  listPrices?: ListPrices,
): SubscriptionVariant {
  const tokens = PLAN_TOKENS[plan]
  const price = overrideCents ?? subscriptionMonthlyCents(plan, washValue)
  const perToken = Math.round(price / tokens)
  // What a subscriber is compared against: one token bought outright, at the
  // price Stripe charges for it today. The static table only stands in when
  // Stripe has no single token of that value.
  const list = listPrices?.[washValue] ?? WASH_LIST_CENTS[washValue]
  return {
    washValue,
    price,
    perToken,
    listPerToken: list,
    savePerToken: list - perToken,
  }
}

function buildPlan(
  id: SubscriptionPlanId,
  overrides?: Partial<Record<SubscriptionWashValue, number>>,
  listPrices?: ListPrices,
): SubscriptionPlan {
  return {
    id,
    name: PLAN_COPY[id].name,
    tokensPerCycle: PLAN_TOKENS[id],
    blurb: PLAN_COPY[id].blurb,
    featured: id === 'frequent',
    variants: SUBSCRIPTION_WASH_VALUES.map((w) =>
      buildVariant(id, w, overrides?.[w], listPrices),
    ),
  }
}

export function fallbackSubscriptionPricing(): SubscriptionPricing {
  return { plans: SUBSCRIPTION_PLAN_IDS.map((id) => buildPlan(id)) }
}

/** Price ID for a plan + denomination, or undefined when the env var is unset. */
export function subscriptionPriceId(
  id: SubscriptionPlanId,
  washValue: SubscriptionWashValue,
): string | undefined {
  return getSubscriptionPriceId(PLAN_ENV_KEY[id], washValue)
}

export function isSubscriptionPlanId(value: unknown): value is SubscriptionPlanId {
  return (
    typeof value === 'string' &&
    (SUBSCRIPTION_PLAN_IDS as readonly string[]).includes(value)
  )
}

export function isSubscriptionWashValue(
  value: unknown,
): value is SubscriptionWashValue {
  return (
    typeof value === 'string' &&
    (SUBSCRIPTION_WASH_VALUES as readonly string[]).includes(value)
  )
}

export function getSubscriptionPlan(id: SubscriptionPlanId): SubscriptionPlan {
  return buildPlan(id)
}

/** The variant a customer actually selected. */
export function getSubscriptionVariant(
  id: SubscriptionPlanId,
  washValue: SubscriptionWashValue,
): SubscriptionVariant {
  return buildVariant(id, washValue)
}

let stripeSingleton: Stripe | null = null
function getStripe(): Stripe | null {
  if (stripeSingleton) return stripeSingleton
  const key = getStripeSecretKey()
  if (!key) return null
  stripeSingleton = new Stripe(key)
  return stripeSingleton
}

/**
 * Single-token prices from the Stripe catalog. Read through the pricing store
 * (not lib/stripePricing) so none of the one-time sale/coupon logic can reach
 * a recurring charge — this only feeds the "vs" comparison on the cards.
 */
async function liveSingleTokenPrices(): Promise<ListPrices> {
  try {
    const { catalog } = await getPricingSnapshot()
    const out: ListPrices = {}
    for (const s of catalog) {
      if (s.kind !== 'single' || s.cents == null) continue
      if (isSubscriptionWashValue(s.washValue)) out[s.washValue] = s.cents
    }
    return out
  } catch {
    return {}
  }
}

/** Map key for one plan × denomination. */
export function subscriptionVariantKey(
  plan: SubscriptionPlanId,
  washValue: SubscriptionWashValue,
): string {
  return `${plan}:${washValue}`
}

export type ResolvedSubscriptionPrice = {
  priceId: string
  /** Null when only an env-var Price ID is known and it couldn't be read. */
  cents: number | null
  /** 'stripe' — keyed by lookup key (set from /admin/pricing); 'env' — deploy config. */
  source: 'stripe' | 'env'
}

/**
 * The recurring Price each plan × denomination currently sells at.
 *
 * Stripe first: a Price carrying the variant's `lookup_key` (moved there by
 * /admin/pricing) is authoritative. A variant never priced that way falls
 * back to its env-var Price ID, read from Stripe for its amount. Variants with
 * neither are simply absent — the caller decides whether that means "show the
 * computed price" (display) or "not configured" (checkout).
 */
export async function resolveSubscriptionPrices(): Promise<
  Map<string, ResolvedSubscriptionPrice>
> {
  const out = new Map<string, ResolvedSubscriptionPrice>()
  const stripe = getStripe()

  const variants = SUBSCRIPTION_PLAN_IDS.flatMap((plan) =>
    SUBSCRIPTION_WASH_VALUES.map((washValue) => ({ plan, washValue })),
  )

  const keyed = stripe
    ? await loadSubscriptionPrices(
        stripe,
        variants.map((v) => subscriptionLookupKey(v.plan, v.washValue)),
      )
    : null

  await Promise.all(
    variants.map(async ({ plan, washValue }) => {
      const key = subscriptionVariantKey(plan, washValue)
      const hit = keyed?.get(subscriptionLookupKey(plan, washValue))
      if (hit) {
        out.set(key, { priceId: hit.priceId, cents: hit.cents, source: 'stripe' })
        return
      }
      let envId: string | undefined
      try {
        envId = subscriptionPriceId(plan, washValue)
      } catch {
        // Throws on Vercel Production when the PROD_* var is unset.
        envId = undefined
      }
      if (!envId) return
      let cents: number | null = null
      if (stripe) {
        const price = await stripe.prices.retrieve(envId).catch(() => null)
        // An archived env Price can't be sold — treat it as unconfigured.
        if (price && price.active === false) return
        cents = price?.unit_amount ?? null
      }
      out.set(key, { priceId: envId, cents, source: 'env' })
    }),
  )
  return out
}

/** The Price ID checkout should use for a variant, or undefined. */
export async function resolveSubscriptionPriceId(
  plan: SubscriptionPlanId,
  washValue: SubscriptionWashValue,
): Promise<string | undefined> {
  const resolved = await resolveSubscriptionPrices()
  return resolved.get(subscriptionVariantKey(plan, washValue))?.priceId
}

/**
 * Live plan pricing, read from Stripe so the page can never advertise a
 * number that differs from what the customer is charged. Any variant whose
 * price is unconfigured or unreachable falls back to the computed amount —
 * same degrade-don't-fail contract as getCheckoutPricing.
 */
export async function getSubscriptionPricing(): Promise<SubscriptionPricing> {
  if (!getStripe()) return fallbackSubscriptionPricing()
  try {
    const [resolved, listPrices] = await Promise.all([
      resolveSubscriptionPrices(),
      liveSingleTokenPrices(),
    ])
    const plans = SUBSCRIPTION_PLAN_IDS.map((id) => {
      const overrides: Partial<Record<SubscriptionWashValue, number>> = {}
      for (const w of SUBSCRIPTION_WASH_VALUES) {
        const cents = resolved.get(subscriptionVariantKey(id, w))?.cents
        if (cents != null) overrides[w] = cents
      }
      return buildPlan(id, overrides, listPrices)
    })
    return { plans }
  } catch {
    return fallbackSubscriptionPricing()
  }
}

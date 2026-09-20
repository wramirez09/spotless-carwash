import 'server-only'
import Stripe from 'stripe'
import { getStripeSecretKey, getSubscriptionPriceId } from './stripeEnv'

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

function buildVariant(
  plan: SubscriptionPlanId,
  washValue: SubscriptionWashValue,
  overrideCents?: number,
): SubscriptionVariant {
  const tokens = PLAN_TOKENS[plan]
  const price = overrideCents ?? subscriptionMonthlyCents(plan, washValue)
  const perToken = Math.round(price / tokens)
  return {
    washValue,
    price,
    perToken,
    listPerToken: WASH_LIST_CENTS[washValue],
    savePerToken: WASH_LIST_CENTS[washValue] - perToken,
  }
}

function buildPlan(
  id: SubscriptionPlanId,
  overrides?: Partial<Record<SubscriptionWashValue, number>>,
): SubscriptionPlan {
  return {
    id,
    name: PLAN_COPY[id].name,
    tokensPerCycle: PLAN_TOKENS[id],
    blurb: PLAN_COPY[id].blurb,
    featured: id === 'frequent',
    variants: SUBSCRIPTION_WASH_VALUES.map((w) =>
      buildVariant(id, w, overrides?.[w]),
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
 * Live plan pricing, read from the Stripe Price objects so the page can never
 * advertise a number that differs from what the customer is charged. Any
 * variant whose price is unconfigured or unreachable falls back to the computed
 * amount — same degrade-don't-fail contract as getCheckoutPricing.
 */
export async function getSubscriptionPricing(): Promise<SubscriptionPricing> {
  const stripe = getStripe()
  if (!stripe) return fallbackSubscriptionPricing()

  try {
    const plans = await Promise.all(
      SUBSCRIPTION_PLAN_IDS.map(async (id) => {
        const entries = await Promise.all(
          SUBSCRIPTION_WASH_VALUES.map(async (w) => {
            let priceId: string | undefined
            try {
              priceId = subscriptionPriceId(id, w)
            } catch {
              // Throws on Vercel Production when the PROD_* var is unset; the
              // computed fallback keeps the page rendering.
              return [w, undefined] as const
            }
            if (!priceId) return [w, undefined] as const
            const price = await stripe.prices.retrieve(priceId)
            return [w, price.unit_amount ?? undefined] as const
          }),
        )
        const overrides = Object.fromEntries(
          entries.filter(([, cents]) => cents != null),
        ) as Partial<Record<SubscriptionWashValue, number>>
        return buildPlan(id, overrides)
      }),
    )
    return { plans }
  } catch {
    return fallbackSubscriptionPricing()
  }
}

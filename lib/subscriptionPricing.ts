import 'server-only'
import Stripe from 'stripe'
import { getStripeSecretKey, getSubscriptionPriceId } from './stripeEnv'
import { loadSubscriptionCatalog } from './stripeCatalog'
import { subscriptionLookupKey } from './pricing/model'
import { getPricingSnapshot } from './pricingStore'

// Wash Token Subscription plans and pricing.
//
// Plans live in Stripe and are managed at /admin/pricing: a plan is a Stripe
// Product (name, description, tokens a month) and each token value it offers
// is a monthly Price keyed `spotless_sub_<plan>_<value>` — see
// lib/stripeCatalog.ts. The three plans from the original proposal (weekly /
// frequent / family, below) are only a fallback: each one is shown until a
// plan with its id exists in Stripe, live or deleted, so moving it into Stripe
// or deleting it from the admin both take effect.
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
  /** Whole-dollar token value, e.g. '12'. */
  washValue: string
  /** Monthly charge in cents. */
  price: number
  /** price / tokensPerCycle, cents. */
  perToken: number
  /** Undiscounted wash price, cents — for the "vs" figure on the card. */
  listPerToken: number
  /** listPerToken - perToken, cents. */
  savePerToken: number
  /** The recurring Price checkout uses; null when none exists (display only). */
  priceId: string | null
  /** 'stripe' — keyed Price; 'env' — deploy-config Price; 'computed' — no Price yet. */
  source: 'stripe' | 'env' | 'computed'
}

export type SubscriptionPlan = {
  /** Stable id (slug) — recorded on every subscription, never renamed. */
  id: string
  /** Customer-facing plan name from the proposal. */
  name: string
  tokensPerCycle: number
  blurb: string
  featured?: boolean
  sortOrder: number
  /** The plan's Stripe Product, or null for an original plan not yet in Stripe. */
  productId: string | null
  /** 'stripe' — managed in Stripe; 'legacy' — an original plan from code. */
  source: 'stripe' | 'legacy'
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
type ListPrices = Record<string, number>

function variantFrom(
  washValue: string,
  price: number,
  tokens: number,
  listPrices: ListPrices | undefined,
  priceId: string | null,
  source: SubscriptionVariant['source'],
): SubscriptionVariant {
  const perToken = Math.round(price / tokens)
  // What a subscriber is compared against: one token bought outright, at the
  // price Stripe charges for it today. The static table, then the face value,
  // only stand in when Stripe has no single token of that value.
  const list =
    listPrices?.[washValue] ??
    (WASH_LIST_CENTS as Record<string, number>)[washValue] ??
    Number(washValue) * 100
  return {
    washValue,
    price,
    perToken,
    listPerToken: list,
    savePerToken: list - perToken,
    priceId,
    source,
  }
}

function buildVariant(
  plan: SubscriptionPlanId,
  washValue: SubscriptionWashValue,
  overrideCents?: number,
  listPrices?: ListPrices,
): SubscriptionVariant {
  const price = overrideCents ?? subscriptionMonthlyCents(plan, washValue)
  return variantFrom(washValue, price, PLAN_TOKENS[plan], listPrices, null, 'computed')
}

const LEGACY_SORT: Record<SubscriptionPlanId, number> = { weekly: 10, frequent: 20, family: 30 }

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
    sortOrder: LEGACY_SORT[id],
    productId: null,
    source: 'legacy',
    variants: SUBSCRIPTION_WASH_VALUES.map((w) =>
      buildVariant(id, w, overrides?.[w], listPrices),
    ),
  }
}

/** The original proposal's plans at their computed prices — the offline fallback. */
export function fallbackSubscriptionPricing(): SubscriptionPricing {
  return { plans: SUBSCRIPTION_PLAN_IDS.map((id) => buildPlan(id)) }
}

/** Deploy-config Price ID for an original plan, or undefined when unset. */
export function subscriptionPriceId(
  id: SubscriptionPlanId,
  washValue: SubscriptionWashValue,
): string | undefined {
  return getSubscriptionPriceId(PLAN_ENV_KEY[id], washValue)
}

/** True for one of the three original plan ids. */
export function isSubscriptionPlanId(value: unknown): value is SubscriptionPlanId {
  return (
    typeof value === 'string' &&
    (SUBSCRIPTION_PLAN_IDS as readonly string[]).includes(value)
  )
}

/** True for one of the original four token values. */
export function isSubscriptionWashValue(
  value: unknown,
): value is SubscriptionWashValue {
  return (
    typeof value === 'string' &&
    (SUBSCRIPTION_WASH_VALUES as readonly string[]).includes(value)
  )
}

/** An original plan at its computed (proposal) prices. */
export function getSubscriptionPlan(id: SubscriptionPlanId): SubscriptionPlan {
  return buildPlan(id)
}

/** An original plan's variant at its computed (proposal) price. */
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
      if (s.kind === 'single' && s.cents != null) out[s.washValue] = s.cents
    }
    return out
  } catch {
    return {}
  }
}

const valueOrder = (a: SubscriptionVariant, b: SubscriptionVariant) =>
  Number(a.washValue) - Number(b.washValue)

export function sortPlans(plans: SubscriptionPlan[]): SubscriptionPlan[] {
  return [...plans].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.tokensPerCycle - b.tokensPerCycle,
  )
}

export type SubscriptionCatalog = {
  /** Every plan on offer, sorted for display. May include plans with no prices. */
  plans: SubscriptionPlan[]
  /** False when Stripe couldn't be asked and the original plans were used. */
  live: boolean
}

// Same reasoning as the pricing store's cache: the home page renders the plan
// cards on every request, so a short per-instance TTL spares Stripe two list
// calls per view. Admin writes call `invalidateSubscriptionCache()`, and
// checkout always reads fresh.
const CACHE_TTL_MS = 30_000
let cached: { at: number; catalog: SubscriptionCatalog } | null = null

export function invalidateSubscriptionCache(): void {
  cached = null
}

async function loadCatalog(): Promise<SubscriptionCatalog> {
  const stripe = getStripe()
  if (!stripe) return { plans: fallbackSubscriptionPricing().plans, live: false }

  const [catalog, listPrices] = await Promise.all([
    loadSubscriptionCatalog(stripe),
    liveSingleTokenPrices(),
  ])
  if (!catalog.ok) {
    return {
      plans: SUBSCRIPTION_PLAN_IDS.map((id) => buildPlan(id, undefined, listPrices)),
      live: false,
    }
  }

  const pricesFor = (planId: string) =>
    [...catalog.prices.values()].filter((p) => p.plan === planId)

  const plans: SubscriptionPlan[] = []
  for (const p of catalog.plans.values()) {
    if (!p.active) continue
    plans.push({
      id: p.id,
      name: p.name,
      tokensPerCycle: p.tokensPerCycle,
      blurb: p.blurb,
      featured: p.featured ?? false,
      sortOrder: p.sortOrder ?? 100,
      productId: p.productId,
      source: 'stripe',
      variants: pricesFor(p.id)
        .map((x) =>
          variantFrom(x.washValue, x.cents, p.tokensPerCycle, listPrices, x.priceId, 'stripe'),
        )
        .sort(valueOrder),
    })
  }

  // An original plan fills in only while Stripe has never heard of its id. A
  // deleted (archived) plan Product with that id keeps it gone.
  for (const id of SUBSCRIPTION_PLAN_IDS) {
    if (catalog.plans.has(id)) continue
    const base = buildPlan(id, undefined, listPrices)
    const variants = await Promise.all(
      SUBSCRIPTION_WASH_VALUES.map(async (w): Promise<SubscriptionVariant | null> => {
        const keyed = catalog.prices.get(subscriptionLookupKey(id, w))
        if (keyed) {
          return variantFrom(w, keyed.cents, base.tokensPerCycle, listPrices, keyed.priceId, 'stripe')
        }
        let envId: string | undefined
        try {
          envId = subscriptionPriceId(id, w)
        } catch {
          envId = undefined // throws on Vercel Production when PROD_* is unset
        }
        if (envId) {
          const price = await stripe.prices.retrieve(envId).catch(() => null)
          // An archived env Price can't be sold — treat it as removed.
          if (price && price.active === false) return null
          if (price?.unit_amount != null) {
            return variantFrom(w, price.unit_amount, base.tokensPerCycle, listPrices, envId, 'env')
          }
        }
        return base.variants.find((v) => v.washValue === w) ?? null
      }),
    )
    plans.push({ ...base, variants: variants.filter((v): v is SubscriptionVariant => v != null) })
  }

  // Exactly one "Most Popular": the first flagged plan in display order, or
  // none at all if the admin cleared it everywhere.
  const sorted = sortPlans(plans)
  let seen = false
  for (const plan of sorted) {
    if (plan.featured && !seen) seen = true
    else plan.featured = false
  }
  return { plans: sorted, live: true }
}

/** Every plan, for the admin page and checkout. `fresh` skips the cache. */
export async function getSubscriptionCatalog(
  { fresh = false }: { fresh?: boolean } = {},
): Promise<SubscriptionCatalog> {
  if (!fresh && cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.catalog
  const catalog = await loadCatalog()
  if (catalog.live) cached = { at: Date.now(), catalog }
  return catalog
}

/**
 * What customers are offered: plans with at least one token value. Never
 * throws — any failure degrades to the original plans at computed prices, the
 * same degrade-don't-fail contract as getCheckoutPricing.
 */
export async function getSubscriptionPricing(): Promise<SubscriptionPricing> {
  try {
    const { plans } = await getSubscriptionCatalog()
    return { plans: plans.filter((p) => p.variants.length > 0) }
  } catch {
    return fallbackSubscriptionPricing()
  }
}

/**
 * The plan and token value a checkout is for, read fresh from Stripe so a plan
 * deleted or repriced since the page rendered is never charged. Null when the
 * plan or the value isn't on offer.
 */
export async function findSubscriptionVariant(
  planId: string,
  washValue: string,
): Promise<{ plan: SubscriptionPlan; variant: SubscriptionVariant } | null> {
  const { plans } = await getSubscriptionCatalog({ fresh: true })
  const plan = plans.find((p) => p.id === planId)
  const variant = plan?.variants.find((v) => v.washValue === washValue)
  return plan && variant ? { plan, variant } : null
}

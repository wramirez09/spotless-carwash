import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_SUBSCRIPTION_WASH_VALUE,
  SUBSCRIPTION_PLAN_IDS,
  SUBSCRIPTION_WASH_VALUES,
  fallbackSubscriptionPricing,
  getSubscriptionPlan,
  getSubscriptionVariant,
  isSubscriptionPlanId,
  isSubscriptionWashValue,
  subscriptionMonthlyCents,
  type SubscriptionPlanId,
  type SubscriptionWashValue,
} from './subscriptionPricing'

// The $12 column is the contract with the client proposal (Section 3.1): the
// headline prices $40 / $76 / $108. If one of these fails, either the proposal
// changed or someone edited pricing by accident — both need a human decision,
// not a test update.
const PROPOSAL_AT_12 = { weekly: 4000, frequent: 7600, family: 10800 } as const

// Full variant matrix, in cents. Derived from a per-token discount off the list
// wash price ($2.00 / $2.50 / $3.00 by plan), which is what makes every cell a
// whole dollar while keeping the $12 column exactly on the proposal.
const MATRIX: Record<SubscriptionPlanId, Record<SubscriptionWashValue, number>> = {
  weekly: { '8': 2400, '9': 2800, '10': 3200, '12': 4000 },
  frequent: { '8': 4400, '9': 5200, '10': 6000, '12': 7600 },
  family: { '8': 6000, '9': 7200, '10': 8400, '12': 10800 },
}

describe('SUBSCRIPTION_PLAN_IDS / WASH_VALUES', () => {
  it('is exactly the three plans in the proposal', () => {
    expect([...SUBSCRIPTION_PLAN_IDS]).toEqual(['weekly', 'frequent', 'family'])
  })

  it('offers the same four denominations as the one-time store', () => {
    expect([...SUBSCRIPTION_WASH_VALUES]).toEqual(['8', '9', '10', '12'])
  })

  it('defaults to the $12 token the proposal is priced on', () => {
    expect(DEFAULT_SUBSCRIPTION_WASH_VALUE).toBe('12')
  })
})

describe('subscriptionMonthlyCents', () => {
  it('reproduces the proposal exactly at the $12 anchor', () => {
    for (const id of SUBSCRIPTION_PLAN_IDS) {
      expect(subscriptionMonthlyCents(id, '12')).toBe(PROPOSAL_AT_12[id])
    }
  })

  it('prices every plan/denomination cell as expected', () => {
    for (const id of SUBSCRIPTION_PLAN_IDS) {
      for (const w of SUBSCRIPTION_WASH_VALUES) {
        expect(subscriptionMonthlyCents(id, w)).toBe(MATRIX[id][w])
      }
    }
  })

  it('lands every cell on a whole dollar', () => {
    for (const id of SUBSCRIPTION_PLAN_IDS) {
      for (const w of SUBSCRIPTION_WASH_VALUES) {
        expect(subscriptionMonthlyCents(id, w) % 100).toBe(0)
      }
    }
  })

  it('gets cheaper per token as the plan gets bigger', () => {
    for (const w of SUBSCRIPTION_WASH_VALUES) {
      const weekly = getSubscriptionVariant('weekly', w).perToken
      const frequent = getSubscriptionVariant('frequent', w).perToken
      const family = getSubscriptionVariant('family', w).perToken
      expect(frequent).toBeLessThan(weekly)
      expect(family).toBeLessThan(frequent)
    }
  })

  it('always beats the equivalent one-time 4-pack (list less the $5 bundle)', () => {
    // A 4-pack lists at washValue x 4 and checks out $5 cheaper. A subscription
    // that does not beat that per token gives customers no reason to commit.
    for (const w of SUBSCRIPTION_WASH_VALUES) {
      const packPerToken = (Number(w) * 100 * 4 - 500) / 4
      for (const id of SUBSCRIPTION_PLAN_IDS) {
        expect(getSubscriptionVariant(id, w).perToken).toBeLessThan(packPerToken)
      }
    }
  })
})

describe('getSubscriptionVariant', () => {
  it('reports the list price and per-token saving', () => {
    const v = getSubscriptionVariant('weekly', '12')
    expect(v.price).toBe(4000)
    expect(v.perToken).toBe(1000)
    expect(v.listPerToken).toBe(1200)
    expect(v.savePerToken).toBe(200)
  })

  it('saves more per token on the bigger plans', () => {
    expect(getSubscriptionVariant('weekly', '12').savePerToken).toBe(200)
    expect(getSubscriptionVariant('frequent', '12').savePerToken).toBe(250)
    expect(getSubscriptionVariant('family', '12').savePerToken).toBe(300)
  })
})

describe('getSubscriptionPlan', () => {
  it('carries one variant per denomination', () => {
    for (const id of SUBSCRIPTION_PLAN_IDS) {
      const plan = getSubscriptionPlan(id)
      expect(plan.variants.map((v) => v.washValue)).toEqual(['8', '9', '10', '12'])
    }
  })

  it('keeps the token count fixed across denominations', () => {
    // Changing the wash tier changes the price, never how many tokens ship.
    const plan = getSubscriptionPlan('family')
    expect(plan.tokensPerCycle).toBe(12)
    for (const v of plan.variants) {
      expect(Math.round(v.price / v.perToken)).toBe(12)
    }
  })

  it('features exactly one plan, the middle tier', () => {
    const featured = SUBSCRIPTION_PLAN_IDS.filter((id) => getSubscriptionPlan(id).featured)
    expect(featured).toEqual(['frequent'])
  })
})

describe('validators', () => {
  it('accepts real plan ids and rejects anything else', () => {
    expect(isSubscriptionPlanId('weekly')).toBe(true)
    expect(isSubscriptionPlanId('gold')).toBe(false)
    expect(isSubscriptionPlanId(undefined)).toBe(false)
    expect(isSubscriptionPlanId(4)).toBe(false)
  })

  it('accepts real denominations and rejects anything else', () => {
    expect(isSubscriptionWashValue('12')).toBe(true)
    expect(isSubscriptionWashValue('8')).toBe(true)
    // Numbers must not slip through — metadata is stored as strings.
    expect(isSubscriptionWashValue(12)).toBe(false)
    expect(isSubscriptionWashValue('11')).toBe(false)
    expect(isSubscriptionWashValue('')).toBe(false)
  })
})

describe('fallbackSubscriptionPricing', () => {
  it('returns the full matrix when Stripe is unreachable', () => {
    const { plans } = fallbackSubscriptionPricing()
    expect(plans.map((p) => p.id)).toEqual(['weekly', 'frequent', 'family'])
    for (const plan of plans) {
      for (const v of plan.variants) {
        expect(v.price).toBe(
          MATRIX[plan.id as SubscriptionPlanId][v.washValue as SubscriptionWashValue],
        )
      }
    }
  })
})

describe('getSubscriptionPricing', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('falls back to computed pricing when Stripe has no secret key', async () => {
    vi.stubEnv('DEV_STRIPE_SECRET_KEY', '')
    vi.stubEnv('PROD_STRIPE_SECRET_KEY', '')
    const mod = await import('./subscriptionPricing')
    const pricing = await mod.getSubscriptionPricing()
    expect(pricing.plans[0].variants.map((v) => v.price)).toEqual([
      2400, 2800, 3200, 4000,
    ])
  })
})

describe('subscription catalog — plans managed in Stripe', () => {
  type Product = Record<string, unknown>
  type Price = Record<string, unknown>
  const world = { products: [] as Product[], prices: [] as Price[], retrieve: {} as Record<string, Price> }

  const planProduct = (id: string, over: Record<string, unknown> = {}, meta: Record<string, string> = {}) => ({
    id: `prod_${id}`,
    active: true,
    name: id[0].toUpperCase() + id.slice(1),
    description: `${id} blurb`,
    metadata: { spotless_sub_plan: id, tokens_per_cycle: '6', ...meta },
    ...over,
  })
  const monthly = (plan: string, wash: string, cents: number) => ({
    id: `price_${plan}_${wash}`,
    lookup_key: `spotless_sub_${plan}_${wash}`,
    unit_amount: cents,
    product: `prod_${plan}`,
    recurring: { interval: 'month', interval_count: 1 },
  })

  async function load(singles: { washValue: string; cents: number }[] = []) {
    vi.resetModules()
    vi.stubEnv('DEV_STRIPE_SECRET_KEY', 'sk_test_fake')
    vi.doMock('stripe', () => ({
      default: class {
        products = { list: async () => ({ data: world.products }) }
        prices = {
          list: async () => ({ data: world.prices }),
          retrieve: async (id: string) => world.retrieve[id] ?? null,
        }
      },
    }))
    vi.doMock('./pricingStore', () => ({
      getPricingSnapshot: async () => ({
        catalog: singles.map((x) => ({ kind: 'single', washValue: x.washValue, cents: x.cents })),
      }),
    }))
    return import('./subscriptionPricing')
  }

  beforeEach(() => {
    vi.unstubAllEnvs()
    world.products = []
    world.prices = []
    world.retrieve = {}
  })

  it('lists a plan created in Stripe, with only the token values it offers', async () => {
    world.products = [planProduct('commuter', {}, { featured: 'true', sort_order: '1' })]
    world.prices = [monthly('commuter', '10', 5000), monthly('commuter', '15', 7200)]
    const mod = await load()

    const { plans } = await mod.getSubscriptionPricing()
    const commuter = plans.find((p) => p.id === 'commuter')!

    expect(commuter).toMatchObject({
      name: 'Commuter',
      blurb: 'commuter blurb',
      tokensPerCycle: 6,
      featured: true,
      source: 'stripe',
      productId: 'prod_commuter',
    })
    expect(commuter.variants.map((v) => [v.washValue, v.price, v.priceId])).toEqual([
      ['10', 5000, 'price_commuter_10'],
      ['15', 7200, 'price_commuter_15'],
    ])
    // Sorted first, and the only Most Popular — the original default yields.
    expect(plans[0].id).toBe('commuter')
    expect(plans.filter((p) => p.featured).map((p) => p.id)).toEqual(['commuter'])
  })

  it('keeps showing the original plans until they exist in Stripe', async () => {
    const mod = await load()
    const { plans } = await mod.getSubscriptionCatalog({ fresh: true })
    expect(plans.map((p) => [p.id, p.source])).toEqual([
      ['weekly', 'legacy'],
      ['frequent', 'legacy'],
      ['family', 'legacy'],
    ])
    // No Price anywhere: shown at the computed amount, but not purchasable.
    expect(plans[0].variants.every((v) => v.priceId === null && v.source === 'computed')).toBe(true)
  })

  it('drops an original plan that was deleted in the admin', async () => {
    world.products = [planProduct('weekly', { active: false })]
    const mod = await load()
    const ids = (await mod.getSubscriptionPricing()).plans.map((p) => p.id)
    expect(ids).toEqual(['frequent', 'family'])
  })

  it('uses the Stripe copy of an original plan once it has been moved there', async () => {
    world.products = [planProduct('weekly', { name: 'Weekly Plus' }, { tokens_per_cycle: '5' })]
    world.prices = [monthly('weekly', '12', 4500)]
    const mod = await load()
    const weekly = (await mod.getSubscriptionPricing()).plans.find((p) => p.id === 'weekly')!
    expect(weekly).toMatchObject({ name: 'Weekly Plus', tokensPerCycle: 5, source: 'stripe' })
    expect(weekly.variants.map((v) => v.washValue)).toEqual(['12'])
  })

  it('prices an original plan from a keyed Price before the computed amount', async () => {
    world.prices = [monthly('weekly', '12', 4200)]
    const mod = await load([{ washValue: '12', cents: 1300 }])
    const weekly = (await mod.getSubscriptionPricing()).plans.find((p) => p.id === 'weekly')!
    const at12 = weekly.variants.find((v) => v.washValue === '12')!
    expect(at12).toMatchObject({ price: 4200, priceId: 'price_weekly_12', source: 'stripe' })
    // The "vs" figure is today's single-token price from Stripe.
    expect(at12.listPerToken).toBe(1300)
    expect(at12.savePerToken).toBe(1300 - 1050)
  })

  it('hides a plan with no token values from customers but not from the admin', async () => {
    world.products = [planProduct('empty')]
    const mod = await load()
    expect((await mod.getSubscriptionPricing()).plans.some((p) => p.id === 'empty')).toBe(false)
    expect((await mod.getSubscriptionCatalog({ fresh: true })).plans.some((p) => p.id === 'empty')).toBe(true)
  })

  it('finds the plan and token value a checkout asks for, and nothing else', async () => {
    world.products = [planProduct('commuter')]
    world.prices = [monthly('commuter', '10', 5000)]
    const mod = await load()
    expect((await mod.findSubscriptionVariant('commuter', '10'))?.variant.priceId).toBe('price_commuter_10')
    expect(await mod.findSubscriptionVariant('commuter', '12')).toBeNull()
    expect(await mod.findSubscriptionVariant('nope', '10')).toBeNull()
  })
})

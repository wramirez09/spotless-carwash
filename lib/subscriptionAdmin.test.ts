// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Subscription plan CRUD against a faked Stripe. The catalog read
// (lib/subscriptionPricing) is stubbed with a plain list the tests control, so
// each test states exactly which plans exist before the write.

const h = vi.hoisted(() => ({
  productsCreate: vi.fn(),
  productsUpdate: vi.fn(),
  productsSearch: vi.fn(),
  pricesCreate: vi.fn(),
  pricesUpdate: vi.fn(),
  archiveIfOurs: vi.fn(),
  audit: vi.fn(),
  getSubscriptionCatalog: vi.fn(),
  invalidateSubscriptionCache: vi.fn(),
  stripeOn: { value: true },
}))

vi.mock('./pricingAdmin', () => ({
  getStripe: () =>
    h.stripeOn.value
      ? {
          products: { create: h.productsCreate, update: h.productsUpdate, search: h.productsSearch },
          prices: { create: h.pricesCreate, update: h.pricesUpdate },
        }
      : null,
  archiveIfOurs: h.archiveIfOurs,
  audit: h.audit,
  stripeMessage: (e: unknown) => (e instanceof Error ? e.message : 'Unknown error'),
}))
vi.mock('./subscriptionPricing', () => ({
  getSubscriptionCatalog: h.getSubscriptionCatalog,
  invalidateSubscriptionCache: h.invalidateSubscriptionCache,
}))

import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  removeSubscriptionPlanPrice,
  setSubscriptionPlanPrice,
  updateSubscriptionPlan,
} from './subscriptionAdmin'

type Variant = { washValue: string; price: number; priceId: string | null; source: string }

function plan(id: string, over: Record<string, unknown> = {}) {
  return {
    id,
    name: id[0].toUpperCase() + id.slice(1),
    tokensPerCycle: 4,
    blurb: '',
    featured: false,
    sortOrder: 10,
    productId: `prod_${id}`,
    source: 'stripe',
    variants: [] as Variant[],
    ...over,
  }
}
const v = (washValue: string, price: number, priceId: string | null = `price_${washValue}`, source = 'stripe'): Variant => ({
  washValue,
  price,
  priceId,
  source,
})

function catalog(...plans: ReturnType<typeof plan>[]) {
  h.getSubscriptionCatalog.mockResolvedValue({ plans, live: true })
}

beforeEach(() => {
  vi.clearAllMocks()
  h.stripeOn.value = true
  h.productsCreate.mockResolvedValue({ id: 'prod_new' })
  h.productsUpdate.mockImplementation(async (id: string) => ({ id }))
  h.productsSearch.mockResolvedValue({ data: [] })
  h.pricesCreate.mockResolvedValue({ id: 'price_new' })
  h.pricesUpdate.mockResolvedValue({})
  catalog()
})

describe('createSubscriptionPlan', () => {
  const input = {
    name: 'Commuter Club',
    tokensPerCycle: 6,
    blurb: 'Six washes a month.',
    featured: false,
    washValue: '10',
    unitAmountCents: 5000,
    actorEmail: 'will@example.com',
  }

  it('creates the plan Product and its first monthly Price', async () => {
    const result = await createSubscriptionPlan(input)

    expect(result).toMatchObject({ ok: true, data: { id: 'commuter-club' } })
    expect(h.productsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Commuter Club',
        description: 'Six washes a month.',
        metadata: expect.objectContaining({
          spotless_sub_plan: 'commuter-club',
          tokens_per_cycle: '6',
          featured: 'false',
        }),
      }),
    )
    expect(h.pricesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        product: 'prod_new',
        unit_amount: 5000,
        recurring: { interval: 'month' },
        lookup_key: 'spotless_sub_commuter-club_10',
        transfer_lookup_key: true,
      }),
    )
    expect(h.invalidateSubscriptionCache).toHaveBeenCalled()
  })

  it('sorts a new plan after the existing ones', async () => {
    catalog(plan('weekly', { sortOrder: 10 }), plan('family', { sortOrder: 30 }))
    await createSubscriptionPlan(input)
    expect(h.productsCreate.mock.calls[0][0].metadata.sort_order).toBe('40')
  })

  it('refuses a name that collides with an existing plan id', async () => {
    catalog(plan('weekly', { source: 'legacy', productId: null }))
    const result = await createSubscriptionPlan({ ...input, name: 'Weekly' })
    expect(result.ok).toBe(false)
    expect(h.productsCreate).not.toHaveBeenCalled()
  })

  it('revives a deleted plan Product with the same id', async () => {
    h.productsSearch.mockResolvedValue({ data: [{ id: 'prod_old' }] })
    await createSubscriptionPlan(input)
    expect(h.productsCreate).not.toHaveBeenCalled()
    expect(h.productsUpdate).toHaveBeenCalledWith(
      'prod_old',
      expect.objectContaining({ active: true, name: 'Commuter Club' }),
    )
    expect(h.pricesCreate).toHaveBeenCalledWith(expect.objectContaining({ product: 'prod_old' }))
  })

  it('takes Most Popular away from the plan that had it', async () => {
    catalog(plan('frequent', { featured: true }))
    await createSubscriptionPlan({ ...input, featured: true })
    expect(h.productsUpdate).toHaveBeenCalledWith('prod_frequent', {
      metadata: { featured: 'false' },
    })
  })

  it('validates before touching Stripe', async () => {
    for (const bad of [
      { name: '  ' },
      { name: 'x'.repeat(41) },
      { tokensPerCycle: 0 },
      { tokensPerCycle: 51 },
      { washValue: '0' },
      { washValue: '12.5' },
      { unitAmountCents: 0 },
      { name: '!!!' }, // no usable id
    ]) {
      expect((await createSubscriptionPlan({ ...input, ...bad })).ok).toBe(false)
    }
    expect(h.productsCreate).not.toHaveBeenCalled()
  })

  it('creates nothing when Stripe could not be listed', async () => {
    h.getSubscriptionCatalog.mockResolvedValue({ plans: [], live: false })
    expect((await createSubscriptionPlan(input)).ok).toBe(false)
    expect(h.productsCreate).not.toHaveBeenCalled()
  })

  it('reports and audits a Stripe rejection', async () => {
    h.pricesCreate.mockRejectedValue(new Error('Invalid amount'))
    const result = await createSubscriptionPlan(input)
    expect(result.ok).toBe(false)
    expect(result.message).toContain('Invalid amount')
    expect(h.audit).toHaveBeenCalledWith(
      'will@example.com',
      'plan.create',
      expect.objectContaining({ error: 'Invalid amount' }),
      false,
    )
  })

  it('fails closed without Stripe', async () => {
    h.stripeOn.value = false
    expect((await createSubscriptionPlan(input)).ok).toBe(false)
  })
})

describe('updateSubscriptionPlan', () => {
  const input = {
    id: 'commuter',
    name: 'Commuter+',
    tokensPerCycle: 8,
    blurb: 'More washes.',
    featured: false,
    actorEmail: null,
  }

  it('updates the Product name, description and token count in place', async () => {
    catalog(plan('commuter', { sortOrder: 15 }))
    const result = await updateSubscriptionPlan(input)
    expect(result.ok).toBe(true)
    expect(h.productsUpdate).toHaveBeenCalledWith('prod_commuter', {
      name: 'Commuter+',
      description: 'More washes.',
      metadata: expect.objectContaining({
        spotless_sub_plan: 'commuter', // the id never changes
        tokens_per_cycle: '8',
        sort_order: '15',
      }),
    })
    expect(result.message).toMatch(/Existing subscribers are not affected/)
    expect(h.pricesCreate).not.toHaveBeenCalled()
  })

  it('moves an original plan into Stripe, carrying its real prices across', async () => {
    catalog(
      plan('weekly', {
        source: 'legacy',
        productId: null,
        featured: false,
        variants: [v('12', 4000, 'price_env_12', 'env'), v('8', 2400, null, 'computed')],
      }),
    )

    const result = await updateSubscriptionPlan({ ...input, id: 'weekly', name: 'Weekly' })

    expect(result.ok).toBe(true)
    expect(h.productsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ spotless_sub_plan: 'weekly' }) }),
    )
    // Only the value that had a real Price is re-created; the computed one
    // was never purchasable.
    expect(h.pricesCreate).toHaveBeenCalledTimes(1)
    expect(h.pricesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        product: 'prod_new',
        unit_amount: 4000,
        lookup_key: 'spotless_sub_weekly_12',
      }),
    )
    expect(h.archiveIfOurs).toHaveBeenCalledWith(expect.anything(), 'price_env_12', 'price_new')
    expect(h.productsUpdate).toHaveBeenCalledWith('prod_new', expect.objectContaining({ name: 'Weekly' }))
  })

  it('reports a plan that no longer exists', async () => {
    expect((await updateSubscriptionPlan(input)).message).toMatch(/no longer exists/)
  })
})

describe('setSubscriptionPlanPrice', () => {
  it('adds a new token value to a plan', async () => {
    catalog(plan('commuter', { variants: [v('10', 5000)] }))
    const result = await setSubscriptionPlanPrice({
      planId: 'commuter',
      washValue: '15',
      unitAmountCents: 7200,
      actorEmail: null,
    })
    expect(result.ok).toBe(true)
    expect(h.pricesCreate).toHaveBeenCalledWith(
      expect.objectContaining({ product: 'prod_commuter', lookup_key: 'spotless_sub_commuter_15' }),
    )
    expect(h.archiveIfOurs).not.toHaveBeenCalled()
  })

  it('reprices an existing value and archives the Price it replaced', async () => {
    catalog(plan('commuter', { variants: [v('10', 5000)] }))
    await setSubscriptionPlanPrice({ planId: 'commuter', washValue: '10', unitAmountCents: 5200, actorEmail: null })
    expect(h.archiveIfOurs).toHaveBeenCalledWith(expect.anything(), 'price_10', 'price_new')
  })

  it('rejects a no-op', async () => {
    catalog(plan('commuter', { variants: [v('10', 5000)] }))
    const result = await setSubscriptionPlanPrice({
      planId: 'commuter',
      washValue: '10',
      unitAmountCents: 5000,
      actorEmail: null,
    })
    expect(result.ok).toBe(false)
    expect(h.pricesCreate).not.toHaveBeenCalled()
  })

  it('makes a computed-only value purchasable at its shown amount', async () => {
    catalog(plan('weekly', { source: 'legacy', productId: null, variants: [v('8', 2400, null, 'computed')] }))
    const result = await setSubscriptionPlanPrice({ planId: 'weekly', washValue: '8', unitAmountCents: 2400, actorEmail: null })
    expect(result.ok).toBe(true)
  })

  it('validates the value and amount', async () => {
    catalog(plan('commuter'))
    expect((await setSubscriptionPlanPrice({ planId: 'commuter', washValue: 'x', unitAmountCents: 100, actorEmail: null })).ok).toBe(false)
    expect((await setSubscriptionPlanPrice({ planId: 'commuter', washValue: '10', unitAmountCents: 99_999, actorEmail: null })).ok).toBe(false)
    expect(h.pricesCreate).not.toHaveBeenCalled()
  })
})

describe('removeSubscriptionPlanPrice', () => {
  it('archives the Price for that value', async () => {
    catalog(plan('commuter', { variants: [v('10', 5000), v('15', 7200)] }))
    const result = await removeSubscriptionPlanPrice('commuter', '15', null)
    expect(result.ok).toBe(true)
    expect(h.pricesUpdate).toHaveBeenCalledWith('price_15', { active: false })
  })

  it('refuses a value the plan does not offer', async () => {
    catalog(plan('commuter', { variants: [v('10', 5000)] }))
    expect((await removeSubscriptionPlanPrice('commuter', '12', null)).ok).toBe(false)
    expect(h.pricesUpdate).not.toHaveBeenCalled()
  })
})

describe('deleteSubscriptionPlan', () => {
  it('archives the plan Product and its Prices', async () => {
    catalog(plan('commuter', { variants: [v('10', 5000), v('15', 7200)] }))
    const result = await deleteSubscriptionPlan('commuter', null)
    expect(result.ok).toBe(true)
    expect(h.pricesUpdate).toHaveBeenCalledWith('price_10', { active: false })
    expect(h.pricesUpdate).toHaveBeenCalledWith('price_15', { active: false })
    expect(h.productsUpdate).toHaveBeenCalledWith('prod_commuter', { active: false })
    expect(result.message).toMatch(/Current subscribers keep their plan/)
  })

  it('retires an original plan with an archived marker Product, leaving env Prices alone', async () => {
    catalog(plan('family', { source: 'legacy', productId: null, variants: [v('12', 10800, 'price_env', 'env')] }))
    const result = await deleteSubscriptionPlan('family', null)
    expect(result.ok).toBe(true)
    expect(h.pricesUpdate).not.toHaveBeenCalled()
    expect(h.productsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        active: false,
        metadata: expect.objectContaining({ spotless_sub_plan: 'family' }),
      }),
    )
  })

  it('reports a Stripe failure instead of claiming success', async () => {
    catalog(plan('commuter'))
    h.productsUpdate.mockRejectedValue(new Error('nope'))
    const result = await deleteSubscriptionPlan('commuter', null)
    expect(result.ok).toBe(false)
    expect(h.invalidateSubscriptionCache).not.toHaveBeenCalled()
  })
})

// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'
import { adoptSku, loadStripeCatalog, loadSubscriptionCatalog } from './stripeCatalog'
import { parseSkuLookupKey, parseSubscriptionLookupKey, skuLookupKey, subscriptionLookupKey } from './pricing/model'

// This module is what makes Stripe authoritative: it decides which SKUs are
// for sale and which Price each one charges. Every "unpriced" branch below is
// a case where guessing would silently change what a customer pays, so they
// are asserted explicitly rather than left to the fallback.

const productsList = vi.fn()
const productsUpdate = vi.fn()
const pricesList = vi.fn()

const stripe = {
  products: { list: productsList, update: productsUpdate },
  prices: { list: pricesList },
} as unknown as Stripe

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prod_pack_12',
    active: true,
    metadata: { lookup_key: skuLookupKey('pack', '12') },
    default_price: {
      id: 'price_live_12',
      active: true,
      unit_amount: 4800,
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  productsUpdate.mockResolvedValue({})
})

describe('loadStripeCatalog', () => {
  it('resolves a SKU from its Product default_price', async () => {
    productsList.mockResolvedValue({ data: [product()] })

    const catalog = await loadStripeCatalog(stripe)

    expect(catalog.ok).toBe(true)
    expect(catalog.skus.get('spotless_pack_12')).toEqual({
      sku: 'spotless_pack_12',
      kind: 'pack',
      washValue: '12',
      tokens: 4,
      productId: 'prod_pack_12',
      active: true,
      stripePriceId: 'price_live_12',
      cents: 4800,
      featured: true, // the $12 4-pack is Most Popular unless told otherwise
      sortOrder: 100,
    })
  })

  it('fetches the catalog in a single API call, archived Products included', async () => {
    // This runs for the pack cards and every checkout — a round-trip per SKU
    // would be felt. Archived Products must be listed too: they are how a
    // deleted SKU is told apart from one that was never set up.
    productsList.mockResolvedValue({ data: [product()] })
    await loadStripeCatalog(stripe)

    expect(productsList).toHaveBeenCalledTimes(1)
    const args = productsList.mock.calls[0][0]
    expect(args).toMatchObject({ expand: ['data.default_price'] })
    expect(args.active).toBeUndefined()
  })

  it('follows pagination rather than silently truncating', async () => {
    productsList
      .mockResolvedValueOnce({ data: [product()], has_more: true })
      .mockResolvedValueOnce({
        data: [
          product({
            id: 'prod_single_8',
            metadata: { lookup_key: skuLookupKey('single', '8') },
            default_price: { id: 'price_s8', active: true, unit_amount: 800 },
          }),
        ],
        has_more: false,
      })

    const catalog = await loadStripeCatalog(stripe)
    expect(catalog.skus.size).toBe(2)
    expect(productsList.mock.calls[1][0].starting_after).toBe('prod_pack_12')
  })

  it('lists admin-created pack sizes and denominations', async () => {
    productsList.mockResolvedValue({
      data: [
        product({
          id: 'prod_15_x10',
          metadata: { lookup_key: 'spotless_pack_15_x10', featured: 'true', sort_order: '5' },
          default_price: { id: 'price_15_x10', active: true, unit_amount: 13500 },
        }),
      ],
    })

    const sku = (await loadStripeCatalog(stripe)).skus.get('spotless_pack_15_x10')
    expect(sku).toMatchObject({
      kind: 'pack',
      washValue: '15',
      tokens: 10,
      cents: 13500,
      featured: true,
      sortOrder: 5,
    })
  })

  it('honors an explicit featured=false over the default', async () => {
    productsList.mockResolvedValue({
      data: [product({ metadata: { lookup_key: 'spotless_pack_12', featured: 'false' } })],
    })
    expect((await loadStripeCatalog(stripe)).skus.get('spotless_pack_12')?.featured).toBe(false)
  })

  it('reports an archived Product as inactive rather than dropping it', async () => {
    productsList.mockResolvedValue({ data: [product({ active: false })] })
    const sku = (await loadStripeCatalog(stripe)).skus.get('spotless_pack_12')
    expect(sku?.active).toBe(false)
  })

  it('prefers a live Product over an archived duplicate claiming the same key', async () => {
    productsList.mockResolvedValue({
      data: [
        product({ id: 'prod_live' }),
        product({ id: 'prod_dead', active: false }),
      ],
    })
    const sku = (await loadStripeCatalog(stripe)).skus.get('spotless_pack_12')
    expect(sku?.productId).toBe('prod_live')
    expect(sku?.active).toBe(true)
  })

  it('ignores Products with no lookup key', async () => {
    // The account holds unrelated Products (subscription plans, one-offs).
    productsList.mockResolvedValue({ data: [product({ metadata: {} })] })
    expect((await loadStripeCatalog(stripe)).skus.size).toBe(0)
  })

  it('ignores a lookup key that is not a token SKU', async () => {
    productsList.mockResolvedValue({
      data: [
        product({ metadata: { lookup_key: 'spotless_sub_weekly_12' } }),
        product({ metadata: { lookup_key: 'spotless_pack_twelve' } }),
      ],
    })
    expect((await loadStripeCatalog(stripe)).skus.size).toBe(0)
  })

  it('reports a Product with no default_price as unpriced rather than guessing', async () => {
    // Not yet adopted. Picking one of its Prices could charge the wrong amount.
    productsList.mockResolvedValue({ data: [product({ default_price: null })] })
    const sku = (await loadStripeCatalog(stripe)).skus.get('spotless_pack_12')
    expect(sku?.stripePriceId).toBeNull()
    expect(sku?.cents).toBeNull()
  })

  it('treats an unexpanded default_price as unpriced', async () => {
    // A bare ID carries no unit_amount, so there is nothing to report.
    productsList.mockResolvedValue({ data: [product({ default_price: 'price_live_12' })] })
    expect((await loadStripeCatalog(stripe)).skus.get('spotless_pack_12')?.stripePriceId).toBeNull()
  })

  it('treats an ARCHIVED default_price as unpriced', async () => {
    // Stripe: `active` is "whether the price can be used for new purchases".
    // Handing an archived Price to Checkout fails the session outright.
    productsList.mockResolvedValue({
      data: [product({ default_price: { id: 'price_old', active: false, unit_amount: 4800 } })],
    })
    expect((await loadStripeCatalog(stripe)).skus.get('spotless_pack_12')?.stripePriceId).toBeNull()
  })

  it('treats a default_price with no unit_amount as unpriced', async () => {
    // e.g. a custom_unit_amount ("pay what you want") Price.
    productsList.mockResolvedValue({
      data: [product({ default_price: { id: 'price_x', active: true, unit_amount: null } })],
    })
    expect((await loadStripeCatalog(stripe)).skus.get('spotless_pack_12')?.cents).toBeNull()
  })

  it('reports ok=false when Stripe throws', async () => {
    // Callers read this as "Stripe could not answer" and fall back, rather
    // than as "nothing is for sale".
    productsList.mockRejectedValue(new Error('network down'))
    const catalog = await loadStripeCatalog(stripe)
    expect(catalog.ok).toBe(false)
    expect(catalog.skus.size).toBe(0)
  })
})

describe('adoptSku', () => {
  it('points default_price at the Price, stamps the lookup key, and un-archives', async () => {
    await adoptSku(stripe, {
      productId: 'prod_1',
      priceId: 'price_1',
      kind: 'pack',
      washValue: '10',
    })

    expect(productsUpdate).toHaveBeenCalledWith('prod_1', {
      active: true,
      default_price: 'price_1',
      metadata: {
        lookup_key: 'spotless_pack_10',
        sku_kind: 'pack',
        wash_value: '10',
        token_count: '4',
      },
    })
  })

  it('keys a custom pack size with its token count', async () => {
    await adoptSku(stripe, {
      productId: 'prod_1',
      priceId: 'price_1',
      kind: 'pack',
      washValue: '12',
      tokens: 10,
    })
    expect(productsUpdate.mock.calls[0][1].metadata).toMatchObject({
      lookup_key: 'spotless_pack_12_x10',
      token_count: '10',
    })
  })

  it('is idempotent — safe to call on every price change', async () => {
    const args = {
      productId: 'prod_1',
      priceId: 'price_1',
      kind: 'single' as const,
      washValue: '9',
    }
    await adoptSku(stripe, args)
    await adoptSku(stripe, args)

    expect(productsUpdate).toHaveBeenCalledTimes(2)
    expect(productsUpdate.mock.calls[0]).toEqual(productsUpdate.mock.calls[1])
  })

  it('propagates a Stripe failure so the caller can report it', async () => {
    productsUpdate.mockRejectedValue(new Error('permission denied'))
    await expect(
      adoptSku(stripe, { productId: 'p', priceId: 'pr', kind: 'pack', washValue: '8' }),
    ).rejects.toThrow('permission denied')
  })
})

describe('loadSubscriptionCatalog', () => {
  function planProduct(id: string, over: Record<string, unknown> = {}) {
    return {
      id: `prod_${id}`,
      active: true,
      name: `${id} plan`,
      description: `About ${id}`,
      metadata: { spotless_sub_plan: id, tokens_per_cycle: '4', featured: 'true', sort_order: '5' },
      ...over,
    }
  }
  function monthly(key: string, cents: number, over: Record<string, unknown> = {}) {
    return {
      id: `price_${key}`,
      lookup_key: key,
      unit_amount: cents,
      product: 'prod_x',
      recurring: { interval: 'month', interval_count: 1 },
      ...over,
    }
  }

  it('reads plans from Products and their values from keyed monthly Prices', async () => {
    productsList.mockResolvedValue({ data: [planProduct('commuter')] })
    pricesList.mockResolvedValue({ data: [monthly('spotless_sub_commuter_12', 4400)] })

    const cat = await loadSubscriptionCatalog(stripe)

    expect(cat.ok).toBe(true)
    expect(cat.plans.get('commuter')).toEqual({
      id: 'commuter',
      productId: 'prod_commuter',
      active: true,
      name: 'commuter plan',
      blurb: 'About commuter',
      tokensPerCycle: 4,
      featured: true,
      sortOrder: 5,
    })
    expect(cat.prices.get('spotless_sub_commuter_12')).toMatchObject({
      plan: 'commuter',
      washValue: '12',
      cents: 4400,
      priceId: 'price_spotless_sub_commuter_12',
    })
    // Only active, recurring Prices are listed.
    expect(pricesList.mock.calls[0][0]).toMatchObject({ active: true, type: 'recurring' })
  })

  it('keeps a deleted plan as inactive so it is not revived from code', async () => {
    productsList.mockResolvedValue({ data: [planProduct('weekly', { active: false })] })
    pricesList.mockResolvedValue({ data: [] })
    expect((await loadSubscriptionCatalog(stripe)).plans.get('weekly')?.active).toBe(false)
  })

  it('prefers a live plan over an archived duplicate', async () => {
    productsList.mockResolvedValue({
      data: [planProduct('weekly'), planProduct('weekly', { id: 'prod_old', active: false })],
    })
    pricesList.mockResolvedValue({ data: [] })
    expect((await loadSubscriptionCatalog(stripe)).plans.get('weekly')?.productId).toBe('prod_weekly')
  })

  it('ignores unrelated Products and malformed plan metadata', async () => {
    productsList.mockResolvedValue({
      data: [
        { id: 'prod_pack', active: true, name: 'Pack', metadata: { lookup_key: 'spotless_pack_12' } },
        planProduct('Bad Id'),
        planProduct('notokens', { metadata: { spotless_sub_plan: 'notokens' } }),
      ],
    })
    pricesList.mockResolvedValue({ data: [] })
    expect((await loadSubscriptionCatalog(stripe)).plans.size).toBe(0)
  })

  it('ignores Prices that would bill something other than plain monthly', async () => {
    productsList.mockResolvedValue({ data: [] })
    pricesList.mockResolvedValue({
      data: [
        monthly('spotless_sub_weekly_12', 4000, { recurring: { interval: 'year', interval_count: 1 } }),
        monthly('spotless_sub_weekly_10', 3200, { recurring: { interval: 'month', interval_count: 3 } }),
        monthly('spotless_sub_weekly_9', 2800, { unit_amount: null }),
        monthly('some_other_key', 100),
        monthly('spotless_sub_weekly_8', 2400),
      ],
    })
    const cat = await loadSubscriptionCatalog(stripe)
    expect([...cat.prices.keys()]).toEqual(['spotless_sub_weekly_8'])
  })

  it('reports ok=false when Stripe cannot answer', async () => {
    productsList.mockRejectedValue(new Error('down'))
    pricesList.mockResolvedValue({ data: [] })
    const cat = await loadSubscriptionCatalog(stripe)
    expect(cat.ok).toBe(false)
  })
})

describe('subscriptionLookupKey / parseSubscriptionLookupKey', () => {
  it('round-trips plan ids with hyphens', () => {
    expect(parseSubscriptionLookupKey(subscriptionLookupKey('family-fleet', '12'))).toEqual({
      plan: 'family-fleet',
      washValue: '12',
    })
  })

  it('rejects keys it never writes', () => {
    for (const bad of ['spotless_sub_weekly', 'spotless_sub_Weekly_12', 'spotless_sub_weekly_012', 'spotless_pack_12', null]) {
      expect(parseSubscriptionLookupKey(bad)).toBeNull()
    }
  })
})

describe('skuLookupKey / parseSkuLookupKey', () => {
  it('keeps pack and single namespaces distinct', () => {
    expect(skuLookupKey('pack', '8')).not.toBe(skuLookupKey('single', '8'))
  })

  it('pins the lookup-key format — it matches Products already in Stripe', () => {
    expect(skuLookupKey('pack', '12')).toBe('spotless_pack_12')
    expect(skuLookupKey('pack', '12', 4)).toBe('spotless_pack_12')
    expect(skuLookupKey('single', '8')).toBe('spotless_single_8')
  })

  it('suffixes any other pack size with its token count', () => {
    expect(skuLookupKey('pack', '12', 10)).toBe('spotless_pack_12_x10')
  })

  it('round-trips every key it writes', () => {
    for (const [kind, v, n] of [
      ['pack', '12', 4],
      ['pack', '15', 10],
      ['single', '8', 1],
    ] as const) {
      expect(parseSkuLookupKey(skuLookupKey(kind, v, n))).toEqual({
        kind,
        washValue: v,
        tokens: n,
      })
    }
  })

  it('rejects keys it would never write', () => {
    for (const bad of [
      'spotless_pack_12_x4', // non-canonical spelling of the 4-pack
      'spotless_single_8_x2', // singles have no size
      'spotless_pack_012',
      'spotless_pack_12_x010',
      'spotless_sub_weekly_12',
      '',
      undefined,
    ]) {
      expect(parseSkuLookupKey(bad)).toBeNull()
    }
  })
})

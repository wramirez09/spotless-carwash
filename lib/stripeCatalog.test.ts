// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'
import { adoptSku, catalogKey, loadStripeCatalog } from './stripeCatalog'
import { skuLookupKey } from './pricing/model'

// This module is what makes Stripe authoritative: it decides which Price each
// SKU actually charges. Every "skip" branch below is a case where guessing
// would silently change what a customer pays, so they are asserted explicitly
// rather than left to the fallback.

const productsList = vi.fn()
const productsUpdate = vi.fn()

const stripe = {
  products: { list: productsList, update: productsUpdate },
} as unknown as Stripe

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prod_pack_12',
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

    expect(catalog.get(catalogKey('pack', '12'))).toEqual({
      stripePriceId: 'price_live_12',
      cents: 4800,
      productId: 'prod_pack_12',
    })
  })

  it('fetches every SKU in a single API call', async () => {
    // This runs for the pack cards and every checkout — eight round-trips
    // instead of one would be felt.
    productsList.mockResolvedValue({ data: [product()] })
    await loadStripeCatalog(stripe)

    expect(productsList).toHaveBeenCalledTimes(1)
    expect(productsList).toHaveBeenCalledWith(
      expect.objectContaining({ active: true, expand: ['data.default_price'] }),
    )
  })

  it('maps pack and single denominations independently', async () => {
    productsList.mockResolvedValue({
      data: [
        product(),
        product({
          id: 'prod_single_8',
          metadata: { lookup_key: skuLookupKey('single', '8') },
          default_price: { id: 'price_live_s8', active: true, unit_amount: 800 },
        }),
      ],
    })

    const catalog = await loadStripeCatalog(stripe)

    expect(catalog.get(catalogKey('pack', '12'))?.cents).toBe(4800)
    expect(catalog.get(catalogKey('single', '8'))?.cents).toBe(800)
    expect(catalog.size).toBe(2)
  })

  it('ignores Products with no lookup key', async () => {
    // The account holds unrelated Products (subscription plans, one-offs).
    productsList.mockResolvedValue({ data: [product({ metadata: {} })] })
    expect((await loadStripeCatalog(stripe)).size).toBe(0)
  })

  it('ignores a lookup key that matches no known SKU', async () => {
    productsList.mockResolvedValue({
      data: [product({ metadata: { lookup_key: 'spotless_pack_99' } })],
    })
    expect((await loadStripeCatalog(stripe)).size).toBe(0)
  })

  it('skips a Product with no default_price rather than guessing', async () => {
    // Not yet adopted. Picking one of its Prices could charge the wrong amount.
    productsList.mockResolvedValue({ data: [product({ default_price: null })] })
    expect((await loadStripeCatalog(stripe)).size).toBe(0)
  })

  it('skips an unexpanded default_price', async () => {
    // A bare ID carries no unit_amount, so there is nothing to report.
    productsList.mockResolvedValue({ data: [product({ default_price: 'price_live_12' })] })
    expect((await loadStripeCatalog(stripe)).size).toBe(0)
  })

  it('skips an ARCHIVED default_price', async () => {
    // Stripe: `active` is "whether the price can be used for new purchases".
    // Handing an archived Price to Checkout fails the session outright, so
    // falling back is strictly better than using it.
    productsList.mockResolvedValue({
      data: [product({ default_price: { id: 'price_old', active: false, unit_amount: 4800 } })],
    })
    expect((await loadStripeCatalog(stripe)).size).toBe(0)
  })

  it('skips a default_price with no unit_amount', async () => {
    // e.g. a custom_unit_amount ("pay what you want") Price.
    productsList.mockResolvedValue({
      data: [product({ default_price: { id: 'price_x', active: true, unit_amount: null } })],
    })
    expect((await loadStripeCatalog(stripe)).size).toBe(0)
  })

  it('returns an empty catalog when Stripe throws', async () => {
    // Callers read this as "Stripe could not answer" and fall back, rather
    // than as "these SKUs have no price".
    productsList.mockRejectedValue(new Error('network down'))
    expect((await loadStripeCatalog(stripe)).size).toBe(0)
  })

  it('keeps usable SKUs when a sibling Product is unusable', async () => {
    productsList.mockResolvedValue({
      data: [product({ default_price: null }), product({
        id: 'prod_pack_8',
        metadata: { lookup_key: skuLookupKey('pack', '8') },
        default_price: { id: 'price_live_8', active: true, unit_amount: 3200 },
      })],
    })

    const catalog = await loadStripeCatalog(stripe)
    expect(catalog.size).toBe(1)
    expect(catalog.get(catalogKey('pack', '8'))?.cents).toBe(3200)
  })
})

describe('adoptSku', () => {
  it('points default_price at the Price and stamps the lookup key', async () => {
    await adoptSku(stripe, {
      productId: 'prod_1',
      priceId: 'price_1',
      kind: 'pack',
      washValue: '10',
    })

    expect(productsUpdate).toHaveBeenCalledWith('prod_1', {
      default_price: 'price_1',
      metadata: {
        lookup_key: 'spotless_pack_10',
        sku_kind: 'pack',
        wash_value: '10',
      },
    })
  })

  it('is idempotent — safe to call on every price change', async () => {
    const args = {
      productId: 'prod_1',
      priceId: 'price_1',
      kind: 'single' as const,
      washValue: '9' as const,
    }
    await adoptSku(stripe, args)
    await adoptSku(stripe, args)

    expect(productsUpdate).toHaveBeenCalledTimes(2)
    expect(productsUpdate.mock.calls[0]).toEqual(productsUpdate.mock.calls[1])
  })

  it('propagates a Stripe failure so the caller can report it', async () => {
    productsUpdate.mockRejectedValue(new Error('permission denied'))
    await expect(
      adoptSku(stripe, {
        productId: 'p',
        priceId: 'pr',
        kind: 'pack',
        washValue: '8',
      }),
    ).rejects.toThrow('permission denied')
  })
})

describe('catalogKey / skuLookupKey', () => {
  it('keeps pack and single namespaces distinct', () => {
    expect(catalogKey('pack', '8')).not.toBe(catalogKey('single', '8'))
    expect(skuLookupKey('pack', '8')).not.toBe(skuLookupKey('single', '8'))
  })

  it('pins the lookup-key format — it matches Products already in Stripe', () => {
    expect(skuLookupKey('pack', '12')).toBe('spotless_pack_12')
    expect(skuLookupKey('single', '8')).toBe('spotless_single_8')
  })
})

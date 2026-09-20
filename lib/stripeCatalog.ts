import 'server-only'
import Stripe from 'stripe'
import {
  PRICE_KINDS,
  WASH_VALUES,
  skuLookupKey,
  type PriceKind,
  type WashValue,
} from './pricing/model'

// Resolves each SKU's CURRENT price from Stripe.
//
// Stripe is the source of truth for what a thing costs. A SKU is a Stripe
// Product carrying `metadata.lookup_key`, and its current price is that
// Product's `default_price`. Nothing here consults our database.
//
// Why not a Price ID stored in Supabase: Stripe Prices are immutable, so
// changing a price in the Stripe dashboard means archiving one Price and
// creating another. A stored ID would never learn about that — and if the
// stored Price got archived, checkout would break outright, because archived
// Prices can't be used in new Checkout Sessions.

export type StripeSku = {
  stripePriceId: string
  cents: number
  productId: string
}

/** Map key: `${kind}:${washValue}`. */
export type StripeCatalog = Map<string, StripeSku>

export function catalogKey(kind: PriceKind, washValue: WashValue): string {
  return `${kind}:${washValue}`
}

/**
 * Every keyed SKU, in ONE API call.
 *
 * `products.list` with an expanded `default_price` is deliberate: resolving
 * eight SKUs individually would be eight round-trips on a path that runs for
 * the pack cards and every checkout. The 100-item page is far above the eight
 * Products this catalog has.
 *
 * Returns an empty map on any failure — callers treat that as "Stripe couldn't
 * answer" and fall back, rather than as "this SKU has no price".
 */
export async function loadStripeCatalog(stripe: Stripe): Promise<StripeCatalog> {
  const catalog: StripeCatalog = new Map()

  try {
    const products = await stripe.products.list({
      active: true,
      limit: 100,
      expand: ['data.default_price'],
    })

    for (const product of products.data) {
      const key = product.metadata?.lookup_key
      if (!key) continue

      // `default_price` is what makes a Product point at its current Price.
      // A Product with none set hasn't been adopted yet; skip it rather than
      // guessing from its Price list, where picking the wrong one would
      // silently change what customers are charged.
      const price = product.default_price
      if (!price || typeof price === 'string') continue
      if (!price.active || price.unit_amount == null) continue

      for (const kind of PRICE_KINDS) {
        for (const washValue of WASH_VALUES) {
          if (skuLookupKey(kind, washValue) !== key) continue
          catalog.set(catalogKey(kind, washValue), {
            stripePriceId: price.id,
            cents: price.unit_amount,
            productId: product.id,
          })
        }
      }
    }
  } catch (err) {
    console.error('[stripeCatalog] could not list products; falling back', err)
    return new Map()
  }

  return catalog
}

/**
 * Make a Product the authoritative home for a SKU: stamp the lookup key and
 * point `default_price` at the given Price.
 *
 * Idempotent, so it is safe to call on every price change and from the
 * adoption path. Existing metadata is preserved — Stripe merges metadata
 * updates, and clobbering keys set by hand in the dashboard would be rude.
 */
export async function adoptSku(
  stripe: Stripe,
  args: { productId: string; priceId: string; kind: PriceKind; washValue: WashValue },
): Promise<void> {
  await stripe.products.update(args.productId, {
    default_price: args.priceId,
    metadata: {
      lookup_key: skuLookupKey(args.kind, args.washValue),
      sku_kind: args.kind,
      wash_value: args.washValue,
    },
  })
}

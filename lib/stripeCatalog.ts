import 'server-only'
import Stripe from 'stripe'
import {
  DEFAULT_SORT_ORDER,
  defaultFeatured,
  parseSkuLookupKey,
  skuLookupKey,
  type PriceKind,
} from './pricing/model'

// Resolves the one-time token catalog from Stripe.
//
// Stripe is the source of truth for WHAT is sold and what it costs. A SKU is a
// Stripe Product carrying `metadata.lookup_key` (see `skuLookupKey`), and its
// current price is that Product's `default_price`. Nothing here consults our
// database.
//
// Why not a Price ID stored in Supabase: Stripe Prices are immutable, so
// changing a price in the Stripe dashboard means archiving one Price and
// creating another. A stored ID would never learn about that — and if the
// stored Price got archived, checkout would break outright, because archived
// Prices can't be used in new Checkout Sessions.

export type StripeSku = {
  sku: string
  kind: PriceKind
  washValue: string
  tokens: number
  productId: string
  /**
   * False for an archived Product. Kept rather than dropped: an archived,
   * keyed Product is how an admin DELETES a SKU, and the store must know about
   * it so it doesn't resurrect that SKU from the deploy-time env vars.
   */
  active: boolean
  /** Null when the Product has no usable default price. */
  stripePriceId: string | null
  cents: number | null
  featured: boolean
  sortOrder: number
}

export type StripeCatalog = {
  /** False when Stripe could not be asked — callers fall back. */
  ok: boolean
  skus: Map<string, StripeSku>
}

/** Safety cap on pagination: 10 pages × 100 is far above this catalog. */
const MAX_PAGES = 10

function toSku(product: Stripe.Product): StripeSku | null {
  const key = product.metadata?.lookup_key
  const parsed = parseSkuLookupKey(key)
  if (!parsed || !key) return null

  // `default_price` is what makes a Product point at its current Price. A
  // Product with none set hasn't been adopted yet; it is reported with no
  // price rather than guessed from its Price list, where picking the wrong one
  // would silently change what customers are charged.
  const price = product.default_price
  const usable =
    price && typeof price !== 'string' && price.active && price.unit_amount != null
      ? price
      : null

  const featuredMeta = product.metadata?.featured
  const sortMeta = Number(product.metadata?.sort_order)

  return {
    sku: key,
    ...parsed,
    productId: product.id,
    active: product.active !== false,
    stripePriceId: usable ? usable.id : null,
    cents: usable ? (usable.unit_amount as number) : null,
    featured:
      featuredMeta === 'true'
        ? true
        : featuredMeta === 'false'
          ? false
          : defaultFeatured(parsed.kind, parsed.washValue, parsed.tokens),
    sortOrder: Number.isFinite(sortMeta) && product.metadata?.sort_order !== ''
      ? sortMeta
      : DEFAULT_SORT_ORDER,
  }
}

/**
 * Every keyed SKU — active and archived — in as few API calls as possible.
 *
 * `products.list` with an expanded `default_price` is deliberate: resolving
 * SKUs individually would be a round-trip each on a path that runs for the
 * pack cards and every checkout. One page of 100 covers this catalog; the loop
 * only exists so a catalog that outgrows it is not silently truncated.
 *
 * Returns `ok: false` on any failure — callers treat that as "Stripe couldn't
 * answer" and fall back, rather than as "nothing is for sale".
 */
export async function loadStripeCatalog(stripe: Stripe): Promise<StripeCatalog> {
  const skus = new Map<string, StripeSku>()

  try {
    let startingAfter: string | undefined
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await stripe.products.list({
        limit: 100,
        expand: ['data.default_price'],
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })
      for (const product of res.data) {
        const sku = toSku(product)
        if (!sku) continue
        const prior = skus.get(sku.sku)
        // Two Products claiming one key (e.g. one recreated by hand): an
        // active, priced one beats an archived one, so a stale duplicate can
        // never hide or delete the real SKU.
        if (prior && rank(prior) >= rank(sku)) continue
        skus.set(sku.sku, sku)
      }
      if (!res.has_more || res.data.length === 0) break
      startingAfter = res.data[res.data.length - 1].id
    }
  } catch (err) {
    console.error('[stripeCatalog] could not list products; falling back', err)
    return { ok: false, skus: new Map() }
  }

  return { ok: true, skus }
}

function rank(s: StripeSku): number {
  return (s.active ? 2 : 0) + (s.stripePriceId ? 1 : 0)
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
  args: {
    productId: string
    priceId: string
    kind: PriceKind
    washValue: string
    tokens?: number
  },
): Promise<void> {
  const tokens = args.tokens ?? (args.kind === 'pack' ? 4 : 1)
  await stripe.products.update(args.productId, {
    active: true,
    default_price: args.priceId,
    metadata: {
      lookup_key: skuLookupKey(args.kind, args.washValue, tokens),
      sku_kind: args.kind,
      wash_value: args.washValue,
      token_count: String(tokens),
    },
  })
}

// ---------------------------------------------------------------------------
// Subscription prices (keyed by Price lookup_key)
// ---------------------------------------------------------------------------

export type StripeSubscriptionPrice = {
  priceId: string
  cents: number
  productId: string
}

/** Stripe accepts at most 10 lookup keys per prices.list call. */
const LOOKUP_KEY_BATCH = 10

/**
 * Resolve recurring Prices by lookup key. Returns null when Stripe could not
 * be asked, so callers can tell "unreachable" from "not keyed yet".
 */
export async function loadSubscriptionPrices(
  stripe: Stripe,
  lookupKeys: readonly string[],
): Promise<Map<string, StripeSubscriptionPrice> | null> {
  const out = new Map<string, StripeSubscriptionPrice>()
  try {
    for (let i = 0; i < lookupKeys.length; i += LOOKUP_KEY_BATCH) {
      const batch = lookupKeys.slice(i, i + LOOKUP_KEY_BATCH)
      const res = await stripe.prices.list({
        lookup_keys: [...batch],
        active: true,
        limit: 100,
      })
      for (const price of res.data) {
        if (!price.lookup_key || price.unit_amount == null) continue
        out.set(price.lookup_key, {
          priceId: price.id,
          cents: price.unit_amount,
          productId: typeof price.product === 'string' ? price.product : price.product.id,
        })
      }
    }
  } catch (err) {
    console.error('[stripeCatalog] could not list subscription prices', err)
    return null
  }
  return out
}

import 'server-only'
import { getSupabaseAdmin } from './supabase'
import {
  getPackDiscountCouponId,
  getPackPriceId,
  getSeasonalCouponId,
  getSinglePriceId,
} from './stripeEnv'
import { SEASONAL_SALES } from './salesSchedule'
import { getStripeSecretKey } from './stripeEnv'
import { catalogKey, loadStripeCatalog } from './stripeCatalog'
import Stripe from 'stripe'
import {
  WASH_VALUES,
  pickActiveSale,
  type CatalogPriceRecord,
  type PriceKind,
  type PricingSettings,
  type SaleRecord,
  type SaleStatus,
  type WashValue,
} from './pricing/model'

// The READ side of admin-managed pricing: what the storefront and checkout
// ask "what does a 4-pack cost and is a sale on?".
//
// Two properties matter more than freshness here:
//
//  1. It must never take checkout down. Supabase being unconfigured,
//     unreachable, or paused (both projects have been paused before) degrades
//     to the env-var + hardcoded config this replaced, which is the exact
//     behavior the site had before /admin/pricing existed.
//  2. It must not hit Supabase on every render. The banner renders in the root
//     layout, so an uncached read would add a round-trip to every page. A
//     short TTL cache is enough: sale windows turn over on a schedule measured
//     in weeks, and admin writes invalidate the cache directly.

/** Where a SKU's price came from, highest precedence first. */
export type PriceSource = 'stripe' | 'db' | 'env'

export type PriceEntry = {
  stripePriceId: string
  cents: number | null
  source: PriceSource
}

export type PricingSnapshot = {
  prices: Record<PriceKind, Record<WashValue, PriceEntry>>
  sales: SaleRecord[]
  settings: PricingSettings
  /** 'db' when Supabase answered, 'fallback' when env config was used. */
  source: 'db' | 'fallback'
}

// Long enough to spare Supabase a read per render, short enough that a sale
// boundary is honored promptly without waiting on the cron. Admin writes call
// `invalidatePricingCache()`, so this only ever delays externally-made
// changes (a row edited directly in Supabase) or a window opening.
const CACHE_TTL_MS = 30_000

// How long to stop calling Supabase after a read fails.
//
// A failed read is not free: it still costs a round-trip, and the banner
// renders in the root layout, so a broken database would otherwise add three
// failing queries to EVERY page view of the whole site. The fallback snapshot
// itself is never cached — it is recomputed from env each time, so a recovered
// database is picked up the moment the breaker closes — but the call that
// produced the failure is suppressed for this long.
const DB_FAILURE_BACKOFF_MS = 10_000

let cached: { at: number; snapshot: PricingSnapshot } | null = null
let inflight: Promise<PricingSnapshot> | null = null
let dbFailedAt = 0

/** Drop the cache so the next read hits Supabase. Called after every write. */
export function invalidatePricingCache(): void {
  cached = null
  inflight = null
  // An admin write means someone is actively trying to fix things — let their
  // next read reach the database rather than sit behind the breaker.
  dbFailedAt = 0
}

// ---------------------------------------------------------------------------
// Fallback: the configuration that existed before this table did.
// ---------------------------------------------------------------------------

function fallbackSettings(): PricingSettings {
  let baseCouponId: string | null = null
  try {
    baseCouponId = getPackDiscountCouponId() ?? null
  } catch {
    // getPackDiscountCouponId throws on Vercel Production when unset. A
    // missing coupon is a checkout-time problem, not a reason to fail the
    // render that's merely asking what the discount is worth.
    baseCouponId = null
  }
  return { baseDiscountCents: 500, baseCouponId }
}

/**
 * The hardcoded SEASONAL_SALES, lifted into SaleRecord shape. These stay as
 * the fallback so a Supabase outage during a live sale leaves the sale
 * running rather than silently dropping the discount.
 */
function fallbackSales(): SaleRecord[] {
  return SEASONAL_SALES.map((s) => {
    let couponId: string | null = null
    try {
      couponId = getSeasonalCouponId(s.couponEnvSuffix) ?? null
    } catch {
      couponId = null
    }
    return {
      id: `legacy:${s.id}`,
      slug: s.id,
      label: s.label,
      badge: s.badge,
      emoji: s.emoji,
      endLabel: s.endLabel,
      startMs: s.startMs,
      endMs: s.endMs,
      // The legacy coupons were authored as the COMBINED amount ($10), of
      // which $5 was the base bundle discount — so the "extra" is $5.
      extraDiscountCents: 500,
      stripeCouponId: couponId,
      stripeAmountOffCents: 1000,
      status: 'scheduled' as SaleStatus,
    }
  })
}

function envPriceId(kind: PriceKind, v: WashValue): string {
  try {
    const id = kind === 'pack' ? getPackPriceId(v) : getSinglePriceId(v)
    return id ?? ''
  } catch {
    return ''
  }
}

function fallbackPrices(): PricingSnapshot['prices'] {
  const build = (kind: PriceKind) =>
    Object.fromEntries(
      WASH_VALUES.map((v) => [
        v,
        { stripePriceId: envPriceId(kind, v), cents: null, source: 'env' as PriceSource },
      ]),
    ) as Record<WashValue, PriceEntry>
  return { pack: build('pack'), single: build('single') }
}

async function fallbackSnapshot(): Promise<PricingSnapshot> {
  return {
    // Stripe still answers for prices even with the database unavailable —
    // it is a separate system, and the whole point is that it is authoritative.
    prices: await applyStripeCatalog(fallbackPrices()),
    sales: fallbackSales(),
    settings: fallbackSettings(),
    source: 'fallback',
  }
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

// Stripe client used purely to resolve the catalog. Separate from the one in
// stripePricing so a missing key degrades here without touching that path.
let stripeSingleton: Stripe | null = null
function getStripe(): Stripe | null {
  if (stripeSingleton) return stripeSingleton
  const key = getStripeSecretKey()
  if (!key) return null
  stripeSingleton = new Stripe(key)
  return stripeSingleton
}

/**
 * Overlay Stripe's answer on top of whatever the database and env said.
 *
 * Precedence is Stripe > database > env. Stripe wins because it is the system
 * actually charging the customer: a Product's `default_price` is the live
 * truth, while a stored Price ID is a snapshot that goes stale the moment
 * someone edits prices in the Stripe dashboard.
 *
 * A SKU Stripe doesn't know about (never adopted, or Stripe unreachable) keeps
 * the lower-precedence value, so adoption can happen one SKU at a time.
 */
async function applyStripeCatalog(
  prices: PricingSnapshot['prices'],
): Promise<PricingSnapshot['prices']> {
  const stripe = getStripe()
  if (!stripe) return prices

  const catalog = await loadStripeCatalog(stripe)
  if (catalog.size === 0) return prices

  for (const kind of ['pack', 'single'] as PriceKind[]) {
    for (const v of WASH_VALUES) {
      const sku = catalog.get(catalogKey(kind, v))
      if (!sku) continue
      prices[kind][v] = {
        stripePriceId: sku.stripePriceId,
        cents: sku.cents,
        source: 'stripe',
      }
    }
  }
  return prices
}

type SaleRow = {
  id: string
  slug: string
  label: string
  badge: string
  emoji: string | null
  end_label: string | null
  starts_at: string
  ends_at: string
  extra_discount_cents: number
  stripe_coupon_id: string | null
  stripe_amount_off_cents: number | null
  status: string
}

export function mapSaleRow(row: SaleRow): SaleRecord {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    badge: row.badge,
    emoji: row.emoji || '✨',
    endLabel: row.end_label,
    startMs: Date.parse(row.starts_at),
    endMs: Date.parse(row.ends_at),
    extraDiscountCents: row.extra_discount_cents,
    stripeCouponId: row.stripe_coupon_id,
    stripeAmountOffCents: row.stripe_amount_off_cents,
    status: (row.status as SaleStatus) ?? 'draft',
  }
}

type PriceRow = {
  id: string
  kind: string
  wash_value: string
  unit_amount_cents: number
  stripe_price_id: string
  stripe_product_id: string | null
  active: boolean
  created_at: string
  created_by: string | null
}

export function mapPriceRow(row: PriceRow): CatalogPriceRecord {
  return {
    id: row.id,
    kind: row.kind as PriceKind,
    washValue: row.wash_value as WashValue,
    unitAmountCents: row.unit_amount_cents,
    stripePriceId: row.stripe_price_id,
    stripeProductId: row.stripe_product_id,
    active: row.active,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

async function loadSnapshot(): Promise<PricingSnapshot> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return fallbackSnapshot()

  // Breaker is open after a recent failure — skip the round-trip entirely.
  if (dbFailedAt && Date.now() - dbFailedAt < DB_FAILURE_BACKOFF_MS) {
    return fallbackSnapshot()
  }

  try {
    const [pricesRes, salesRes, settingsRes] = await Promise.all([
      supabase.from('catalog_prices').select('*').eq('active', true),
      supabase.from('sales').select('*').eq('status', 'scheduled'),
      supabase.from('pricing_settings').select('*').eq('id', 1).maybeSingle(),
    ])

    if (pricesRes.error || salesRes.error || settingsRes.error) {
      dbFailedAt = Date.now()
      console.error('[pricingStore] read failed; using env fallback', {
        prices: pricesRes.error,
        sales: salesRes.error,
        settings: settingsRes.error,
      })
      return await fallbackSnapshot()
    }

    const fallback = fallbackPrices()
    const prices = fallbackPrices()
    for (const raw of (pricesRes.data ?? []) as PriceRow[]) {
      const row = mapPriceRow(raw)
      const kindBucket = prices[row.kind]
      if (!kindBucket || !kindBucket[row.washValue]) continue
      kindBucket[row.washValue] = {
        stripePriceId: row.stripePriceId,
        cents: row.unitAmountCents,
        source: 'db',
      }
    }

    // A SKU with no active row keeps its env-var Price ID — so adopting this
    // table doesn't require backfilling all eight SKUs before it's usable.
    for (const kind of ['pack', 'single'] as PriceKind[]) {
      for (const v of WASH_VALUES) {
        if (!prices[kind][v].stripePriceId) prices[kind][v] = fallback[kind][v]
      }
    }

    const sales = ((salesRes.data ?? []) as SaleRow[]).map(mapSaleRow)
    const settingsRow = settingsRes.data as
      | { base_discount_cents: number; base_coupon_id: string | null }
      | null

    const envSettings = fallbackSettings()
    const settings: PricingSettings = settingsRow
      ? {
          baseDiscountCents: settingsRow.base_discount_cents,
          baseCouponId: settingsRow.base_coupon_id || envSettings.baseCouponId,
        }
      : envSettings

    dbFailedAt = 0
    return { prices: await applyStripeCatalog(prices), sales, settings, source: 'db' }
  } catch (err) {
    dbFailedAt = Date.now()
    console.error('[pricingStore] read threw; using env fallback', err)
    return await fallbackSnapshot()
  }
}

/** Cached pricing snapshot. Concurrent callers share one in-flight read. */
export async function getPricingSnapshot(): Promise<PricingSnapshot> {
  const now = Date.now()
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.snapshot
  if (inflight) return inflight

  inflight = loadSnapshot()
    .then((snapshot) => {
      // Only cache a snapshot that actually cost a round-trip. The fallback is
      // pure env + constant reads, so caching it buys nothing and costs
      // correctness: a fallback cached during a brief Supabase outage would
      // keep serving stale config for the rest of the TTL even after the
      // database came back.
      if (snapshot.source === 'db') cached = { at: Date.now(), snapshot }
      return snapshot
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

/** The sale customers should see right now, or null. */
export async function resolveActiveSale(now = Date.now()): Promise<SaleRecord | null> {
  const snapshot = await getPricingSnapshot()
  return pickActiveSale(snapshot.sales, now)
}

/** Every sale row (any status), newest window first. Admin views only. */
export async function listAllSales(): Promise<SaleRecord[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return fallbackSales()
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('starts_at', { ascending: false })
  if (error) {
    console.error('[pricingStore] listAllSales failed', error)
    return fallbackSales()
  }
  return ((data ?? []) as SaleRow[]).map(mapSaleRow)
}

/** Active catalog rows, for the admin price table. */
export async function listCatalogPrices(): Promise<CatalogPriceRecord[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('catalog_prices')
    .select('*')
    .eq('active', true)
  if (error) {
    console.error('[pricingStore] listCatalogPrices failed', error)
    return []
  }
  return ((data ?? []) as PriceRow[]).map(mapPriceRow)
}

export async function getPricingSettings(): Promise<PricingSettings> {
  return (await getPricingSnapshot()).settings
}

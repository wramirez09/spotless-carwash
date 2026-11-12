// The wash packages are the source of truth for pricing.
//
// The packages on the home page (Sanity `washPackage` documents: Deluxe $10,
// Ultimate $12, Lustre $14 …) decide two things for the whole site:
//
//   1. WHICH token values are sold — one per wash package. A token for a wash
//      that no longer exists is never offered and never sold.
//   2. WHAT they cost — a single token is the wash price, and an N-pack lists
//      at N × the wash price. The pack discount (/admin/pricing) then comes off
//      at checkout as before.
//
// Stripe still does the charging, so its catalog has to mirror these rules;
// `planCatalogSync` works out exactly what would bring it in line, and the
// admin "Sync" button and the CMS publish webhook both apply that plan.
//
// Pure — no Stripe, Sanity or `server-only` — so every rule is unit-tested.

import { PACK_TOKEN_COUNT, skuLookupKey, type PriceKind } from './pricing/model'

export type WashTier = {
  /** Package name, e.g. "Lustre". */
  name: string
  /** Whole-dollar token value as a string, e.g. '14'. */
  washValue: string
  /** Price of one wash, cents. */
  priceCents: number
}

/** Anything shaped like a wash package (CMS document or the fallback copy). */
type PackageLike = { name?: string | null; priceNumber?: number | null }

/**
 * Wash tiers from the packages, in the order given. Packages without a usable
 * whole-dollar price are skipped rather than guessed at, and two packages at
 * the same price share one token value (the first one's name is used).
 */
export function tiersFromPackages(packages: readonly PackageLike[]): WashTier[] {
  const out: WashTier[] = []
  for (const p of packages) {
    const n = Number(p.priceNumber)
    if (!Number.isInteger(n) || n < 1 || n > 100) continue
    const washValue = String(n)
    if (out.some((t) => t.washValue === washValue)) continue
    out.push({ name: (p.name ?? '').trim() || `$${n} wash`, washValue, priceCents: n * 100 })
  }
  return out
}

/** What a SKU should list at: tokens × the wash price. Null if not a tier. */
export function expectedListCents(
  tiers: readonly WashTier[],
  washValue: string,
  tokens: number,
): number | null {
  const tier = tiers.find((t) => t.washValue === washValue)
  return tier ? tier.priceCents * tokens : null
}

export type SkuLike = {
  sku: string
  kind: PriceKind
  washValue: string
  tokens: number
  cents: number | null
}

export type SyncAction =
  | { type: 'create'; sku: string; kind: PriceKind; washValue: string; tokens: number; cents: number; tier: string }
  | { type: 'reprice'; sku: string; kind: PriceKind; washValue: string; tokens: number; from: number | null; to: number; tier: string }
  | { type: 'remove'; sku: string; washValue: string; tokens: number; kind: PriceKind }

/**
 * The changes that would make the token catalog match the wash packages.
 *
 *  - every package gets a 4-pack, at 4 × its price;
 *  - every other pack of a package's value is re-priced to tokens × price;
 *  - single tokens are re-priced to the wash price, and — if the store sells
 *    single tokens at all — one is added for any package that lacks it (an
 *    admin who removed every single has decided not to sell them);
 *  - anything for a token value that is no longer a package is removed.
 *
 * No tiers means the CMS answered with nothing — almost certainly a mistake or
 * an outage, never a decision to stop selling tokens — so the plan is empty.
 */
export function planCatalogSync(
  catalog: readonly SkuLike[],
  tiers: readonly WashTier[],
): SyncAction[] {
  if (tiers.length === 0) return []
  const actions: SyncAction[] = []
  const sellsSingles = catalog.some((s) => s.kind === 'single')

  for (const tier of tiers) {
    const forTier = catalog.filter((s) => s.washValue === tier.washValue)

    const fourPack = forTier.find((s) => s.kind === 'pack' && s.tokens === PACK_TOKEN_COUNT)
    if (!fourPack) {
      actions.push({
        type: 'create',
        sku: skuLookupKey('pack', tier.washValue, PACK_TOKEN_COUNT),
        kind: 'pack',
        washValue: tier.washValue,
        tokens: PACK_TOKEN_COUNT,
        cents: tier.priceCents * PACK_TOKEN_COUNT,
        tier: tier.name,
      })
    }

    const single = forTier.find((s) => s.kind === 'single')
    if (!single && sellsSingles) {
      actions.push({
        type: 'create',
        sku: skuLookupKey('single', tier.washValue, 1),
        kind: 'single',
        washValue: tier.washValue,
        tokens: 1,
        cents: tier.priceCents,
        tier: tier.name,
      })
    }

    for (const s of forTier) {
      const to = tier.priceCents * s.tokens
      if (s.cents !== to) {
        actions.push({
          type: 'reprice',
          sku: s.sku,
          kind: s.kind,
          washValue: s.washValue,
          tokens: s.tokens,
          from: s.cents,
          to,
          tier: tier.name,
        })
      }
    }
  }

  const values = new Set(tiers.map((t) => t.washValue))
  for (const s of catalog) {
    if (!values.has(s.washValue)) {
      actions.push({ type: 'remove', sku: s.sku, washValue: s.washValue, tokens: s.tokens, kind: s.kind })
    }
  }
  return actions
}

/** One line per action, for the admin page and the audit log. */
export function describeSyncAction(a: SyncAction): string {
  const what =
    a.kind === 'single' ? `$${a.washValue} single token` : `$${a.washValue} ${a.tokens}-pack`
  const usd = (c: number) => `$${(c / 100).toFixed(2)}`
  switch (a.type) {
    case 'create':
      return `Add the ${what} at ${usd(a.cents)} (${a.tier})`
    case 'reprice':
      return `Change the ${what} ${a.from == null ? '' : `from ${usd(a.from)} `}to ${usd(a.to)} (${a.tier})`
    case 'remove':
      return `Remove the ${what} — there is no $${a.washValue} wash package`
  }
}

/**
 * Which wash package wears the "Most Popular" badge on the home page — always
 * at most ONE, and the same one as the store.
 *
 * It is decided in ONE place — the token pack marked "Most popular" in
 * /admin/pricing — so the home page and the buy-tokens page can never
 * disagree. The CMS `featured` flag is deliberately ignored: it carried two
 * badges at once (Deluxe and Lustre). No pack marked means no badge.
 * Returns the package's index, or -1 for none.
 */
export function featuredWashIndex(
  packages: readonly { priceNumber?: number | null }[],
  featuredValue: string | null | undefined,
): number {
  if (!featuredValue) return -1
  return packages.findIndex((p) => String(p.priceNumber) === featuredValue)
}

// ---------------------------------------------------------------------------
// New wash packages (admin "Add a wash package")
// ---------------------------------------------------------------------------

export const WASH_COLORS = ['red', 'green', 'purple', 'blue'] as const

export type NewWashPackage = {
  name: string
  priceNumber: number
  color: string
  /** One feature per entry; blanks are ignored. */
  features: string[]
}

/** First problem with a new package, or null. */
export function validateNewWashPackage(
  input: NewWashPackage,
  existing: readonly { name?: string | null; priceNumber?: number | null }[],
): string | null {
  const name = input.name.trim()
  if (!name) return 'A wash package needs a name.'
  if (name.length > 30) return 'Keep the package name to 30 characters or fewer.'
  if (!Number.isInteger(input.priceNumber) || input.priceNumber < 1 || input.priceNumber > 100) {
    return 'The price must be a whole-dollar amount between $1 and $100.'
  }
  if (!(WASH_COLORS as readonly string[]).includes(input.color)) return 'Choose a colour.'
  const features = input.features.map((f) => f.trim()).filter(Boolean)
  if (features.length === 0) return 'List at least one thing the wash includes.'
  if (features.length > 10) return 'List at most 10 features.'
  if (features.some((f) => f.length > 60)) return 'Keep each feature to 60 characters or fewer.'

  const sameName = existing.find((p) => (p.name ?? '').trim().toLowerCase() === name.toLowerCase())
  if (sameName) return 'There is already a "' + sameName.name + '" package.'
  // The price IS the token value, so two packages at one price would share a
  // token — and a pack of it — with no way to tell them apart at checkout.
  const samePrice = existing.find((p) => p.priceNumber === input.priceNumber)
  if (samePrice) {
    return (
      samePrice.name + ' is already $' + input.priceNumber +
      '. Each wash package needs its own price, because the price is its token value.'
    )
  }
  return null
}

/**
 * The `order` for a new package so it lands among the others by price,
 * without renumbering the existing documents: halfway between its cheaper
 * and dearer neighbours, or one past either end.
 */
export function orderForPrice(
  existing: readonly { priceNumber?: number | null; order?: number | null }[],
  priceNumber: number,
): number {
  const placed = existing
    .filter((p) => Number.isFinite(p.priceNumber) && Number.isFinite(p.order))
    .map((p) => ({ price: p.priceNumber as number, order: p.order as number }))
  if (placed.length === 0) return 1
  const below = placed.filter((p) => p.price < priceNumber).map((p) => p.order)
  const above = placed.filter((p) => p.price > priceNumber).map((p) => p.order)
  const lo = below.length ? Math.max(...below) : null
  const hi = above.length ? Math.min(...above) : null
  if (lo != null && hi != null && hi > lo) return (lo + hi) / 2
  if (lo != null) return lo + 1
  return (hi as number) - 1
}

/** The Sanity document for a new package, in the shape the existing ones use. */
export function washPackageDocument(input: NewWashPackage, order: number, idSuffix: string) {
  const features = input.features.map((f) => f.trim()).filter(Boolean)
  return {
    _id: 'washPackage-' + idSuffix,
    _type: 'washPackage' as const,
    num: String(input.priceNumber),
    name: input.name.trim(),
    price: '$' + input.priceNumber,
    priceNumber: input.priceNumber,
    color: input.color,
    featured: false,
    order,
    features: features.map((text, i) => ({
      _key: '_features_' + i,
      _type: 'featureRow',
      text,
      included: true,
    })),
  }
}

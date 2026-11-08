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

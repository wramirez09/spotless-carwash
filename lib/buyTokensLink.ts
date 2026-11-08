// Deep links from a wash package straight into the token checkout.
//
// The wash cards on the home page ("Pick Ultimate · $12") link to
// /buy-tokens?wash=12, and the buy-tokens page opens with that wash's pack
// already in the order — no second click to pick it again. Pure, so the
// matching rules are unit-tested.

/** The buy-tokens URL that opens with this wash's 4-pack in the order. */
export function washCheckoutHref(washValue: number | string): string {
  const v = String(washValue).trim()
  return /^[1-9]\d{0,2}$/.test(v) ? `/buy-tokens?wash=${v}` : '/buy-tokens'
}

type PackLike = { id: string; washValue: string; tokens: number }

/**
 * The pack the page should open with for a `?wash=` (or `?pack=<sku id>`)
 * link, or null to keep the page's usual default.
 *
 * Prefers that wash's 4-pack — the pack the card advertises — then any pack
 * of that value. A value that isn't on sale (a stale or hand-typed link)
 * falls back to the default rather than erroring.
 */
export function initialPackFor(
  packs: readonly PackLike[],
  params: { wash?: string | string[]; pack?: string | string[] },
): string | null {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim()
  const sku = one(params.pack)
  if (sku && packs.some((p) => p.id === sku)) return sku
  const wash = one(params.wash)
  if (!wash || !/^[1-9]\d{0,2}$/.test(wash)) return null
  const forWash = packs.filter((p) => p.washValue === wash)
  return (forWash.find((p) => p.tokens === 4) ?? forWash[0])?.id ?? null
}

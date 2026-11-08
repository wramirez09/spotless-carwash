import { describe, expect, it } from 'vitest'
import {
  describeSyncAction,
  expectedListCents,
  featuredWashIndex,
  planCatalogSync,
  tiersFromPackages,
  type SkuLike,
} from './washPricing'

// The wash packages on the home page are the source of truth for token
// pricing. These pin the rules that turn them into a token catalog.

// What the CMS holds today.
const LIVE_PACKAGES = [
  { name: 'Deluxe', priceNumber: 10 },
  { name: 'Ultimate', priceNumber: 12 },
  { name: 'Lustre', priceNumber: 14 },
]
const tiers = tiersFromPackages(LIVE_PACKAGES)

const sku = (kind: 'pack' | 'single', v: string, tokens: number, cents: number | null): SkuLike => ({
  sku: kind === 'single' || tokens === 4 ? `spotless_${kind}_${v}` : `spotless_${kind}_${v}_x${tokens}`,
  kind,
  washValue: v,
  tokens,
  cents,
})

describe('tiersFromPackages', () => {
  it('turns each package into a token value priced at the wash price', () => {
    expect(tiers).toEqual([
      { name: 'Deluxe', washValue: '10', priceCents: 1000 },
      { name: 'Ultimate', washValue: '12', priceCents: 1200 },
      { name: 'Lustre', washValue: '14', priceCents: 1400 },
    ])
  })

  it('skips packages without a usable whole-dollar price instead of guessing', () => {
    expect(
      tiersFromPackages([
        { name: 'No price' },
        { name: 'Cents', priceNumber: 9.5 },
        { name: 'Zero', priceNumber: 0 },
        { name: 'Ok', priceNumber: 8 },
      ]).map((t) => t.washValue),
    ).toEqual(['8'])
  })

  it('collapses two packages at one price into one token value', () => {
    expect(tiersFromPackages([{ name: 'A', priceNumber: 10 }, { name: 'B', priceNumber: 10 }])).toEqual([
      { name: 'A', washValue: '10', priceCents: 1000 },
    ])
  })
})

describe('expectedListCents', () => {
  it('is tokens × the wash price', () => {
    expect(expectedListCents(tiers, '14', 4)).toBe(5600)
    expect(expectedListCents(tiers, '12', 10)).toBe(12000)
    expect(expectedListCents(tiers, '12', 1)).toBe(1200)
  })

  it('is null for a value with no package', () => {
    expect(expectedListCents(tiers, '9', 4)).toBeNull()
  })
})

describe('planCatalogSync', () => {
  it('moves today\'s $8/$9/$10/$12 catalog onto the $10/$12/$14 packages', () => {
    const catalog = [
      ...['8', '9', '10', '12'].map((v) => sku('pack', v, 4, Number(v) * 400)),
      ...['8', '9', '10', '12'].map((v) => sku('single', v, 1, Number(v) * 100)),
    ]
    const plan = planCatalogSync(catalog, tiers)

    expect(plan.filter((a) => a.type === 'create').map((a) => a.sku)).toEqual([
      'spotless_pack_14',
      'spotless_single_14',
    ])
    expect(plan.find((a) => a.sku === 'spotless_pack_14')).toMatchObject({ cents: 5600, tier: 'Lustre' })
    expect(plan.filter((a) => a.type === 'remove').map((a) => a.sku).sort()).toEqual([
      'spotless_pack_8',
      'spotless_pack_9',
      'spotless_single_8',
      'spotless_single_9',
    ])
    // $10 and $12 already match their wash price.
    expect(plan.some((a) => a.type === 'reprice')).toBe(false)
  })

  it('replaces the tokens of a package whose price changed — the token value IS the price', () => {
    // Lustre goes $14 → $15: a $15 wash takes a $15 token, so the $14 items
    // are removed and $15 ones added (not re-priced in place).
    const catalog = [sku('pack', '14', 4, 5600), sku('pack', '14', 10, 14000), sku('single', '14', 1, 1400)]
    const plan = planCatalogSync(catalog, tiersFromPackages([{ name: 'Lustre', priceNumber: 15 }]))

    expect(plan.filter((a) => a.type === 'remove').map((a) => a.sku)).toEqual([
      'spotless_pack_14',
      'spotless_pack_14_x10',
      'spotless_single_14',
    ])
    expect(plan.filter((a) => a.type === 'create').map((a) => [a.sku, a.type === 'create' && a.cents])).toEqual([
      ['spotless_pack_15', 6000],
      ['spotless_single_15', 1500],
    ])
    expect(plan.some((a) => a.type === 'reprice')).toBe(false)
  })

  it('re-prices a pack that drifted from tokens × wash price', () => {
    const plan = planCatalogSync([sku('pack', '12', 10, 11000), sku('pack', '12', 4, 4800)], tiers.slice(1, 2))
    expect(plan).toEqual([
      expect.objectContaining({ type: 'reprice', sku: 'spotless_pack_12_x10', from: 11000, to: 12000 }),
    ])
  })

  it('does not add single tokens when the store sells none', () => {
    const plan = planCatalogSync([sku('pack', '10', 4, 4000)], tiers)
    expect(plan.filter((a) => a.kind === 'single')).toEqual([])
  })

  it('treats an unknown amount as needing a re-price', () => {
    const plan = planCatalogSync([sku('pack', '10', 4, null)], tiers.slice(0, 1))
    expect(plan).toEqual([expect.objectContaining({ type: 'reprice', from: null, to: 4000 })])
  })

  it('changes nothing when already in line — it is safe to run on every publish', () => {
    const catalog = tiers.flatMap((t) => [
      sku('pack', t.washValue, 4, t.priceCents * 4),
      sku('single', t.washValue, 1, t.priceCents),
    ])
    expect(planCatalogSync(catalog, tiers)).toEqual([])
  })

  it('never empties the store because the CMS returned no packages', () => {
    expect(planCatalogSync([sku('pack', '10', 4, 4000)], [])).toEqual([])
  })
})

describe('describeSyncAction', () => {
  it('reads plainly in the admin page and the audit log', () => {
    const plan = planCatalogSync(
      [sku('pack', '9', 4, 3600), sku('pack', '12', 4, 4500), sku('single', '12', 1, 1200)],
      tiers.slice(1),
    )
    expect(plan.map(describeSyncAction).sort()).toEqual([
      'Add the $14 4-pack at $56.00 (Lustre)',
      'Add the $14 single token at $14.00 (Lustre)',
      'Change the $12 4-pack from $45.00 to $48.00 (Ultimate)',
      'Remove the $9 4-pack — there is no $9 wash package',
    ])
  })
})

describe('featuredWashIndex — one "Most Popular" on the home page', () => {
  // The live CMS flags two packages at once.
  const cms = [
    { name: 'Deluxe', priceNumber: 10, featured: true },
    { name: 'Ultimate', priceNumber: 12, featured: false },
    { name: 'Lustre', priceNumber: 14, featured: true },
  ]

  it('follows the store: the wash whose token pack is featured in the admin', () => {
    expect(featuredWashIndex(cms, '12')).toBe(1)
  })

  it('falls back to the first CMS-flagged package — never two', () => {
    expect(featuredWashIndex(cms, null)).toBe(0)
    expect(featuredWashIndex(cms, '99')).toBe(0)
  })

  it('is none when nothing is flagged anywhere', () => {
    expect(featuredWashIndex([{ priceNumber: 10 }, { priceNumber: 12 }], undefined)).toBe(-1)
  })
})

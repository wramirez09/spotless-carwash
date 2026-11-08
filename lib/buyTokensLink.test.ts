import { describe, expect, it } from 'vitest'
import { initialPackFor, washCheckoutHref } from './buyTokensLink'

// A wash card on the home page sends the customer straight into checkout with
// that wash's pack already in the order.

const packs = [
  { id: 'spotless_pack_10', washValue: '10', tokens: 4 },
  { id: 'spotless_pack_12_x10', washValue: '12', tokens: 10 },
  { id: 'spotless_pack_12', washValue: '12', tokens: 4 },
  { id: 'spotless_pack_14', washValue: '14', tokens: 4 },
]

describe('washCheckoutHref', () => {
  it('links a wash to the buy page with its value', () => {
    expect(washCheckoutHref(12)).toBe('/buy-tokens?wash=12')
    expect(washCheckoutHref('14')).toBe('/buy-tokens?wash=14')
  })

  it('falls back to the plain buy page for a value it could not use', () => {
    expect(washCheckoutHref(Number.NaN)).toBe('/buy-tokens')
    expect(washCheckoutHref(9.5)).toBe('/buy-tokens')
  })
})

describe('initialPackFor', () => {
  it("opens with the wash's 4-pack — the pack the card advertises", () => {
    expect(initialPackFor(packs, { wash: '12' })).toBe('spotless_pack_12')
    expect(initialPackFor(packs, { wash: '14' })).toBe('spotless_pack_14')
  })

  it('takes another size of that wash when there is no 4-pack', () => {
    expect(initialPackFor(packs.filter((p) => p.id !== 'spotless_pack_12'), { wash: '12' })).toBe(
      'spotless_pack_12_x10',
    )
  })

  it('accepts an exact pack id', () => {
    expect(initialPackFor(packs, { pack: 'spotless_pack_12_x10' })).toBe('spotless_pack_12_x10')
  })

  it('keeps the page default for a wash not on sale, junk, or no link at all', () => {
    expect(initialPackFor(packs, { wash: '9' })).toBeNull()
    expect(initialPackFor(packs, { wash: 'abc' })).toBeNull()
    expect(initialPackFor(packs, { pack: 'spotless_pack_99' })).toBeNull()
    expect(initialPackFor(packs, {})).toBeNull()
  })

  it('uses the first value when a param is repeated', () => {
    expect(initialPackFor(packs, { wash: ['10', '12'] })).toBe('spotless_pack_10')
  })
})

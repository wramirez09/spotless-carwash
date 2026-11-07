import { describe, expect, it } from 'vitest'
import {
  fillDiscountCopy,
  fillFaqs,
  fillPricing,
  formatUSD,
  liveWashPriceCents,
  pricingFacts,
  type PricingFacts,
} from './pricingCopy'

// Customer-facing copy must quote what Stripe charges. These pin the
// placeholder grammar editors rely on, and the rewrite of literal numbers left
// in the CMS from before prices lived in Stripe.

const pack = (washValue: string, tokens: number, price: number, coupons: number[]) => ({
  washValue,
  tokens,
  price,
  save: coupons.reduce((a, b) => a + b, 0),
  coupons: coupons.map((amountOffCents) => ({ amountOffCents })),
})

const everyday = pricingFacts({
  packs: [pack('8', 4, 3200, [600]), pack('12', 4, 4800, [600]), pack('12', 10, 11000, [600])],
  singles: [
    { washValue: '8', price: 800 },
    { washValue: '12', price: 1150 },
  ],
  packCouponAmountOff: 600,
  activeSale: null,
})

describe('pricingFacts', () => {
  it('reads the everyday discount from the single chip', () => {
    expect(everyday.discountCents).toBe(600)
    expect(everyday.saleExtraCents).toBeNull()
  })

  it('splits a sale into the bundle part and the sale extra', () => {
    const facts = pricingFacts({
      packs: [pack('12', 4, 4800, [500, 700])],
      singles: [],
      packCouponAmountOff: 1200,
      activeSale: { id: 'x' },
    })
    expect(facts.discountCents).toBe(500)
    expect(facts.saleExtraCents).toBe(700)
  })
})

describe('fillPricing', () => {
  it('fills the discount', () => {
    expect(fillPricing('Save {discount} every pack', everyday)).toBe('Save $6 every pack')
  })

  it('falls back to the everyday discount for {saleDiscount} outside a sale', () => {
    expect(fillPricing('{saleDiscount}', everyday)).toBe('$6')
  })

  it('lists every pack at the price actually paid', () => {
    expect(fillPricing('{packPrices}', everyday)).toBe(
      '$8 wash 4-pack $26, $12 wash 4-pack $42 and $12 wash 10-pack $104',
    )
  })

  it('lists single tokens', () => {
    expect(fillPricing('{singlePrices}', everyday)).toBe('$8 token $8 and $12 token $11.50')
  })

  it('finds the cheapest per-wash price across packs', () => {
    // $26 / 4 = $6.50 beats $104 / 10 = $10.40 and $42 / 4.
    expect(fillPricing('{lowestPackPerWash}', everyday)).toBe('$6.50')
  })

  it('prices one named pack or token', () => {
    expect(fillPricing('{pack:12}', everyday)).toBe('$42')
    expect(fillPricing('{pack:12x10}', everyday)).toBe('$104')
    expect(fillPricing('{single:12}', everyday)).toBe('$11.50')
  })

  it('leaves a placeholder visible when it names something not on sale', () => {
    // A blank would read fine and say nothing; this gets noticed and fixed.
    expect(fillPricing('{pack:15} / {single:9} / {bogus}', everyday)).toBe(
      '{pack:15} / {single:9} / {bogus}',
    )
  })

  it('leaves list placeholders visible when nothing is on sale', () => {
    const empty: PricingFacts = { ...everyday, packs: [], singles: [] }
    expect(fillPricing('{packPrices} {singlePrices}', empty)).toBe('{packPrices} {singlePrices}')
  })

  it('does not touch text without placeholders', () => {
    expect(fillPricing('$4.00 for 5 minutes', everyday)).toBe('$4.00 for 5 minutes')
  })
})

describe('fillDiscountCopy', () => {
  it('rewrites a stale literal discount typed into the CMS', () => {
    expect(fillDiscountCopy('Save **$5** every wash.', everyday)).toBe('Save **$6** every wash.')
    expect(fillDiscountCopy('4-Pack · Save $5', everyday)).toBe('4-Pack · Save $6')
  })

  it('handles a placeholder and cents', () => {
    expect(fillDiscountCopy('Save {discount}', everyday)).toBe('Save $6')
    expect(fillDiscountCopy('Save $5.00', everyday)).toBe('Save $6')
  })

  it('can be pointed at the sale amount', () => {
    expect(fillDiscountCopy('Extra $5 off', everyday, 750)).toBe('Extra $7.50 off')
  })
})

describe('liveWashPriceCents', () => {
  it('is the price of one token of that value', () => {
    expect(liveWashPriceCents(12, everyday)).toBe(1150)
    expect(liveWashPriceCents('8', everyday)).toBe(800)
  })

  it('is null when no single token of that value is on sale', () => {
    expect(liveWashPriceCents(9, everyday)).toBeNull()
  })
})

describe('fillFaqs', () => {
  const builtIn = [
    { q: 'What does a wash token cost?', a: 'Packs: {packPrices}.' },
    { q: 'Do tokens expire?', a: 'No.' },
  ]

  it('replaces a stale CMS answer to a priced question with the live one', () => {
    const cms = [{ q: 'What does a wash token cost?', a: 'Tokens are 5 for $45, 10 for $85.' }]
    expect(fillFaqs(cms, builtIn, everyday)[0].a).toBe(
      'Packs: $8 wash 4-pack $26, $12 wash 4-pack $42 and $12 wash 10-pack $104.',
    )
  })

  it('matches the question loosely (case, punctuation)', () => {
    const cms = [{ q: 'what does a wash token cost', a: '$45' }]
    expect(fillFaqs(cms, builtIn, everyday)[0].a).toMatch(/^Packs:/)
  })

  it('respects a CMS answer that already uses placeholders', () => {
    const cms = [{ q: 'What does a wash token cost?', a: 'From {pack:8}.' }]
    expect(fillFaqs(cms, builtIn, everyday)[0].a).toBe('From $26.')
  })

  it('leaves unpriced questions alone', () => {
    const cms = [{ q: 'How do I use a self-serve bay?', a: '$4.00 for 5 minutes.' }]
    expect(fillFaqs(cms, builtIn, everyday)[0].a).toBe('$4.00 for 5 minutes.')
  })
})

describe('formatUSD', () => {
  it('drops cents on whole dollars only', () => {
    expect(formatUSD(500)).toBe('$5')
    expect(formatUSD(675)).toBe('$6.75')
  })
})

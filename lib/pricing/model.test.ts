// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  combinedCouponAmountCents,
  effectivePriceCents,
  priceSaveState,
  couponDrift,
  discountMetadata,
  findWindowConflict,
  formatCents,
  isProvisioned,
  parseDollarsToCents,
  pickActiveSale,
  saleEndLabel,
  saleState,
  slugify,
  type SaleRecord,
} from './model'

const HOUR = 3_600_000
const NOW = Date.UTC(2026, 7, 25, 12, 0, 0)

function makeSale(overrides: Partial<SaleRecord> = {}): SaleRecord {
  return {
    id: 'sale-1',
    slug: 'labor-day-2026',
    label: 'Labor Day',
    badge: 'LABOR DAY',
    emoji: '🛠️',
    endLabel: null,
    startMs: NOW - 24 * HOUR,
    endMs: NOW + 24 * HOUR,
    extraDiscountCents: 500,
    stripeCouponId: 'coupon_labor',
    stripeAmountOffCents: 1000,
    status: 'scheduled',
    ...overrides,
  }
}

describe('saleState', () => {
  it('is live inside the window', () => {
    expect(saleState(makeSale(), NOW)).toBe('live')
  })

  it('is live at both boundary instants', () => {
    // Inclusive on both ends — a customer at exactly 23:59:59 on the last day
    // is inside the sale the banner is advertising.
    const sale = makeSale()
    expect(saleState(sale, sale.startMs)).toBe('live')
    expect(saleState(sale, sale.endMs)).toBe('live')
  })

  it('is upcoming one ms before the window and ended one ms after', () => {
    const sale = makeSale()
    expect(saleState(sale, sale.startMs - 1)).toBe('upcoming')
    expect(saleState(sale, sale.endMs + 1)).toBe('ended')
  })

  it('reports draft and canceled regardless of the window', () => {
    // A canceled sale must never read as live, even mid-window — that is the
    // whole point of the "Stop now" button.
    expect(saleState(makeSale({ status: 'draft' }), NOW)).toBe('draft')
    expect(saleState(makeSale({ status: 'canceled' }), NOW)).toBe('canceled')
  })
})

describe('pickActiveSale', () => {
  it('returns null when nothing is running', () => {
    expect(pickActiveSale([makeSale({ status: 'draft' })], NOW)).toBeNull()
    expect(pickActiveSale([], NOW)).toBeNull()
  })

  it('ignores drafts and canceled sales inside the window', () => {
    const sales = [
      makeSale({ id: 'a', status: 'draft' }),
      makeSale({ id: 'b', status: 'canceled' }),
    ]
    expect(pickActiveSale(sales, NOW)).toBeNull()
  })

  it('prefers the most recently started sale when windows overlap', () => {
    const older = makeSale({ id: 'older', startMs: NOW - 48 * HOUR })
    const newer = makeSale({ id: 'newer', startMs: NOW - 2 * HOUR })
    expect(pickActiveSale([older, newer], NOW)?.id).toBe('newer')
    // Order of the input must not change the answer.
    expect(pickActiveSale([newer, older], NOW)?.id).toBe('newer')
  })

  it('breaks a same-start tie toward the bigger discount', () => {
    // Never show a customer the worse of two simultaneous offers.
    const small = makeSale({ id: 'small', extraDiscountCents: 300 })
    const big = makeSale({ id: 'big', extraDiscountCents: 900 })
    expect(pickActiveSale([small, big], NOW)?.id).toBe('big')
    expect(pickActiveSale([big, small], NOW)?.id).toBe('big')
  })
})

describe('findWindowConflict', () => {
  const existing = [makeSale({ id: 'existing' })]

  it('flags a window that overlaps a scheduled sale', () => {
    const candidate = {
      startMs: NOW,
      endMs: NOW + 48 * HOUR,
      status: 'scheduled' as const,
    }
    expect(findWindowConflict(candidate, existing)?.id).toBe('existing')
  })

  it('flags an overlap of a single instant', () => {
    const candidate = {
      startMs: existing[0].endMs,
      endMs: existing[0].endMs + HOUR,
      status: 'scheduled' as const,
    }
    expect(findWindowConflict(candidate, existing)).not.toBeNull()
  })

  it('allows a window that starts after the other ends', () => {
    const candidate = {
      startMs: existing[0].endMs + 1,
      endMs: existing[0].endMs + HOUR,
      status: 'scheduled' as const,
    }
    expect(findWindowConflict(candidate, existing)).toBeNull()
  })

  it('never conflicts with itself when editing', () => {
    const candidate = {
      id: 'existing',
      startMs: NOW,
      endMs: NOW + 48 * HOUR,
      status: 'scheduled' as const,
    }
    expect(findWindowConflict(candidate, existing)).toBeNull()
  })

  it('lets a draft overlap freely', () => {
    // Preparing next year's sale must not be blocked by this year's.
    const candidate = { startMs: NOW, endMs: NOW + HOUR, status: 'draft' as const }
    expect(findWindowConflict(candidate, existing)).toBeNull()
  })

  it('ignores drafts and canceled sales as conflict sources', () => {
    const candidate = { startMs: NOW, endMs: NOW + HOUR, status: 'scheduled' as const }
    expect(
      findWindowConflict(candidate, [makeSale({ id: 'd', status: 'draft' })]),
    ).toBeNull()
    expect(
      findWindowConflict(candidate, [makeSale({ id: 'c', status: 'canceled' })]),
    ).toBeNull()
  })
})

describe('couponDrift', () => {
  it('is null when the coupon matches the current base discount', () => {
    expect(couponDrift(makeSale(), { baseDiscountCents: 500, baseCouponId: null })).toBeNull()
  })

  it('reports the gap after the base discount changes', () => {
    // $5 base + $5 sale was provisioned as $10; raising the base to $6 means
    // the coupon should now be $11.
    expect(couponDrift(makeSale(), { baseDiscountCents: 600, baseCouponId: null })).toEqual({
      expected: 1100,
      actual: 1000,
    })
  })

  it('is null for a sale that was never provisioned', () => {
    const sale = makeSale({ stripeAmountOffCents: null, stripeCouponId: null })
    expect(couponDrift(sale, { baseDiscountCents: 600, baseCouponId: null })).toBeNull()
  })
})

describe('combinedCouponAmountCents', () => {
  it('sums the base bundle discount and the sale discount', () => {
    // Stripe applies one coupon per session, so the sale coupon must carry
    // both — this is the number written to Stripe.
    expect(combinedCouponAmountCents(500, 500)).toBe(1000)
  })
})

describe('discountMetadata', () => {
  it('matches the format the existing orders were written with', () => {
    // The webhook and revenue reporting read this value, so the shape is
    // load-bearing: '10_off_labor_day_2026'.
    expect(discountMetadata(makeSale(), 500)).toBe('10_off_labor_day_2026')
  })
})

describe('saleEndLabel', () => {
  it('prefers a stored override', () => {
    expect(saleEndLabel(makeSale({ endLabel: 'Labor Day itself' }))).toBe('Labor Day itself')
  })

  it('falls back to the formatted end date when blank', () => {
    const sale = makeSale({ endLabel: '   ', endMs: Date.UTC(2026, 8, 8, 4, 59, 59) })
    expect(saleEndLabel(sale)).toBe('Mon, Sep 7')
  })
})

describe('isProvisioned', () => {
  it('is true only with a Stripe coupon attached', () => {
    expect(isProvisioned(makeSale())).toBe(true)
    expect(isProvisioned(makeSale({ stripeCouponId: null }))).toBe(false)
  })
})

describe('parseDollarsToCents', () => {
  it.each([
    ['32', 3200],
    ['32.5', 3250],
    ['32.50', 3250],
    ['$32.50', 3250],
    ['1,032.50', 103250],
    ['  8  ', 800],
    ['0.05', 5],
  ])('parses %s', (input, expected) => {
    expect(parseDollarsToCents(input)).toBe(expected)
  })

  it.each([
    ['', 'empty'],
    ['abc', 'not a number'],
    ['-5', 'negative'],
    ['32.555', 'sub-cent precision'],
    ['1e3', 'exponent notation'],
    ['.5', 'no leading digit'],
  ])('rejects %s (%s)', (input) => {
    expect(parseDollarsToCents(input)).toBeNull()
  })
})

describe('slugify', () => {
  it.each([
    ['Labor Day 2026', 'labor-day-2026'],
    ["Father's Day", 'father-s-day'],
    ['  Spring   Sale  ', 'spring-sale'],
    ['Été', 'ete'],
  ])('%s -> %s', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })

  it('caps the length so it stays usable as an identifier', () => {
    expect(slugify('a'.repeat(200)).length).toBe(60)
  })
})

describe('formatCents', () => {
  it('always renders two decimal places', () => {
    expect(formatCents(500)).toBe('$5.00')
    expect(formatCents(3250)).toBe('$32.50')
  })
})

// ---------------------------------------------------------------------------
// Admin price-row state
// ---------------------------------------------------------------------------

describe('effectivePriceCents', () => {
  it('uses the server value when nothing has been saved here', () => {
    expect(effectivePriceCents(4800, null)).toBe(4800)
  })

  it('prefers the just-saved value while the server still reports the old one', () => {
    // The reported bug: save $9.00, the row keeps showing $10.00 because the
    // re-render hit an instance whose cache had not expired.
    expect(effectivePriceCents(1000, { from: 1000, to: 900 })).toBe(900)
  })

  it('falls back to the server once it agrees', () => {
    expect(effectivePriceCents(900, { from: 1000, to: 900 })).toBe(900)
  })

  it('defers to the server when the price changed somewhere else', () => {
    // Someone else edited it, or Stripe was changed directly. Our stale save
    // must not mask a newer value.
    expect(effectivePriceCents(1200, { from: 1000, to: 900 })).toBe(1200)
  })

  it('handles a SKU that had no price before the save', () => {
    expect(effectivePriceCents(null, { from: null, to: 900 })).toBe(900)
  })

  it('passes through a null with no pending save', () => {
    expect(effectivePriceCents(null, null)).toBeNull()
  })
})

describe('priceSaveState', () => {
  const base = { rawValue: '48.00', typedCents: 4800, effectiveCents: 4800, pending: false }

  it('blocks a value identical to the current price, and says so', () => {
    // Every save mints a new Stripe Price, so a no-op write is not free.
    expect(priceSaveState(base)).toEqual({
      canSave: false,
      reason: 'Same as the current price',
    })
  })

  it('allows a genuine change', () => {
    expect(priceSaveState({ ...base, rawValue: '45.00', typedCents: 4500 })).toEqual({
      canSave: true,
      reason: null,
    })
  })

  it('treats the just-saved amount as current, so Save does not re-arm', () => {
    // This is the screenshot bug: server says 1000, we saved 900. Comparing
    // against the server would leave Save enabled and invite a duplicate.
    const effective = effectivePriceCents(1000, { from: 1000, to: 900 })
    expect(priceSaveState({
      rawValue: '9.00',
      typedCents: 900,
      effectiveCents: effective,
      pending: false,
    })).toEqual({ canSave: false, reason: 'Same as the current price' })
  })

  it('re-arms Save when the value is edited again after a save', () => {
    const effective = effectivePriceCents(1000, { from: 1000, to: 900 })
    expect(priceSaveState({
      rawValue: '8.50',
      typedCents: 850,
      effectiveCents: effective,
      pending: false,
    }).canSave).toBe(true)
  })

  it('prompts for an amount when the field is empty', () => {
    expect(priceSaveState({ ...base, rawValue: '', typedCents: null })).toEqual({
      canSave: false,
      reason: 'Enter an amount',
    })
  })

  it('treats whitespace as empty', () => {
    expect(priceSaveState({ ...base, rawValue: '   ', typedCents: null }).reason).toBe(
      'Enter an amount',
    )
  })

  it.each(['32.', 'abc', '-5', '32.555'])(
    'reports %s as an invalid amount rather than silently disabling',
    (rawValue) => {
      expect(priceSaveState({ ...base, rawValue, typedCents: null })).toEqual({
        canSave: false,
        reason: 'Not a valid amount',
      })
    },
  )

  it('blocks while a save is in flight, with no reason text', () => {
    // The button already reads "Saving…"; a hint underneath would be noise.
    expect(priceSaveState({ ...base, typedCents: 4500, pending: true })).toEqual({
      canSave: false,
      reason: null,
    })
  })

  it('allows the first price for a SKU that has none', () => {
    expect(priceSaveState({
      rawValue: '9.00',
      typedCents: 900,
      effectiveCents: null,
      pending: false,
    })).toEqual({ canSave: true, reason: null })
  })

  it('never reports a reason when it allows saving', () => {
    const s = priceSaveState({ ...base, typedCents: 1 })
    expect(s.canSave).toBe(true)
    expect(s.reason).toBeNull()
  })
})

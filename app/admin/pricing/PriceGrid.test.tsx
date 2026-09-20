// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

// The server actions reach for the Supabase session; stub the module so the
// grid can render outside a request.
vi.mock('./actions', () => ({
  setPrice: vi.fn(),
  adoptSkuFromStripe: vi.fn(),
}))

import PriceGrid, { type PriceRowView } from './PriceGrid'

function row(over: Partial<PriceRowView> = {}): PriceRowView {
  return {
    kind: 'pack',
    washValue: '12',
    cents: 4800,
    stripePriceId: 'price_abc',
    source: 'stripe',
    ...over,
  }
}

const html = (rows: PriceRowView[]) => renderToStaticMarkup(<PriceGrid rows={rows} />)

describe('PriceGrid — initial state', () => {
  it('shows the current price', () => {
    expect(html([row()])).toContain('$48.00')
  })

  it('prefills the input with the current price', () => {
    expect(html([row()])).toContain('value="48.00"')
  })

  it('disables Save, because nothing has been changed yet', () => {
    expect(html([row()])).toMatch(/<button[^>]*type="submit"[^>]*disabled/)
  })

  it('explains WHY Save is disabled rather than just greying out', () => {
    // A silent disabled button reads as broken — this is the whole point of
    // the hint. Typing a value back to what it was lands in this same state.
    expect(html([row()])).toContain('Same as the current price')
  })

  it('offers no Reset until the field is actually edited', () => {
    expect(html([row()])).not.toContain('Reset')
  })

  it('prompts for an amount when the SKU has no price yet', () => {
    const markup = html([row({ cents: null })])
    expect(markup).toContain('Not set')
    expect(markup).toContain('Enter an amount')
  })
})

describe('PriceGrid — price source', () => {
  it('shows the Stripe price id when Stripe is authoritative', () => {
    expect(html([row()])).toContain('price_abc')
  })

  it('flags a SKU still resolving from deploy config', () => {
    const markup = html([row({ source: 'env' })])
    expect(markup).toContain('From deploy config')
    expect(markup).toContain('Read this price from Stripe')
  })

  it('offers adoption for a db-sourced SKU whose Product is not keyed', () => {
    expect(html([row({ source: 'db' })])).toContain('Read this price from Stripe')
  })

  it('does not offer adoption once Stripe is authoritative', () => {
    expect(html([row()])).not.toContain('Read this price from Stripe')
  })

  it('shows the per-token price for packs only', () => {
    expect(html([row()])).toContain('$12.00') // 4800 / 4
    expect(html([row({ kind: 'single', cents: 1200 })])).not.toContain('/ wash')
  })
})

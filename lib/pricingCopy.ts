// Live prices for customer-facing COPY.
//
// Prices that Stripe owns (token packs, single tokens, the bundle discount, a
// sale's extra discount) must never be typed into the CMS or the code as
// literal numbers — the admin can change any of them at /admin/pricing, and a
// typed number silently goes stale. Copy names them with placeholders instead,
// and this module fills them in from the same pricing the checkout uses.
//
// Pure (no Stripe, no `server-only`) so every rule here is unit-tested.
//
// Placeholders:
//   {discount}          everyday bundle discount per pack, e.g. "$5"
//   {saleDiscount}      a running sale's extra discount (the bundle discount
//                       when no sale is running)
//   {packPrices}        every pack with its price, e.g. "$8 wash 4-pack $27, …"
//   {singlePrices}      every single token with its price
//   {lowestPackPerWash} cheapest per-wash price across packs, e.g. "$6.75"
//   {pack:12}           price you pay for the $12 4-pack (discount applied)
//   {pack:12x10}        …the $12 10-pack
//   {single:12}         price of one $12 token
//
// An unknown placeholder, or one naming an item that isn't on sale, is left
// visible on purpose ("{pack:15}") so an editor spots it, rather than being
// silently swallowed into a sentence that reads fine but says nothing.

export type PricingFacts = {
  /** Everyday bundle discount per pack, cents. */
  discountCents: number
  /** Extra discount of the live sale, cents; null outside a sale. */
  saleExtraCents: number | null
  packs: { washValue: string; tokens: number; price: number; save: number }[]
  singles: { washValue: string; price: number }[]
}

/** The subset of CheckoutPricing this module reads. */
type PricingLike = {
  packs: {
    washValue: string
    tokens: number
    price: number
    save: number
    coupons: { amountOffCents: number }[]
  }[]
  singles: { washValue: string; price: number }[]
  packCouponAmountOff: number
  activeSale: unknown | null
}

/** "$5" for whole dollars, "$6.75" otherwise. */
export function formatUSD(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`
}

export function pricingFacts(pricing: PricingLike): PricingFacts {
  // During a sale the first chip is the bundle part and the second the sale's
  // extra (see splitCouponBreakdown in lib/stripePricing.ts); outside one the
  // single chip is the whole, everyday discount.
  const chips = pricing.packs[0]?.coupons ?? []
  const total = pricing.packCouponAmountOff
  const onSale = pricing.activeSale != null
  const split = onSale && chips.length === 2
  return {
    discountCents: split ? chips[0].amountOffCents : total,
    saleExtraCents: onSale ? (split ? chips[1].amountOffCents : total) : null,
    packs: pricing.packs.map(({ washValue, tokens, price, save }) => ({
      washValue,
      tokens,
      price,
      save,
    })),
    singles: pricing.singles.map(({ washValue, price }) => ({ washValue, price })),
  }
}

const net = (p: { price: number; save: number }) => Math.max(0, p.price - p.save)

function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join('')
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

const PLACEHOLDER_RE = /\{([a-zA-Z]+)(?::([0-9]+)(?:x([0-9]+))?)?\}/g

/** Replace every pricing placeholder in `text` with its live value. */
export function fillPricing(text: string, facts: PricingFacts): string {
  if (!text || !text.includes('{')) return text
  return text.replace(PLACEHOLDER_RE, (whole, name: string, value?: string, size?: string) => {
    switch (name) {
      case 'discount':
        return formatUSD(facts.discountCents)
      case 'saleDiscount':
        return formatUSD(facts.saleExtraCents ?? facts.discountCents)
      case 'packPrices': {
        if (facts.packs.length === 0) return whole
        return listJoin(
          facts.packs.map((p) => `$${p.washValue} wash ${p.tokens}-pack ${formatUSD(net(p))}`),
        )
      }
      case 'singlePrices': {
        if (facts.singles.length === 0) return whole
        return listJoin(facts.singles.map((s) => `$${s.washValue} token ${formatUSD(s.price)}`))
      }
      case 'lowestPackPerWash': {
        if (facts.packs.length === 0) return whole
        const lowest = Math.min(...facts.packs.map((p) => Math.round(net(p) / p.tokens)))
        return formatUSD(lowest)
      }
      case 'pack': {
        if (!value) return whole
        const tokens = size ? Number(size) : 4
        const p = facts.packs.find((x) => x.washValue === value && x.tokens === tokens)
        return p ? formatUSD(net(p)) : whole
      }
      case 'single': {
        if (!value || size) return whole
        const s = facts.singles.find((x) => x.washValue === value)
        return s ? formatUSD(s.price) : whole
      }
      default:
        return whole
    }
  })
}

/**
 * For copy fields whose ONLY dollar figure has always been the bundle
 * discount (the token headline, its description, the "4-Pack · Save $5"
 * toggle): rewrite any literal amount to the live discount.
 *
 * This exists because those fields were written into the CMS as "$5" before
 * the discount was editable, and the live site must not wait on someone
 * re-typing them. Placeholders are filled first, so a field already converted
 * to `{discount}` is unaffected.
 */
export function fillDiscountCopy(
  text: string,
  facts: PricingFacts,
  amountCents: number = facts.discountCents,
): string {
  const filled = fillPricing(text, facts)
  return filled.replace(/\$\d+(?:\.\d{2})?(?!\d)/g, formatUSD(amountCents))
}

/**
 * What one wash costs, from Stripe: the price of a single token of that
 * denomination. Null when no single token of that value is on sale — callers
 * keep their CMS-entered price in that case.
 */
export function liveWashPriceCents(washValue: number | string, facts: PricingFacts): number | null {
  const v = String(Number(washValue))
  return facts.singles.find((s) => s.washValue === v)?.price ?? null
}

const HAS_PLACEHOLDER = /\{[a-zA-Z]+(?::[0-9x]+)?\}/
const normQuestion = (q: string) => q.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/**
 * FAQ answers with live prices.
 *
 * A CMS answer that uses placeholders is filled and used as written. A CMS
 * answer to one of the priced questions in the built-in FAQ that still quotes
 * literal numbers (written before prices lived in Stripe) is replaced by the
 * built-in, placeholder-driven answer — otherwise the FAQ would keep quoting
 * packs that no longer exist until someone noticed and re-typed it. Every
 * other answer passes through untouched.
 */
export function fillFaqs<T extends { q: string; a: string }>(
  faqs: readonly T[],
  builtIn: readonly { q: string; a: string }[],
  facts: PricingFacts,
): T[] {
  const priced = new Map(
    builtIn.filter((f) => HAS_PLACEHOLDER.test(f.a)).map((f) => [normQuestion(f.q), f.a]),
  )
  return faqs.map((f) => {
    const ours = priced.get(normQuestion(f.q))
    const a = !HAS_PLACEHOLDER.test(f.a) && ours ? ours : f.a
    return { ...f, a: fillPricing(a, facts) }
  })
}

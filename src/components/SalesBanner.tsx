import Link from 'next/link'
import { getPricingSnapshot } from '@/lib/pricingStore'
import { pickActiveSale, saleEndLabel } from '@/lib/pricing/model'

function formatUSD(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`
}

// Async server component: the banner renders in the root layout, so it reads
// through the pricing store's cache rather than hitting Supabase per request.
export default async function SalesBanner() {
  const { sales, settings } = await getPricingSnapshot()
  const sale = pickActiveSale(sales)
  // Advertise the real numbers. Hardcoded "$5 OFF" copy was correct only for
  // as long as the discount stayed $5 — which is exactly what /admin/pricing
  // now lets someone change without touching this file.
  const baseOff = formatUSD(settings.baseDiscountCents)
  const extraOff = sale ? formatUSD(sale.extraDiscountCents) : null

  return (
    <aside className="sale-banner" role="region" aria-label="Promotional banner">
      <div className="sale-inner">
        <span className="sale-tag">
          <span className="tie" aria-hidden>
            {sale ? (
              sale.emoji
            ) : (
              // Inline SVG sparkle that inherits `--sale-ink` (dark) via
              // currentColor, so it renders with full contrast against the
              // yellow badge — the previous '✨' emoji rendered yellow-on-yellow.
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
                <path d="M12 2.5l1.9 5.85a3 3 0 0 0 1.9 1.9L21.5 12l-5.85 1.9a3 3 0 0 0-1.9 1.9L12 21.5l-1.9-5.85a3 3 0 0 0-1.9-1.9L2.5 12l5.85-1.9a3 3 0 0 0 1.9-1.9L12 2.5z" />
              </svg>
            )}
          </span>
          {sale ? sale.badge : 'ALWAYS ON'}
        </span>

        {sale ? (
          <span className="sale-msg">
            Extra <b>{extraOff} OFF</b> every 4-pack
            <span className="sep">·</span>
            Now through {saleEndLabel(sale)}
          </span>
        ) : (
          <span className="sale-msg">
            <b>{baseOff} OFF</b> every 4-pack
            <span className="sep">·</span>
            Auto-applied at checkout
          </span>
        )}

        <Link href="/buy-tokens" className="sale-cta">
          SHOP TOKENS
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </aside>
  )
}

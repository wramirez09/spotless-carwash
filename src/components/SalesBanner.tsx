import Link from 'next/link'
import { isFathersDaySaleActive } from '@/lib/salesSchedule'

export default function SalesBanner() {
  const fathersDay = isFathersDaySaleActive()

  return (
    <aside className="sale-banner" role="region" aria-label="Promotional banner">
      <div className="sale-inner">
        <span className="sale-tag">
          <span className="tie" aria-hidden>
            {fathersDay ? '👔' : '✨'}
          </span>
          {fathersDay ? "FATHER'S DAY" : 'ALWAYS ON'}
        </span>

        {fathersDay ? (
          <span className="sale-msg">
            Extra <b>$5 OFF</b> every 4-pack
            <span className="sep">·</span>
            Now through Sun, Jun 21
          </span>
        ) : (
          <span className="sale-msg">
            <b>$5 OFF</b> every 4-pack
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

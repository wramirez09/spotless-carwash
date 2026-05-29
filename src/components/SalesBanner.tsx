import Link from 'next/link'
import { isFathersDaySaleActive } from '@/lib/salesSchedule'

export default function SalesBanner() {
  const fathersDay = isFathersDaySaleActive()

  return (
    <aside className="sale-banner" role="region" aria-label="Promotional banner">
      <div className="sale-inner">
        <span className="sale-tag">
          <span className="tie" aria-hidden>
            {fathersDay ? (
              '👔'
            ) : (
              // Inline SVG sparkle that inherits `--sale-ink` (dark) via
              // currentColor, so it renders with full contrast against the
              // yellow badge — the previous '✨' emoji rendered yellow-on-yellow.
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
                <path d="M12 2.5l1.9 5.85a3 3 0 0 0 1.9 1.9L21.5 12l-5.85 1.9a3 3 0 0 0-1.9 1.9L12 21.5l-1.9-5.85a3 3 0 0 0-1.9-1.9L2.5 12l5.85-1.9a3 3 0 0 0 1.9-1.9L12 2.5z" />
              </svg>
            )}
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

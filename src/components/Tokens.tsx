import Link from 'next/link'
import { sanityFetch } from '@/lib/sanityFetch'
import { renderHighlight } from '@/lib/renderHighlight'
import { getCheckoutPricing } from '@/lib/stripePricing'
import { isFathersDaySaleActive } from '@/lib/salesSchedule'

type TokensCopy = {
  eyebrow: string
  sectionNumber: string
  headlineLine1: string
  headlineLine2: string
  valueLine: string
  description: string
  cta: { label: string; href: string }
  unitLabel: string
  saleEyebrow: string
  saleHeadline: string
}

const COPY_QUERY = `*[_type == "tokens"][0]{
  eyebrow, sectionNumber,
  headlineLine1, headlineLine2,
  valueLine, description,
  cta{ label, href }
}`

const FALLBACK: TokensCopy = {
  eyebrow: 'Wash tokens',
  sectionNumber: '07',
  headlineLine1: 'Buy a 4-pack.',
  headlineLine2: 'Save **$5** every wash.',
  valueLine: '4 tokens per pack. Never expires. Works at both locations.',
  description:
    'Prepaid wash tokens save you $5 per 4-pack. Keep them in your glovebox, skip the cash station — and they make a great Forest Park gift.',
  cta: { label: 'Buy tokens', href: '/buy-tokens' },
  unitLabel: '/ wash · 4-pack',
  saleEyebrow: "Father's Day sale",
  saleHeadline: 'Extra **$5 off** every 4-pack.',
}

function formatUSD(cents: number): string {
  if (cents % 100 === 0) return `$${cents / 100}`
  return `$${(cents / 100).toFixed(2)}`
}

export default async function Tokens() {
  const [copyData, pricing] = await Promise.all([
    sanityFetch<Partial<TokensCopy>>(COPY_QUERY),
    getCheckoutPricing(),
  ])
  const fathersDayActive = pricing.fathersDayActive || isFathersDaySaleActive()

  const t: TokensCopy = {
    ...FALLBACK,
    ...(copyData ?? {}),
    cta: { ...FALLBACK.cta, ...(copyData?.cta ?? {}) },
  }

  const packsDesc = [...pricing.packs].sort((a, b) => Number(b.id) - Number(a.id))

  return (
    <section id="tokens" className="pb-16 md:pb-24">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7">
        <div
          className="rounded-[28px] p-8 md:p-16 grid md:grid-cols-2 gap-10 md:gap-15 items-center relative overflow-hidden text-white"
          style={{ background: 'linear-gradient(135deg,#1B4FD9 0%,#0A2A6B 100%)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 90% 10%,rgba(255,217,61,.2),transparent 50%)',
            }}
          />
          <div className="relative flex flex-col justify-center h-full">
            {fathersDayActive && (
              <span className="inline-flex self-start items-center gap-2 bg-yellow-400 text-blue-700 text-[11px] font-extrabold tracking-[0.18em] uppercase rounded-full px-3 py-1.5 mb-4 shadow-[0_8px_18px_rgba(0,0,0,.25)]">
                <span aria-hidden>👔</span> {t.saleEyebrow} · Now on
              </span>
            )}
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-yellow-400 mb-2.5">
              <span className="mono text-blue-200 font-medium">{t.sectionNumber} /</span> {t.eyebrow}
            </div>
            <h2 className="display text-[40px] sm:text-[56px] md:text-[68px] m-0 mb-4 leading-[1.02]">
              {fathersDayActive ? (
                renderHighlight(t.saleHeadline, 'text-yellow-400')
              ) : (
                <>
                  {t.headlineLine1}
                  <br />
                  {renderHighlight(t.headlineLine2, 'text-yellow-400')}
                </>
              )}
            </h2>
            <p className="text-yellow-400 font-bold leading-relaxed max-w-[440px] mb-3">
              {t.valueLine}
            </p>
            <p className="text-blue-100 leading-relaxed max-w-[440px] mb-7">{t.description}</p>
            <Link
              href={t.cta.href}
              className="self-start inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full font-bold text-[15px] bg-yellow-400 text-blue-700 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(255,217,61,.35)] transition"
            >
              {t.cta.label}
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          <div className="relative flex flex-col gap-3.5 items-stretch md:items-end justify-center">
            {packsDesc.map((pack) => {
              const coupons = pack.coupons
              const finalCents = Math.max(0, pack.price - pack.save)
              const hasDiscount = pack.save > 0
              return (
                <div
                  key={pack.id}
                  className="bg-yellow-400 text-blue-700 rounded-[22px] px-5 py-4 md:px-6 md:py-[18px] shadow-[0_12px_30px_rgba(0,0,0,.3)] w-full md:w-auto md:min-w-[420px]"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="display text-[30px] md:text-[34px] leading-none pr-3 md:pr-4 border-r-2 border-blue-700">
                      ${pack.id}
                    </span>
                    <span className="text-[11px] md:text-[13px] font-extrabold tracking-[0.08em] uppercase whitespace-nowrap leading-tight">
                      {t.unitLabel}
                    </span>
                    <span className="ml-auto flex flex-col items-end leading-none">
                      {hasDiscount && (
                        <span className="text-[12px] md:text-[13px] font-semibold text-blue-700/60 line-through mb-1">
                          {formatUSD(pack.price)}
                        </span>
                      )}
                      <span className="display text-[26px] md:text-[30px] leading-none">
                        {formatUSD(finalCents)}
                      </span>
                    </span>
                  </div>
                  {coupons.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-700/20 flex flex-wrap gap-1.5">
                      {coupons.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1.5 bg-blue-700 text-yellow-400 text-[10px] md:text-[11px] font-extrabold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                            <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
                          </svg>
                          {c.label} −{formatUSD(c.amountOffCents)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

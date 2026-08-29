import Link from 'next/link'
import { sanityFetch } from '@/lib/sanityFetch'
import { renderHighlight } from '@/lib/renderHighlight'
import {
  DEFAULT_SUBSCRIPTION_WASH_VALUE,
  getSubscriptionPricing,
} from '@/lib/subscriptionPricing'

type SubscriptionCopy = {
  eyebrow: string
  sectionNumber: string
  headlineLine1: string
  headlineLine2: string
  valueLine: string
  description: string
  cta: { label: string; href: string }
  perMonthSuffix: string
  perWashSuffix: string
  tokensSuffix: string
  mostPopularLabel: string
  footnote: string
}

const COPY_QUERY = `*[_type == "subscriptionSection"][0]{
  eyebrow, sectionNumber,
  headlineLine1, headlineLine2,
  valueLine, description,
  cta{ label, href },
  perMonthSuffix, perWashSuffix, tokensSuffix,
  mostPopularLabel, footnote
}`

const FALLBACK: SubscriptionCopy = {
  eyebrow: 'Wash club',
  sectionNumber: '08',
  headlineLine1: 'Never buy tokens',
  headlineLine2: 'again.',
  valueLine: 'Tokens in your mailbox every month. Cancel anytime.',
  description:
    'Pick how many washes you want a month and we mail the tokens to you. Nothing to reorder, nothing to remember — and they still never expire.',
  cta: { label: 'See the plans', href: '/buy-tokens/subscribe' },
  perMonthSuffix: '/ mo',
  perWashSuffix: 'per wash',
  tokensSuffix: 'tokens a month',
  mostPopularLabel: 'Most Popular',
  footnote:
    'Prices shown for the $12 Lustre wash — choose any wash tier when you sign up.',
}

function formatUSD(cents: number): string {
  if (cents % 100 === 0) return `$${cents / 100}`
  return `$${(cents / 100).toFixed(2)}`
}

export default async function Subscription() {
  const [copyData, pricing] = await Promise.all([
    sanityFetch<Partial<SubscriptionCopy>>(COPY_QUERY),
    getSubscriptionPricing(),
  ])

  const t: SubscriptionCopy = {
    ...FALLBACK,
    ...(copyData ?? {}),
    cta: { ...FALLBACK.cta, ...(copyData?.cta ?? {}) },
  }

  // The home section advertises a single denomination so the three plans are
  // comparable at a glance; the picker on /buy-tokens/subscribe is where the
  // customer chooses. Keep this in step with the page's default.
  const plans = pricing.plans.map((plan) => ({
    ...plan,
    variant:
      plan.variants.find((v) => v.washValue === DEFAULT_SUBSCRIPTION_WASH_VALUE) ??
      plan.variants[plan.variants.length - 1],
  }))

  return (
    <section id="subscription" className="pb-16 md:pb-24">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7">
        <div className="rounded-[28px] border-[3px] border-blue-700 bg-white p-8 md:p-14">
          <div className="grid md:grid-cols-[1fr_1.15fr] gap-10 md:gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2.5">
                <span className="mono text-[#9aa9c9] font-medium">
                  {t.sectionNumber} /
                </span>{' '}
                {t.eyebrow}
              </div>
              <h2 className="display text-[40px] sm:text-[56px] md:text-[64px] m-0 mb-4 leading-[1.02] text-ink">
                {t.headlineLine1}
                <br />
                {renderHighlight(t.headlineLine2, 'text-blue-500')}
              </h2>
              <p className="text-blue-700 font-bold leading-relaxed max-w-[440px] mb-3">
                {t.valueLine}
              </p>
              <p className="text-[#5B6B8C] leading-relaxed max-w-[440px] mb-7">
                {t.description}
              </p>
              <Link
                href={t.cta.href}
                className="self-start inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full font-bold text-[15px] bg-blue-700 text-white hover:-translate-y-px hover:bg-blue-500 hover:shadow-[0_8px_24px_rgba(10,42,107,.28)] transition"
              >
                {t.cta.label}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>

            <div>
              <ul className="grid gap-3 list-none m-0 p-0">
                {plans.map((plan) => (
                  <li
                    key={plan.id}
                    className={`relative flex items-center justify-between gap-4 rounded-2xl border-2 p-5 ${
                      plan.featured
                        ? 'border-blue-500 bg-paper2'
                        : 'border-line bg-white'
                    }`}
                  >
                    {plan.featured && (
                      <span className="absolute -top-2.5 left-5 rounded-full bg-yellow-400 px-2.5 py-1 mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-700">
                        {t.mostPopularLabel}
                      </span>
                    )}
                    <div>
                      <div className="display text-[22px] leading-none text-ink">
                        {plan.name}
                      </div>
                      <div className="mt-1.5 mono text-[11px] uppercase tracking-[0.14em] text-[#9aa9c9]">
                        {plan.tokensPerCycle} {t.tokensSuffix}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="display text-[30px] leading-none text-blue-700">
                        {formatUSD(plan.variant.price)}
                        <span className="mono text-[11px] uppercase tracking-[0.12em] text-[#9aa9c9]">
                          {' '}
                          {t.perMonthSuffix}
                        </span>
                      </div>
                      <div className="mono text-[10px] uppercase tracking-[0.14em] text-[#9aa9c9] mt-1">
                        {formatUSD(plan.variant.perToken)} {t.perWashSuffix}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[12px] leading-relaxed text-[#9aa9c9]">
                {t.footnote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

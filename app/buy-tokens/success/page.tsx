import type { Metadata } from 'next'
import Link from 'next/link'
import Stripe from 'stripe'
import { sanityFetch } from '@/lib/sanityFetch'
import { getStripeSecretKey } from '@/lib/stripeEnv'

type Copy = {
  metaTitle: string
  metaDescription: string
  ribbonText: string
  breadcrumbHome: string
  breadcrumbBuyTokens: string
  breadcrumbCurrent: string
  headingPrefix: string
  headingHighlight: string
  headingSuffix: string
  subheadWithEmailTemplate: string
  subheadWithoutEmail: string
  subheadFallback: string
  nextStepsHeading: string
  nextSteps: { n: string; body: string }[]
  rooseveltKicker: string
  rooseveltAddress: string
  rooseveltHours: string
  madisonKicker: string
  madisonAddress: string
  madisonHours: string
  locationLinkLabel: string
  supportPrefix: string
  supportPhoneDisplay: string
  supportSuffix: string
  receiptHeading: string
  receiptPaidBadge: string
  packSingular: string
  packPlural: string
  totalLabel: string
  noLineItemsMessage: string
  backToHomeLabel: string
}

const FALLBACK: Copy = {
  metaTitle: 'Payment complete',
  metaDescription: 'Your wash tokens are on the way.',
  ribbonText: 'Payment confirmed · Tokens on the way',
  breadcrumbHome: 'Home',
  breadcrumbBuyTokens: 'Buy tokens',
  breadcrumbCurrent: 'Complete',
  headingPrefix: "You're set on",
  headingHighlight: 'tokens',
  headingSuffix: '.',
  subheadWithEmailTemplate:
    'Thanks, {email}. Your token codes will arrive by email within 1 minute. Save the email or print it — bring it to either Forest Park location to swap for physical tokens at the cash station.',
  subheadWithoutEmail:
    'Thanks. Your token codes will arrive by email within 1 minute. Save the email or print it — bring it to either Forest Park location to swap for physical tokens at the cash station.',
  subheadFallback:
    'Your order is confirmed. Token codes will arrive at the email you used at checkout within 1 minute.',
  nextStepsHeading: 'What happens next',
  nextSteps: [
    { n: '01', body: 'Check your inbox for token codes (look for info@spotlessautowash.com).' },
    { n: '02', body: 'Drive up to any automatic bay at either Forest Park location.' },
    {
      n: '03',
      body:
        'Show your code at the cash station for a physical token, or use the code directly if your bay supports keypad entry.',
    },
  ],
  rooseveltKicker: 'Roosevelt Rd',
  rooseveltAddress: '7343 Roosevelt Rd',
  rooseveltHours: 'Open 24h · automatic bay',
  madisonKicker: 'Madison St',
  madisonAddress: '7802 Madison St',
  madisonHours: '7am–10pm daily',
  locationLinkLabel: 'See location →',
  supportPrefix: "Didn't get the email after 5 minutes? Check spam, then call",
  supportPhoneDisplay: '(708) 771-2945',
  supportSuffix: "and we'll get it resent.",
  receiptHeading: 'Receipt',
  receiptPaidBadge: 'Paid',
  packSingular: 'pack',
  packPlural: 'packs',
  totalLabel: 'Total',
  noLineItemsMessage:
    'Your order is on file. Receipt details are available in the confirmation email Stripe sent.',
  backToHomeLabel: 'Back to home',
}

const QUERY = `*[_type == "buyTokensSuccessPage"][0]{
  metaTitle, metaDescription, ribbonText,
  breadcrumbHome, breadcrumbBuyTokens, breadcrumbCurrent,
  headingPrefix, headingHighlight, headingSuffix,
  subheadWithEmailTemplate, subheadWithoutEmail, subheadFallback,
  nextStepsHeading, nextSteps[]{ n, body },
  rooseveltKicker, rooseveltAddress, rooseveltHours,
  madisonKicker, madisonAddress, madisonHours, locationLinkLabel,
  supportPrefix, supportPhoneDisplay, supportSuffix,
  receiptHeading, receiptPaidBadge, packSingular, packPlural, totalLabel,
  noLineItemsMessage, backToHomeLabel
}`

async function loadCopy(): Promise<Copy> {
  const data = await sanityFetch<Partial<Copy> | null>(QUERY)
  if (!data) return FALLBACK
  const merged: Copy = { ...FALLBACK }
  for (const [k, v] of Object.entries(data) as [keyof Copy, unknown][]) {
    if (v === null || v === undefined) continue
    if (Array.isArray(v) && v.length === 0) continue
    // @ts-expect-error -- safe per-field copy
    merged[k] = v
  }
  return merged
}

export async function generateMetadata(): Promise<Metadata> {
  const copy = await loadCopy()
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    robots: { index: false, follow: false },
  }
}

type Params = {
  searchParams: Promise<{ session_id?: string }>
}

type LineRow = { label: string; quantity: number; amount: number }

function formatAddress(addr: Stripe.Address | null | undefined): string | null {
  if (!addr) return null
  const parts = [
    addr.line1,
    addr.line2,
    [addr.city, addr.state].filter(Boolean).join(', '),
    addr.postal_code,
  ].filter((p): p is string => !!p && p.trim().length > 0)
  return parts.length ? parts.join(', ') : null
}

async function fetchSession(sessionId: string): Promise<{
  status: 'ok' | 'missing' | 'error'
  customerEmail: string | null
  customerName: string | null
  customerAddress: string | null
  total: number | null
  currency: string
  lines: LineRow[]
}> {
  const secret = getStripeSecretKey()
  if (!secret)
    return {
      status: 'error',
      customerEmail: null,
      customerName: null,
      customerAddress: null,
      total: null,
      currency: 'usd',
      lines: [],
    }
  try {
    const stripe = new Stripe(secret)
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product'],
    })
    const lineItems = session.line_items?.data ?? []
    const lines: LineRow[] = lineItems.map((li) => {
      const product = li.price?.product
      const productName =
        typeof product === 'object' && product && 'name' in product && !('deleted' in product)
          ? (product as Stripe.Product).name
          : (li.description ?? 'Token pack')
      return {
        label: productName,
        quantity: li.quantity ?? 1,
        amount: li.amount_total ?? 0,
      }
    })
    return {
      status: 'ok',
      customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
      customerName: session.metadata?.customer_name ?? session.customer_details?.name ?? null,
      customerAddress: formatAddress(session.customer_details?.address),
      total: session.amount_total ?? null,
      currency: session.currency ?? 'usd',
      lines,
    }
  } catch {
    return {
      status: 'missing',
      customerEmail: null,
      customerName: null,
      customerAddress: null,
      total: null,
      currency: 'usd',
      lines: [],
    }
  }
}

const fmt = (cents: number, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
    cents / 100,
  )

export default async function SuccessPage({ searchParams }: Params) {
  const [{ session_id }, copy] = await Promise.all([searchParams, loadCopy()])
  const data = session_id
    ? await fetchSession(session_id)
    : {
        status: 'missing' as const,
        customerEmail: null,
        customerName: null,
        customerAddress: null,
        total: null,
        currency: 'usd',
        lines: [],
      }

  // The greeting prefers the customer's name when available, and falls back to
  // the email address otherwise. Both {name} and {email} placeholders resolve
  // to the same personalized token so legacy Sanity copy ("Thanks, {email}...")
  // automatically benefits without any CMS edit. {address} is filled with the
  // Stripe billing address (single-line) when present.
  const greeting = data.customerName ?? data.customerEmail
  const subheadText =
    data.status === 'ok'
      ? greeting
        ? copy.subheadWithEmailTemplate
            .replace('{name}', greeting)
            .replace('{email}', greeting)
            .replace('{address}', data.customerAddress ?? '')
        : copy.subheadWithoutEmail
      : copy.subheadFallback

  return (
    <>
      {/* Ribbon */}
      <div className="bg-yellow-400 text-blue-700 border-b-[3px] border-blue-700">
        <div className="max-w-[1240px] mx-auto px-5 md:px-7 py-3 text-center text-[12px] sm:text-[13px] font-extrabold tracking-[0.16em] uppercase">
          {copy.ribbonText}
        </div>
      </div>

      {/* Header */}
      <header className="bg-blue-500 text-white border-b-[3px] border-blue-700">
        <div className="max-w-[1240px] mx-auto px-5 md:px-7 py-12 md:py-16">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-100 mb-5">
            <Link href="/" className="hover:text-yellow-400 transition">
              {copy.breadcrumbHome}
            </Link>
            <span className="text-blue-200">/</span>
            <Link href="/buy-tokens" className="hover:text-yellow-400 transition">
              {copy.breadcrumbBuyTokens}
            </Link>
            <span className="text-blue-200">/</span>
            <span className="text-yellow-400">{copy.breadcrumbCurrent}</span>
          </div>
          <h1 className="display m-0 text-[52px] sm:text-[72px] md:text-[96px] leading-[0.92]">
            {copy.headingPrefix}{copy.headingPrefix ? ' ' : ''}<em className="text-yellow-400">{copy.headingHighlight}</em>{copy.headingSuffix}
          </h1>
          <p className="mt-5 max-w-[560px] text-blue-100 text-base sm:text-lg leading-relaxed">
            {subheadText}
          </p>
        </div>
      </header>

      <section className="flex-1 py-12 md:py-16">
        <div className="max-w-[1240px] mx-auto px-5 md:px-7 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12 items-start">
          {/* Next steps */}
          <div className="space-y-6">
            <div className="bg-white border border-line rounded-2xl p-5 sm:p-6">
              <div className="display text-[24px] sm:text-[28px] mb-3">{copy.nextStepsHeading}</div>
              <ol className="space-y-3 text-[15px] leading-relaxed text-[#1c2c52]">
                {copy.nextSteps.map((step, i) => (
                  <li key={i}>
                    <span className="mono text-[12px] font-semibold tracking-[0.18em] uppercase text-blue-500 mr-2">
                      {step.n}
                    </span>
                    {step.body}
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="mono text-[11px] font-semibold tracking-[0.22em] uppercase text-[#9aa9c9] mb-1">
                  {copy.rooseveltKicker}
                </div>
                <div className="font-extrabold">{copy.rooseveltAddress}</div>
                <div className="text-[13px] text-[#5b6987]">{copy.rooseveltHours}</div>
                <Link
                  href="/locations/roosevelt-rd"
                  className="inline-block mt-2 text-[13px] font-bold text-blue-500 hover:text-blue-700 transition"
                >
                  {copy.locationLinkLabel}
                </Link>
              </div>
              <div>
                <div className="mono text-[11px] font-semibold tracking-[0.22em] uppercase text-[#9aa9c9] mb-1">
                  {copy.madisonKicker}
                </div>
                <div className="font-extrabold">{copy.madisonAddress}</div>
                <div className="text-[13px] text-[#5b6987]">{copy.madisonHours}</div>
                <Link
                  href="/locations/madison-st"
                  className="inline-block mt-2 text-[13px] font-bold text-blue-500 hover:text-blue-700 transition"
                >
                  {copy.locationLinkLabel}
                </Link>
              </div>
            </div>

            <p className="text-[13px] text-[#5b6987]">
              {copy.supportPrefix}{' '}
              <a
                href="tel:7087712945"
                className="font-bold text-blue-500 hover:text-blue-700 transition"
              >
                {copy.supportPhoneDisplay}
              </a>{' '}
              {copy.supportSuffix}
            </p>
          </div>

          {/* Receipt card */}
          <aside className="self-start lg:sticky lg:top-[120px]">
            <div className="bg-blue-700 text-white rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(8,24,63,0.35)]">
              <div className="bg-blue-500 px-6 py-5 border-b-2 border-blue-700 flex items-center justify-between">
                <span className="display text-[22px]">{copy.receiptHeading}</span>
                <span className="mono text-[10px] font-extrabold tracking-[0.22em] uppercase bg-yellow-400 text-blue-700 px-2.5 py-1 rounded-full">
                  {copy.receiptPaidBadge}
                </span>
              </div>
              <div className="p-6">
                {data.status === 'ok' && data.lines.length > 0 ? (
                  <>
                    {data.lines.map((row, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-3 py-3 border-b border-white/15"
                      >
                        <div>
                          <div className="font-extrabold text-[16px]">{row.label}</div>
                          <div className="text-[13px] text-blue-200 mt-0.5">
                            ×{row.quantity} {row.quantity === 1 ? copy.packSingular : copy.packPlural}
                          </div>
                        </div>
                        <div className="display text-[22px] text-yellow-400 leading-none">
                          {fmt(row.amount, data.currency)}
                        </div>
                      </div>
                    ))}
                    {data.total != null && (
                      <div className="mt-4 pt-4 border-t-2 border-yellow-400 flex items-baseline justify-between">
                        <span className="display text-[20px]">{copy.totalLabel}</span>
                        <span className="display text-[40px] text-yellow-400 leading-none">
                          {fmt(data.total, data.currency)}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-blue-100 text-[14px] leading-relaxed">
                    {copy.noLineItemsMessage}
                  </p>
                )}

                <Link
                  href="/"
                  className="mt-6 w-full bg-yellow-400 text-blue-700 px-6 py-4 rounded-2xl border-2 border-yellow-400 font-extrabold flex items-center justify-center gap-2 hover:bg-white hover:border-white transition"
                >
                  <span className="display text-[20px] leading-none">{copy.backToHomeLabel}</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.8"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}

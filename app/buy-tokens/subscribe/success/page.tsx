import type { Metadata } from 'next'
import Link from 'next/link'
import Stripe from 'stripe'
import { getStripeSecretKey } from '@/lib/stripeEnv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Subscription started',
  description: 'Your wash token subscription is active.',
  // A post-checkout confirmation has no search value and would leak session
  // ids into the index, so it stays out — same as /buy-tokens/success.
  robots: { index: false, follow: false },
}

type Summary = {
  customerName: string
  tokensPerCycle: number
  planName: string
  amount: string | null
}

/**
 * Read back the completed Checkout Session so the page can confirm the actual
 * plan rather than trusting a query string. Best-effort — a Stripe hiccup
 * degrades to the generic confirmation instead of erroring the page.
 */
async function loadSummary(sessionId: string | undefined): Promise<Summary | null> {
  if (!sessionId) return null
  const secret = getStripeSecretKey()
  if (!secret) return null

  try {
    const stripe = new Stripe(secret)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const meta = session.metadata ?? {}
    const amount =
      session.amount_total != null
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: (session.currency || 'usd').toUpperCase(),
          }).format(session.amount_total / 100)
        : null

    return {
      customerName: meta.customer_name ?? session.customer_details?.name ?? '',
      tokensPerCycle: Number(meta.tokens_per_cycle ?? 0),
      planName: meta.plan ?? '',
      amount,
    }
  } catch (err) {
    console.error('[subscribe/success] could not load session', err)
    return null
  }
}

export default async function SubscribeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const raw = params.session_id
  const sessionId = Array.isArray(raw) ? raw[0] : raw
  const summary = await loadSummary(sessionId)

  const steps = [
    {
      n: '01',
      body: summary?.tokensPerCycle
        ? `Your first ${summary.tokensPerCycle} tokens go out by USPS within one business day.`
        : 'Your first batch of tokens goes out by USPS within one business day.',
    },
    {
      n: '02',
      body: 'After that, tokens are mailed each month once your payment clears. Nothing to reorder.',
    },
    {
      n: '03',
      body: 'Tokens work in the automatic bays at either Forest Park location, and they never expire.',
    },
  ]

  return (
    <>
      <div className="bg-yellow-400 text-blue-700 border-b-[3px] border-blue-700">
        <div className="max-w-[1240px] mx-auto px-5 md:px-7 py-3 text-center text-[12px] sm:text-[13px] font-extrabold tracking-[0.16em] uppercase">
          Subscription active · Tokens on the way
        </div>
      </div>

      <header className="bg-blue-500 text-white border-b-[3px] border-blue-700">
        <div className="max-w-[1240px] mx-auto px-5 md:px-7 py-12 md:py-16">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-100 mb-5">
            <Link href="/" className="hover:text-yellow-400 transition">
              Home
            </Link>
            <span className="text-blue-200">/</span>
            <Link href="/buy-tokens" className="hover:text-yellow-400 transition">
              Buy tokens
            </Link>
            <span className="text-blue-200">/</span>
            <span className="text-yellow-400">Subscribed</span>
          </div>
          <h1 className="display m-0 text-[52px] sm:text-[72px] md:text-[96px] leading-[0.92]">
            You&apos;re in the <em className="text-yellow-400">club</em>.
          </h1>
          <p className="mt-5 max-w-[560px] text-blue-100 text-base sm:text-lg leading-relaxed">
            {summary?.customerName
              ? `Thanks, ${summary.customerName}. `
              : 'Thanks! '}
            Your wash token subscription is active
            {summary?.amount ? ` at ${summary.amount} a month` : ''}. Here&apos;s what
            happens next.
          </p>
        </div>
      </header>

      <section className="flex-1 py-12 md:py-16">
        <div className="max-w-[1240px] mx-auto px-5 md:px-7 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12 items-start">
          <div className="space-y-4">
            <h2 className="display m-0 text-[24px] sm:text-[28px]">What happens next</h2>
            {steps.map((step) => (
              <div
                key={step.n}
                className="flex items-start gap-4 rounded-2xl border-2 border-line bg-white p-5"
              >
                <div className="display text-[28px] leading-none text-blue-500">
                  {step.n}
                </div>
                <p className="text-sm leading-relaxed text-[#5B6B8C]">{step.body}</p>
              </div>
            ))}
          </div>

          <aside className="rounded-2xl border-2 border-blue-700 bg-white p-6">
            <h2 className="display m-0 text-[22px]">Manage your plan</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5B6B8C]">
              Change plans, update your card or mailing address, pause, or cancel — all
              from your Stripe billing page. We&apos;ll email you a link with your receipt.
            </p>
            <Link
              href="/buy-tokens"
              className="mt-5 block w-full rounded-full bg-blue-700 px-6 py-4 text-center text-base font-extrabold text-white transition hover:bg-blue-500"
            >
              Back to tokens
            </Link>
            <p className="mt-5 text-center text-xs text-[#9aa9c9]">
              Questions? Call{' '}
              <a href="tel:7087712945" className="font-bold text-blue-500">
                (708) 771-2945
              </a>
            </p>
          </aside>
        </div>
      </section>
    </>
  )
}

'use client'

import Link from 'next/link'
import { useMemo, useState, type FormEvent } from 'react'
import { formatUsPhone } from '@/lib/phone'
import { firstIssueMessage, subscriptionCheckoutBodySchema } from '@/lib/schemas'

export type PlanProp = {
  id: string
  name: string
  tokensPerCycle: number
  washValue: string
  price: number // cents / month
  perToken: number // cents
  blurb: string
  featured?: boolean
}

export type SubscribeCopy = {
  metaTitle: string
  metaDescription: string
  ribbonText: string
  breadcrumbHome: string
  breadcrumbTokens: string
  breadcrumbCurrent: string
  headingPrefix: string
  headingHighlight: string
  headingSuffix: string
  subhead: string

  step1Number: string
  step1Kicker: string
  step1Title: string
  mostPopularLabel: string
  perMonthSuffix: string
  perTokenSuffix: string
  tokensSuffix: string

  step2Number: string
  step2Kicker: string
  step2Title: string
  emailLabel: string
  emailPlaceholder: string
  emailHelper: string
  nameLabel: string
  namePlaceholder: string
  phoneLabel: string
  phoneOptionalLabel: string
  phonePlaceholder: string
  requiredMark: string
  mailingListLabel: string

  step3Number: string
  step3Kicker: string
  step3Title: string
  deliveryHeading: string
  deliveryBody: string
  deliveryChips: string[]

  summaryHeading: string
  summaryBadge: string
  billedLabel: string
  billedValue: string
  totalLabel: string
  submitLabel: string
  submittingLabel: string
  erroredLabel: string
  submitDisclaimer: string
  checkoutErrorMessage: string

  trustItems: { line1: string; line2: string }[]
  contactPrefix: string
  contactConnector: string
  contactPhoneDisplay: string
  contactEmail: string
}

function formatUSD(cents: number): string {
  if (cents % 100 === 0) return `$${cents / 100}`
  return `$${(cents / 100).toFixed(2)}`
}

export default function SubscribeClient({
  copy,
  plans,
}: {
  copy: SubscribeCopy
  plans: PlanProp[]
}) {
  const featuredId = plans.find((p) => p.featured)?.id ?? plans[0]?.id ?? ''
  const [selectedId, setSelectedId] = useState(featuredId)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [mailingList, setMailingList] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const selected = useMemo(
    () => plans.find((p) => p.id === selectedId) ?? plans[0],
    [plans, selectedId],
  )

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting || !selected) return

    const body = {
      plan: selected.id,
      email,
      name,
      phone,
      mailingListSubscribed: mailingList,
    }

    // Validate with the same schema the API route uses, so the customer sees
    // the error inline instead of bouncing off a 400.
    const parsed = subscriptionCheckoutBodySchema.safeParse(body)
    if (!parsed.success) {
      setErrorMessage(firstIssueMessage(parsed.error))
      return
    }

    setSubmitting(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setErrorMessage(data.error || copy.checkoutErrorMessage)
        setSubmitting(false)
        return
      }
      window.location.href = data.url
    } catch {
      setErrorMessage(copy.checkoutErrorMessage)
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Secure-checkout ribbon */}
      <div className="bg-yellow-400 text-blue-700 border-b-[3px] border-blue-700">
        <div className="max-w-[1240px] mx-auto px-5 md:px-7 py-3 flex items-center justify-center gap-3 text-[12px] sm:text-[13px] font-extrabold tracking-[0.16em] uppercase">
          <LockIcon className="hidden sm:block" />
          <span>{copy.ribbonText}</span>
          <LockIcon className="hidden sm:block" />
        </div>
      </div>

      {/* Page header */}
      <header className="bg-blue-500 text-white border-b-[3px] border-blue-700">
        <div className="max-w-[1240px] mx-auto px-5 md:px-7 py-12 md:py-16">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-100 mb-5">
            <Link href="/" className="hover:text-yellow-400 transition">
              {copy.breadcrumbHome}
            </Link>
            <span className="text-blue-200">/</span>
            <Link href="/buy-tokens" className="hover:text-yellow-400 transition">
              {copy.breadcrumbTokens}
            </Link>
            <span className="text-blue-200">/</span>
            <span className="text-yellow-400">{copy.breadcrumbCurrent}</span>
          </div>
          <h1 className="display m-0 text-[52px] sm:text-[72px] md:text-[96px] leading-[0.92]">
            {copy.headingPrefix}
            {copy.headingPrefix ? ' ' : ''}
            <em className="text-yellow-400">{copy.headingHighlight}</em>
            {copy.headingSuffix}
          </h1>
          <p className="mt-5 max-w-[560px] text-blue-100 text-base sm:text-lg leading-relaxed">
            {copy.subhead}
          </p>
        </div>
      </header>

      <section className="flex-1 py-12 md:py-16">
        <form
          onSubmit={onSubmit}
          className="max-w-[1240px] mx-auto px-5 md:px-7 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12 items-start"
        >
          <div className="space-y-8">
            {/* STEP 1 — PLAN */}
            <section>
              <StepHead
                num={copy.step1Number}
                kicker={copy.step1Kicker}
                title={copy.step1Title}
              />
              <div
                role="radiogroup"
                aria-label={copy.step1Title}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {plans.map((plan) => {
                  const active = plan.id === selectedId
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelectedId(plan.id)}
                      className={`relative text-left rounded-2xl border-2 p-5 transition ${
                        active
                          ? 'border-blue-500 bg-white shadow-[0_10px_30px_-18px_rgba(8,24,63,.5)]'
                          : 'border-line bg-white hover:border-blue-300'
                      }`}
                    >
                      {plan.featured && (
                        <span className="absolute -top-2.5 left-5 rounded-full bg-yellow-400 px-2.5 py-1 mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-700">
                          {copy.mostPopularLabel}
                        </span>
                      )}
                      <div className="display text-[20px] leading-none">{plan.name}</div>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="display text-[40px] leading-none text-blue-700">
                          {formatUSD(plan.price)}
                        </span>
                        <span className="mono text-[11px] uppercase tracking-[0.14em] text-[#9aa9c9]">
                          {copy.perMonthSuffix}
                        </span>
                      </div>
                      <div className="mt-1 mono text-[11px] uppercase tracking-[0.14em] text-[#9aa9c9]">
                        {formatUSD(plan.perToken)} {copy.perTokenSuffix}
                      </div>
                      <div className="mt-3 text-sm font-extrabold text-blue-700">
                        {plan.tokensPerCycle} {copy.tokensSuffix}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[#5B6B8C]">
                        {plan.blurb}
                      </p>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* STEP 2 — DETAILS */}
            <section>
              <StepHead
                num={copy.step2Number}
                kicker={copy.step2Kicker}
                title={copy.step2Title}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block sm:col-span-2">
                  <span className="mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9aa9c9]">
                    {copy.emailLabel} <span className="text-red-500">{copy.requiredMark}</span>
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={copy.emailPlaceholder}
                    className="mt-1.5 w-full rounded-xl border-2 border-line bg-white px-4 py-3 text-base text-ink focus:border-blue-500 focus:outline-none"
                  />
                  <span className="mt-1 block text-xs text-[#9aa9c9]">
                    {copy.emailHelper}
                  </span>
                </label>

                <label className="block">
                  <span className="mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9aa9c9]">
                    {copy.nameLabel} <span className="text-red-500">{copy.requiredMark}</span>
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={copy.namePlaceholder}
                    className="mt-1.5 w-full rounded-xl border-2 border-line bg-white px-4 py-3 text-base text-ink focus:border-blue-500 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9aa9c9]">
                    {copy.phoneLabel}{' '}
                    <span className="normal-case tracking-normal">
                      {copy.phoneOptionalLabel}
                    </span>
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    // Format as they type, matching the buy-tokens form.
                    onChange={(e) => setPhone(formatUsPhone(e.target.value))}
                    placeholder={copy.phonePlaceholder}
                    className="mt-1.5 w-full rounded-xl border-2 border-line bg-white px-4 py-3 text-base text-ink focus:border-blue-500 focus:outline-none"
                  />
                </label>

                <label className="sm:col-span-2 flex items-start gap-3 text-sm text-[#5B6B8C]">
                  <input
                    type="checkbox"
                    checked={mailingList}
                    onChange={(e) => setMailingList(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-blue-500"
                  />
                  <span>{copy.mailingListLabel}</span>
                </label>
              </div>
            </section>

            {/* STEP 3 — DELIVERY */}
            <section>
              <StepHead
                num={copy.step3Number}
                kicker={copy.step3Kicker}
                title={copy.step3Title}
              />
              <div className="rounded-2xl border-2 border-line bg-white p-5">
                <div className="display text-[20px] leading-none">
                  {copy.deliveryHeading}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#5B6B8C]">
                  {copy.deliveryBody}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {copy.deliveryChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full bg-paper2 px-3 py-1.5 mono text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN — SUMMARY */}
          <aside className="lg:sticky lg:top-6 rounded-2xl border-2 border-blue-700 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="display m-0 text-[24px]">{copy.summaryHeading}</h2>
              <span className="rounded-full bg-blue-700 px-3 py-1 mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">
                {copy.summaryBadge}
              </span>
            </div>

            {selected && (
              <>
                <div className="mt-5 flex items-baseline justify-between border-b border-line pb-4">
                  <div>
                    <div className="display text-[22px] leading-none">{selected.name}</div>
                    <div className="mt-1 mono text-[11px] uppercase tracking-[0.14em] text-[#9aa9c9]">
                      {selected.tokensPerCycle} {copy.tokensSuffix}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="display text-[30px] leading-none text-blue-700">
                      {formatUSD(selected.price)}
                    </div>
                    <div className="mono text-[10px] uppercase tracking-[0.14em] text-[#9aa9c9]">
                      {formatUSD(selected.perToken)} {copy.perTokenSuffix}
                    </div>
                  </div>
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-[#5B6B8C]">{copy.billedLabel}</dt>
                    <dd className="font-extrabold text-ink">{copy.billedValue}</dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-line pt-3">
                    <dt className="display text-[18px]">{copy.totalLabel}</dt>
                    <dd className="display text-[26px] text-blue-700">
                      {formatUSD(selected.price)}
                    </dd>
                  </div>
                </dl>
              </>
            )}

            {errorMessage && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full rounded-full bg-blue-700 px-6 py-4 text-base font-extrabold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {submitting
                ? copy.submittingLabel
                : errorMessage
                  ? copy.erroredLabel
                  : copy.submitLabel}
            </button>

            <p className="mt-3 text-xs leading-relaxed text-[#9aa9c9]">
              {copy.submitDisclaimer}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-5 text-center">
              {copy.trustItems.map((item) => (
                <div key={`${item.line1}-${item.line2}`}>
                  <div className="mono text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700">
                    {item.line1}
                  </div>
                  <div className="mono text-[10px] uppercase tracking-[0.12em] text-[#9aa9c9]">
                    {item.line2}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-5 text-center text-xs text-[#9aa9c9]">
              {copy.contactPrefix}{' '}
              <a
                href={`tel:${copy.contactPhoneDisplay.replace(/[^0-9+]/g, '')}`}
                className="font-bold text-blue-500"
              >
                {copy.contactPhoneDisplay}
              </a>{' '}
              {copy.contactConnector}{' '}
              <a href={`mailto:${copy.contactEmail}`} className="font-bold text-blue-500">
                {copy.contactEmail}
              </a>
            </p>
          </aside>
        </form>
      </section>
    </>
  )
}

function StepHead({ num, kicker, title }: { num: string; kicker: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="display text-[32px] text-blue-500 leading-none">{num}</div>
      <div>
        <div className="mono text-[11px] font-semibold tracking-[0.22em] uppercase text-[#9aa9c9]">
          {kicker}
        </div>
        <h2 className="display m-0 text-[24px] sm:text-[28px]">{title}</h2>
      </div>
    </div>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

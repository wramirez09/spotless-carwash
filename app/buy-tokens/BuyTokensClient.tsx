'use client'

import Link from 'next/link'
import { useMemo, useState, type FormEvent } from 'react'

type Pkg = {
  id: '5' | '10' | '25'
  tokens: number
  price: number // cents
  save: number // cents
  label: string
  perToken: number // cents
  featured?: boolean
}

const PACKAGES: Pkg[] = [
  { id: '5', tokens: 5, price: 4500, save: 0, label: '5 Tokens', perToken: 900 },
  { id: '10', tokens: 10, price: 8500, save: 500, label: '10 Tokens', perToken: 850, featured: true },
  { id: '25', tokens: 25, price: 20000, save: 2500, label: '25 Tokens', perToken: 800 },
]

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`
const fmtWhole = (cents: number) => `$${Math.round(cents / 100)}`

export default function BuyTokensClient() {
  const [selectedId, setSelectedId] = useState<Pkg['id']>('10')
  const [quantity, setQuantity] = useState<number>(1)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errored, setErrored] = useState(false)

  const selected = PACKAGES.find((p) => p.id === selectedId)!
  const subtotal = selected.price * quantity
  const savings = selected.save * quantity

  const buttonLabel = useMemo(() => {
    if (submitting) return 'Redirecting to Stripe…'
    if (errored) return 'Try again'
    return 'Pay with Stripe'
  }, [submitting, errored])

  const clampQty = (n: number) => Math.max(1, Math.min(20, n))

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    setErrored(false)
    setSubmitting(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: selected.id,
          quantity,
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim(),
        }),
      })
      if (!res.ok) throw new Error('Checkout failed')
      const data: { url?: string } = await res.json()
      if (!data.url) throw new Error('No URL returned')
      window.location.href = data.url
    } catch {
      setSubmitting(false)
      setErrored(true)
      alert('Something went wrong. Please try again or call (708) 771-2945.')
    }
  }

  return (
    <>
      {/* Secure-checkout ribbon */}
      <div className="bg-yellow-400 text-blue-700 border-b-[3px] border-blue-700">
        <div className="max-w-[1240px] mx-auto px-5 md:px-7 py-3 flex items-center justify-center gap-3 text-[12px] sm:text-[13px] font-extrabold tracking-[0.16em] uppercase">
          <LockIcon className="hidden sm:block" />
          <span>Secure checkout · Encrypted · Powered by Stripe</span>
          <LockIcon className="hidden sm:block" />
        </div>
      </div>

      {/* Page header */}
      <header className="bg-blue-500 text-white border-b-[3px] border-blue-700">
        <div className="max-w-[1240px] mx-auto px-5 md:px-7 py-12 md:py-16">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-100 mb-5">
            <Link href="/" className="hover:text-yellow-400 transition">
              Home
            </Link>
            <span className="text-blue-200">/</span>
            <span className="text-yellow-400">Buy tokens</span>
          </div>
          <h1 className="display m-0 text-[52px] sm:text-[72px] md:text-[96px] leading-[0.92]">
            Buy wash <em className="text-yellow-400">tokens</em>.
          </h1>
          <p className="mt-5 max-w-[560px] text-blue-100 text-base sm:text-lg leading-relaxed">
            Pre-paid tokens for the automatic bays. Works at both Forest Park locations — Roosevelt
            Rd and Madison St. Stash &apos;em in the glovebox and skip the cash station.
          </p>
        </div>
      </header>

      {/* MAIN */}
      <section className="flex-1 py-12 md:py-16">
        <form
          onSubmit={onSubmit}
          className="max-w-[1240px] mx-auto px-5 md:px-7 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12 items-start"
        >
          {/* LEFT COLUMN */}
          <div className="space-y-8">
            {/* STEP 1 — PACKAGE */}
            <section>
              <StepHead num="01" kicker="Step one" title="Pick a token pack." />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PACKAGES.map((pkg, idx) => {
                  const checked = pkg.id === selectedId
                  return (
                    <label
                      key={pkg.id}
                      htmlFor={`pkg-${pkg.id}`}
                      className={
                        'relative block bg-white rounded-2xl p-5 cursor-pointer transition border-2 ' +
                        (checked
                          ? 'border-blue-500 shadow-[0_12px_30px_rgba(27,79,217,0.18)]'
                          : 'border-line hover:border-blue-500')
                      }
                      style={
                        checked
                          ? { background: 'linear-gradient(180deg, #ffffff 0%, #F4F7FB 100%)' }
                          : undefined
                      }
                    >
                      <input
                        id={`pkg-${pkg.id}`}
                        type="radio"
                        name="package"
                        value={pkg.id}
                        checked={checked}
                        onChange={() => setSelectedId(pkg.id)}
                        className="absolute opacity-0 pointer-events-none"
                      />
                      {pkg.featured && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-blue-700 text-[10px] font-extrabold tracking-[0.16em] uppercase px-2.5 py-1 rounded-full border border-blue-700 whitespace-nowrap">
                          Most Popular
                        </span>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <span className="mono text-[10px] font-semibold tracking-[0.22em] uppercase text-[#9aa9c9]">
                          Pack / {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span
                          className={
                            'w-6 h-6 rounded-full flex items-center justify-center transition border-2 text-white ' +
                            (checked ? 'bg-blue-500 border-blue-500' : 'border-line')
                          }
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className={checked ? 'opacity-100' : 'opacity-0'}
                          >
                            <path d="M5 12l5 5L20 7" />
                          </svg>
                        </span>
                      </div>
                      <div className="display text-[44px] text-ink mt-2 leading-none">
                        {pkg.tokens}
                      </div>
                      <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#5b6987] -mt-1">
                        Tokens
                      </div>
                      <div className="mt-4 pt-4 border-t border-dashed border-line flex items-baseline gap-1.5">
                        <span className="display text-[28px] text-blue-500 leading-none">
                          {fmtWhole(pkg.price)}
                        </span>
                        {pkg.save > 0 ? (
                          <span className="ml-auto bg-blue-700 text-yellow-400 text-[11px] font-extrabold tracking-[0.1em] px-2.5 py-1 rounded-full">
                            SAVE {fmtWhole(pkg.save)}
                          </span>
                        ) : (
                          <span className="ml-auto text-[12px] font-semibold text-[#5b6987]">
                            {fmtWhole(pkg.perToken)} ea.
                          </span>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>

              <div className="mt-5 bg-white border border-line rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-extrabold text-[15px]">Number of packs</div>
                  <div className="text-[13px] text-[#5b6987] mt-0.5">
                    Buy multiple packs of the same size.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => clampQty(q - 1))}
                    className="w-10 h-10 rounded-xl border-2 border-line bg-white text-xl font-extrabold leading-none hover:border-blue-500 hover:text-blue-500 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-ink"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={quantity}
                    onChange={(e) => setQuantity(clampQty(parseInt(e.target.value, 10) || 1))}
                    aria-label="Number of packs"
                    className="w-16 px-2 py-2 text-center text-[16px] font-extrabold border-[1.5px] border-line rounded-xl text-ink [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= 20}
                    onClick={() => setQuantity((q) => clampQty(q + 1))}
                    className="w-10 h-10 rounded-xl border-2 border-line bg-white text-xl font-extrabold leading-none hover:border-blue-500 hover:text-blue-500 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-ink"
                  >
                    +
                  </button>
                </div>
              </div>
            </section>

            {/* STEP 2 — CONTACT */}
            <section>
              <StepHead num="02" kicker="Step two" title="Your details." />
              <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block sm:col-span-2">
                  <div className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#5b6987] mb-1.5">
                    Email <span className="text-blue-500">*</span>
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-[1.5px] border-line rounded-xl px-4 py-3.5 text-[15px] text-ink bg-white placeholder:text-[#9aa9c9] focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(27,79,217,0.12)] transition"
                  />
                  <div className="text-[12px] text-[#5b6987] mt-1.5">
                    Receipt and token codes will be sent here.
                  </div>
                </label>
                <label className="block">
                  <div className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#5b6987] mb-1.5">
                    Full name <span className="text-blue-500">*</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Pat Driver"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-[1.5px] border-line rounded-xl px-4 py-3.5 text-[15px] text-ink bg-white placeholder:text-[#9aa9c9] focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(27,79,217,0.12)] transition"
                  />
                </label>
                <label className="block">
                  <div className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#5b6987] mb-1.5">
                    Phone{' '}
                    <span className="text-[#9aa9c9] font-normal tracking-normal normal-case">
                      (optional)
                    </span>
                  </div>
                  <input
                    type="tel"
                    placeholder="(708) 555-0100"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border-[1.5px] border-line rounded-xl px-4 py-3.5 text-[15px] text-ink bg-white placeholder:text-[#9aa9c9] focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(27,79,217,0.12)] transition"
                  />
                </label>
              </div>
            </section>

            {/* STEP 3 — DELIVERY */}
            <section>
              <StepHead num="03" kicker="Step three" title="How to get your tokens." />
              <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 grid grid-cols-[auto_1fr] gap-4 items-start">
                <div className="w-10 h-10 bg-yellow-400 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <path d="M22 6l-10 7L2 6" />
                  </svg>
                </div>
                <div>
                  <div className="font-extrabold">Email delivery</div>
                  <p className="mt-1 mb-0 text-[14px] leading-relaxed text-[#445273]">
                    Token codes are emailed within 1 minute of payment. Bring the email to either
                    location or pick up physical tokens at the cash station during attendant hours.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-paper text-[#1c2c52] text-[12px] font-bold px-2.5 py-1.5 rounded-full">
                      Roosevelt Rd · 24h
                    </span>
                    <span className="bg-paper text-[#1c2c52] text-[12px] font-bold px-2.5 py-1.5 rounded-full">
                      Madison St · 7am–10pm
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN — ORDER SUMMARY */}
          <aside className="self-start lg:sticky lg:top-[120px]">
            <div className="bg-blue-700 text-white rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(8,24,63,0.35)]">
              <div className="bg-blue-500 px-6 py-5 border-b-2 border-blue-700 flex items-center justify-between">
                <span className="display text-[22px]">Order summary</span>
                <span className="mono text-[10px] font-extrabold tracking-[0.22em] uppercase bg-yellow-400 text-blue-700 px-2.5 py-1 rounded-full">
                  Order
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/15">
                  <div>
                    <div className="font-extrabold text-[16px]">{selected.label}</div>
                    <div className="text-[13px] text-blue-200 mt-0.5">
                      {fmt(selected.perToken)} per token · ×{quantity}{' '}
                      {quantity === 1 ? 'pack' : 'packs'}
                    </div>
                  </div>
                  <div className="display text-[26px] text-yellow-400 leading-none">
                    {fmt(subtotal)}
                  </div>
                </div>

                {savings > 0 && (
                  <div className="flex items-center justify-between py-3 border-b border-white/15 text-[14px]">
                    <span className="text-blue-100">You save</span>
                    <span className="font-extrabold text-yellow-400">{fmt(savings)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-3 text-[14px]">
                  <span className="text-blue-100">Tax</span>
                  <span className="mono text-blue-200">Calculated at checkout</span>
                </div>

                <div className="mt-2 pt-4 border-t-2 border-yellow-400 flex items-baseline justify-between">
                  <span className="display text-[20px]">Total</span>
                  <span className="display text-[40px] text-yellow-400 leading-none">
                    {fmt(subtotal)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 w-full bg-yellow-400 text-blue-700 px-6 py-4 rounded-2xl border-2 border-yellow-400 font-extrabold flex items-center justify-center gap-2.5 hover:bg-white hover:border-white transition disabled:opacity-70 disabled:cursor-wait"
                >
                  <LockIcon />
                  <span className="display text-[20px] leading-none">{buttonLabel}</span>
                  {!submitting && (
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
                  )}
                </button>

                <p className="text-center text-[12px] text-blue-200 mt-3 leading-relaxed">
                  You&apos;ll be redirected to Stripe to complete payment. No card details are
                  stored on our site.
                </p>
              </div>
            </div>

            {/* Trust strip */}
            <div className="mt-4 bg-white border border-line rounded-2xl p-4 grid grid-cols-3 gap-2 text-center">
              <TrustItem
                lines={['PCI-DSS', 'encrypted']}
                icon={
                  <path d="M12 2l9 4v6c0 5-3.8 9.7-9 10-5.2-.3-9-5-9-10V6l9-4z M9 12l2 2 4-4" />
                }
              />
              <TrustItem
                lines={['Works at', 'both locations']}
                icon={
                  <>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </>
                }
              />
              <TrustItem
                lines={['Never', 'expire']}
                icon={<path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" />}
              />
            </div>

            <p className="text-center text-[12px] text-[#5b6987] mt-4 leading-relaxed">
              Questions? Call{' '}
              <a
                href="tel:7087712945"
                className="font-bold text-blue-500 hover:text-blue-700 transition"
              >
                (708) 771-2945
              </a>{' '}
              or email{' '}
              <a
                href="mailto:hello@spotlesscarwash.com"
                className="font-bold text-blue-500 hover:text-blue-700 transition"
              >
                hello@spotlesscarwash.com
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

function TrustItem({ lines, icon }: { lines: [string, string]; icon: React.ReactNode }) {
  return (
    <div>
      <div className="w-9 h-9 bg-paper2 text-blue-500 rounded-xl flex items-center justify-center mx-auto mb-1.5">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          {icon}
        </svg>
      </div>
      <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-[#5b6987] leading-tight">
        {lines[0]}
        <br />
        {lines[1]}
      </div>
    </div>
  )
}

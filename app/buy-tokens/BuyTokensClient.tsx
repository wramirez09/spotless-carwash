'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'

type PkgId = '8' | '9' | '10' | '12'
type Pkg = {
  id: PkgId
  tokens: number
  price: number // cents
  save: number // cents
  label: string
  perToken: number // cents
  featured?: boolean
}

export type PricingProp = {
  packs: Pkg[]
  singles: { id: PkgId; price: number }[]
  packCouponAmountOff: number
  fathersDayActive: boolean
}

export type BuyTokensCopy = {
  metaTitle: string
  metaDescription: string
  ribbonText: string
  breadcrumbHome: string
  breadcrumbCurrent: string
  headingPrefix: string
  headingHighlight: string
  headingSuffix: string
  subhead: string
  step1Number: string
  step1Kicker: string
  step1Title: string
  mostPopularLabel: string
  packCodePrefix: string
  packTokensSuffix: string
  savePrefix: string
  eachSuffix: string
  quantityHeading: string
  quantitySubtext: string
  quantityDecreaseLabel: string
  quantityIncreaseLabel: string
  quantityInputLabel: string
  modeHelper: string
  modeSingleLabel: string
  modePackLabel: string
  packTokensSuffixSingle: string
  quantityHeadingSingle: string
  quantitySubtextSingle: string
  quantityInputLabelSingle: string
  tokenSingular: string
  tokenPlural: string
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
  step3Number: string
  step3Kicker: string
  step3Title: string
  deliveryHeading: string
  deliveryBody: string
  deliveryChips: string[]
  summaryHeading: string
  summaryBadge: string
  perTokenSuffix: string
  packSingular: string
  packPlural: string
  savingsLabel: string
  taxLabel: string
  taxValue: string
  totalLabel: string
  submitLabel: string
  submittingLabel: string
  erroredLabel: string
  submitDisclaimer: string
  trustItems: { line1: string; line2: string }[]
  contactPrefix: string
  contactConnector: string
  contactPhoneDisplay: string
  contactEmail: string
  checkoutErrorMessage: string
}

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`
const fmtWhole = (cents: number) => `$${Math.round(cents / 100)}`

type Mode = 'pack' | 'single'

export default function BuyTokensClient({
  copy,
  pricing,
}: {
  copy: BuyTokensCopy
  pricing: PricingProp
}) {
  const PACKAGES = pricing.packs
  const SINGLE_PRICES_BY_ID: Record<PkgId, number> = pricing.singles.reduce(
    (acc, s) => {
      acc[s.id] = s.price
      return acc
    },
    {} as Record<PkgId, number>,
  )
  const [mode, setMode] = useState<Mode>('pack')
  const [selectedId, setSelectedId] = useState<Pkg['id']>('12')
  const [quantity, setQuantity] = useState<number>(1)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [stateRegion, setStateRegion] = useState('')
  const [zip, setZip] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errored, setErrored] = useState(false)

  type PhotonFeature = {
    properties: {
      osm_id: number
      osm_type?: string
      name?: string
      housenumber?: string
      street?: string
      city?: string
      district?: string
      locality?: string
      county?: string
      state?: string
      postcode?: string
      country?: string
      countrycode?: string
      type?: string
      osm_key?: string
      osm_value?: string
    }
  }
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suppressFetch, setSuppressFetch] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    setActiveIndex(-1)
  }, [suggestions])

  useEffect(() => {
    if (suppressFetch) {
      setSuppressFetch(false)
      return
    }
    const q = street.trim()
    if (q.length < 3) {
      setSuggestions([])
      return
    }
    const controller = new AbortController()
    const handle = setTimeout(async () => {
      try {
        const url = new URL('https://photon.komoot.io/api/')
        url.searchParams.set('q', q)
        url.searchParams.set('limit', '8')
        url.searchParams.set('lang', 'en')
        const res = await fetch(url.toString(), { signal: controller.signal })
        if (!res.ok) throw new Error('Photon error')
        const data = (await res.json()) as { features: PhotonFeature[] }
        const filtered = (data.features ?? []).filter(
          (f) => f.properties.countrycode === 'US',
        )
        setSuggestions(filtered.slice(0, 6))
      } catch {
        // ignore — user can still type manually
      }
    }, 200)
    return () => {
      clearTimeout(handle)
      controller.abort()
    }
  }, [street, suppressFetch])

  const US_STATE_ABBR: Record<string, string> = {
    Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
    Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', 'District of Columbia': 'DC',
    Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL',
    Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA',
    Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN',
    Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
    Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
    Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
    Wyoming: 'WY',
  }

  function pickSuggestion(f: PhotonFeature) {
    const p = f.properties
    const line1 = [p.housenumber, p.street].filter(Boolean).join(' ').trim()
    const localityName = p.city ?? p.locality ?? p.district ?? p.county ?? ''
    const stateAbbr = p.state ? US_STATE_ABBR[p.state] ?? p.state : ''
    setSuppressFetch(true)
    if (line1) setStreet(line1)
    if (localityName) setCity(localityName)
    if (stateAbbr) setStateRegion(stateAbbr.toUpperCase())
    if (p.postcode) setZip(p.postcode)
    setSuggestions([])
    setShowSuggestions(false)
  }

  const selected = PACKAGES.find((p) => p.id === selectedId)!
  const washValue = parseInt(selected.id, 10)
  const singlePrice = SINGLE_PRICES_BY_ID[selected.id] ?? washValue * 100
  const unitPrice = mode === 'single' ? singlePrice : selected.price
  const unitSavings = mode === 'single' ? 0 : selected.save
  const tokensPerUnit = mode === 'single' ? 1 : selected.tokens
  const subtotal = unitPrice * quantity
  const savings = unitSavings * quantity
  const unitSingular = mode === 'single' ? copy.tokenSingular : copy.packSingular
  const unitPlural = mode === 'single' ? copy.tokenPlural : copy.packPlural
  const perUnitPrice = mode === 'single' ? unitPrice : Math.round(unitPrice / tokensPerUnit)

  const buttonLabel = useMemo(() => {
    if (submitting) return copy.submittingLabel
    if (errored) return copy.erroredLabel
    return copy.submitLabel
  }, [submitting, errored, copy.submittingLabel, copy.erroredLabel, copy.submitLabel])

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
          mode,
          washValue,
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim(),
        }),
      })
      const data: { url?: string; error?: string } = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Checkout failed')
      }
      window.location.href = data.url
    } catch (err) {
      setSubmitting(false)
      setErrored(true)
      const detail = err instanceof Error ? err.message : ''
      alert(detail ? `${copy.checkoutErrorMessage}\n\n${detail}` : copy.checkoutErrorMessage)
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
            <span className="text-yellow-400">{copy.breadcrumbCurrent}</span>
          </div>
          <h1 className="display m-0 text-[52px] sm:text-[72px] md:text-[96px] leading-[0.92]">
            {copy.headingPrefix}{copy.headingPrefix ? ' ' : ''}<em className="text-yellow-400">{copy.headingHighlight}</em>{copy.headingSuffix}
          </h1>
          <p className="mt-5 max-w-[560px] text-blue-100 text-base sm:text-lg leading-relaxed">
            {copy.subhead}
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
              <StepHead num={copy.step1Number} kicker={copy.step1Kicker} title={copy.step1Title} />

              {/* Mode toggle */}
              <div className="mb-6">
                {copy.modeHelper && (
                  <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#9aa9c9] mb-2.5">
                    {copy.modeHelper}
                  </div>
                )}
                <div
                  role="tablist"
                  aria-label={copy.modeHelper || 'Purchase mode'}
                  className="flex w-full sm:w-auto sm:inline-flex bg-white border-2 border-line rounded-2xl p-1 gap-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'pack'}
                    onClick={() => setMode('pack')}
                    className={
                      'flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl text-[13px] font-extrabold tracking-[0.06em] uppercase transition whitespace-nowrap ' +
                      (mode === 'pack'
                        ? 'bg-blue-500 text-white shadow-[0_6px_16px_rgba(27,79,217,0.25)]'
                        : 'text-[#5b6987] hover:text-blue-500')
                    }
                  >
                    {copy.modePackLabel}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'single'}
                    onClick={() => setMode('single')}
                    className={
                      'flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl text-[13px] font-extrabold tracking-[0.06em] uppercase transition whitespace-nowrap ' +
                      (mode === 'single'
                        ? 'bg-blue-500 text-white shadow-[0_6px_16px_rgba(27,79,217,0.25)]'
                        : 'text-[#5b6987] hover:text-blue-500')
                    }
                  >
                    {copy.modeSingleLabel}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                          {copy.mostPopularLabel}
                        </span>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <span className="mono text-[10px] font-semibold tracking-[0.22em] uppercase text-[#9aa9c9]">
                          {copy.packCodePrefix} / {String(idx + 1).padStart(2, '0')}
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
                        ${pkg.id}
                      </div>
                      <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#5b6987] mt-3">
                        {mode === 'single' ? copy.packTokensSuffixSingle : copy.packTokensSuffix}
                      </div>
                      <div className="mt-4 pt-4 border-t border-dashed border-line flex flex-col items-start gap-2">
                        {(() => {
                          const list =
                            mode === 'single'
                              ? SINGLE_PRICES_BY_ID[pkg.id] ?? parseInt(pkg.id, 10) * 100
                              : pkg.price
                          const save = mode === 'pack' ? pkg.save : 0
                          const finalPrice = Math.max(0, list - save)
                          return (
                            <>
                              <div className="flex items-baseline gap-2">
                                <span className="display text-[28px] text-blue-500 leading-none">
                                  {fmtWhole(finalPrice)}
                                </span>
                                {save > 0 && (
                                  <span className="text-[14px] font-bold text-[#9aa9c9] line-through leading-none">
                                    {fmtWhole(list)}
                                  </span>
                                )}
                              </div>
                              {save > 0 ? (
                                <span className="inline-flex items-center bg-blue-700 text-yellow-400 text-[11px] font-extrabold tracking-[0.1em] px-2.5 py-1 rounded-full leading-none">
                                  {copy.savePrefix} {fmtWhole(save)}
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[11px] font-bold tracking-[0.1em] uppercase text-[#5b6987] leading-none">
                                  {copy.eachSuffix}
                                </span>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </label>
                  )
                })}
              </div>

              <div className="mt-5 bg-white border border-line rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-extrabold text-[15px]">
                    {mode === 'single' ? copy.quantityHeadingSingle : copy.quantityHeading}
                  </div>
                  <div className="text-[13px] text-[#5b6987] mt-0.5">
                    {mode === 'single' ? copy.quantitySubtextSingle : copy.quantitySubtext}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={copy.quantityDecreaseLabel}
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
                    aria-label={mode === 'single' ? copy.quantityInputLabelSingle : copy.quantityInputLabel}
                    className="w-16 px-2 py-2 text-center text-[16px] font-extrabold border-[1.5px] border-line rounded-xl text-ink [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    aria-label={copy.quantityIncreaseLabel}
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
              <StepHead num={copy.step2Number} kicker={copy.step2Kicker} title={copy.step2Title} />
              <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block sm:col-span-2">
                  <div className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#5b6987] mb-1.5">
                    {copy.emailLabel} <span className="text-blue-500">{copy.requiredMark}</span>
                  </div>
                  <input
                    type="email"
                    required
                    placeholder={copy.emailPlaceholder}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-[1.5px] border-line rounded-xl px-4 py-3.5 text-[15px] text-ink bg-white placeholder:text-[#9aa9c9] focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(27,79,217,0.12)] transition"
                  />
                  <div className="text-[12px] text-[#5b6987] mt-1.5">
                    {copy.emailHelper}
                  </div>
                </label>
                <label className="block">
                  <div className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#5b6987] mb-1.5">
                    {copy.nameLabel} <span className="text-blue-500">{copy.requiredMark}</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={copy.namePlaceholder}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-[1.5px] border-line rounded-xl px-4 py-3.5 text-[15px] text-ink bg-white placeholder:text-[#9aa9c9] focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(27,79,217,0.12)] transition"
                  />
                </label>
                <label className="block">
                  <div className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#5b6987] mb-1.5">
                    {copy.phoneLabel}{' '}
                    <span className="text-[#9aa9c9] font-normal tracking-normal normal-case">
                      {copy.phoneOptionalLabel}
                    </span>
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder={copy.phonePlaceholder}
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border-[1.5px] border-line rounded-xl px-4 py-3.5 text-[15px] text-ink bg-white placeholder:text-[#9aa9c9] focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(27,79,217,0.12)] transition"
                  />
                </label>

                <label className="block sm:col-span-2 relative">
                  <div className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#5b6987] mb-1.5">
                    Street address
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="123 Roosevelt Rd"
                    autoComplete="street-address"
                    value={street}
                    onChange={(e) => {
                      setStreet(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onKeyDown={(e) => {
                      if (!showSuggestions || suggestions.length === 0) return
                      if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        setActiveIndex((i) => (i + 1) % suggestions.length)
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        setActiveIndex((i) =>
                          i <= 0 ? suggestions.length - 1 : i - 1,
                        )
                      } else if (e.key === 'Enter') {
                        if (activeIndex >= 0 && activeIndex < suggestions.length) {
                          e.preventDefault()
                          pickSuggestion(suggestions[activeIndex])
                        }
                      } else if (e.key === 'Escape') {
                        setShowSuggestions(false)
                      }
                    }}
                    aria-autocomplete="list"
                    aria-expanded={showSuggestions && suggestions.length > 0}
                    aria-activedescendant={
                      activeIndex >= 0 ? `addr-opt-${activeIndex}` : undefined
                    }
                    className="w-full border-[1.5px] border-line rounded-xl px-4 py-3.5 text-[15px] text-ink bg-white placeholder:text-[#9aa9c9] focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(27,79,217,0.12)] transition"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul
                      role="listbox"
                      className="absolute z-20 left-0 right-0 mt-1.5 bg-white border-[1.5px] border-line rounded-xl shadow-[0_12px_30px_rgba(8,24,63,0.15)] overflow-hidden max-h-72 overflow-y-auto"
                    >
                      {suggestions.map((f, i) => {
                        const p = f.properties
                        const primary = [p.housenumber, p.street]
                          .filter(Boolean)
                          .join(' ')
                          .trim()
                        const secondary = [
                          p.city ?? p.locality ?? p.district ?? p.county,
                          p.state,
                          p.postcode,
                        ]
                          .filter(Boolean)
                          .join(', ')
                        const active = i === activeIndex
                        return (
                          <li
                            key={`${p.osm_type ?? ''}${p.osm_id}-${i}`}
                            id={`addr-opt-${i}`}
                            role="option"
                            aria-selected={active}
                            tabIndex={-1}
                            onMouseEnter={() => setActiveIndex(i)}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              pickSuggestion(f)
                            }}
                            className={
                              'px-4 py-2.5 text-[14px] text-ink cursor-pointer border-b border-line last:border-b-0 ' +
                              (active ? 'bg-paper' : 'hover:bg-paper')
                            }
                          >
                            <div className="font-bold">{primary || p.name}</div>
                            {secondary && (
                              <div className="text-[12px] text-[#5b6987]">{secondary}</div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </label>

                <label className="block sm:col-span-2">
                  <div className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#5b6987] mb-1.5">
                    City, state &amp; ZIP
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-4">
                    <input
                      type="text"
                      required
                      placeholder="Forest Park"
                      autoComplete="address-level2"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      aria-label="City"
                      className="w-full border-[1.5px] border-line rounded-xl px-4 py-3.5 text-[15px] text-ink bg-white placeholder:text-[#9aa9c9] focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(27,79,217,0.12)] transition"
                    />
                    <input
                      type="text"
                      required
                      placeholder="IL"
                      autoComplete="address-level1"
                      maxLength={2}
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value.toUpperCase())}
                      aria-label="State"
                      className="w-full border-[1.5px] border-line rounded-xl px-4 py-3.5 text-[15px] text-ink bg-white placeholder:text-[#9aa9c9] focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(27,79,217,0.12)] transition uppercase"
                    />
                    <input
                      type="text"
                      required
                      placeholder="60130"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      aria-label="ZIP"
                      className="w-full border-[1.5px] border-line rounded-xl px-4 py-3.5 text-[15px] text-ink bg-white placeholder:text-[#9aa9c9] focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(27,79,217,0.12)] transition"
                    />
                  </div>
                </label>
              </div>
            </section>

            {/* STEP 3 — DELIVERY */}
            <section>
              <StepHead num={copy.step3Number} kicker={copy.step3Kicker} title={copy.step3Title} />
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
                  <div className="font-extrabold">{copy.deliveryHeading}</div>
                  <p className="mt-1 mb-0 text-[14px] leading-relaxed text-[#445273]">
                    {copy.deliveryBody}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {copy.deliveryChips.map((chip, i) => (
                      <span
                        key={i}
                        className="bg-paper text-[#1c2c52] text-[12px] font-bold px-2.5 py-1.5 rounded-full"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN — ORDER SUMMARY */}
          <aside className="self-start lg:sticky lg:top-[120px]">
            <div className="bg-blue-700 text-white rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(8,24,63,0.35)]">
              <div className="bg-blue-500 px-6 py-5 border-b-2 border-blue-700 flex items-center justify-between">
                <span className="display text-[22px]">{copy.summaryHeading}</span>
                <span className="mono text-[10px] font-extrabold tracking-[0.22em] uppercase bg-yellow-400 text-blue-700 px-2.5 py-1 rounded-full">
                  {copy.summaryBadge}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/15">
                  <div>
                    <div className="font-extrabold text-[16px]">
                      {mode === 'single' ? `$${selected.id} wash · ${copy.tokenSingular}` : selected.label}
                    </div>
                    <div className="text-[13px] text-blue-200 mt-0.5">
                      {fmt(perUnitPrice)} {copy.perTokenSuffix} · ×{quantity}{' '}
                      {quantity === 1 ? unitSingular : unitPlural}
                    </div>
                  </div>
                  <div className="display text-[26px] text-yellow-400 leading-none">
                    {fmt(subtotal)}
                  </div>
                </div>

                {savings > 0 && (
                  <div className="flex items-center justify-between py-3 border-b border-white/15 text-[14px]">
                    <span className="text-blue-100">{copy.savingsLabel}</span>
                    <span className="font-extrabold text-yellow-400">{fmt(savings)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-3 text-[14px]">
                  <span className="text-blue-100">{copy.taxLabel}</span>
                  <span className="mono text-blue-200">{copy.taxValue}</span>
                </div>

                <div className="mt-2 pt-4 border-t-2 border-yellow-400 flex items-baseline justify-between">
                  <span className="display text-[20px]">{copy.totalLabel}</span>
                  <span className="display text-[40px] text-yellow-400 leading-none">
                    {fmt(Math.max(0, subtotal - savings))}
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
                  {copy.submitDisclaimer}
                </p>
              </div>
            </div>

            {/* Trust strip */}
            <div className="mt-4 bg-white border border-line rounded-2xl p-4 grid grid-cols-3 gap-2 text-center">
              {copy.trustItems.map((item, i) => (
                <TrustItem
                  key={i}
                  lines={[item.line1, item.line2]}
                  icon={TRUST_ICONS[i] ?? TRUST_ICONS[0]}
                />
              ))}
            </div>

            <p className="text-center text-[12px] text-[#5b6987] mt-4 leading-relaxed">
              {copy.contactPrefix}{' '}
              <a
                href="tel:7087712945"
                className="font-bold text-blue-500 hover:text-blue-700 transition"
              >
                {copy.contactPhoneDisplay}
              </a>{' '}
              {copy.contactConnector}{' '}
              <a
                href={`mailto:${copy.contactEmail}`}
                className="font-bold text-blue-500 hover:text-blue-700 transition"
              >
                {copy.contactEmail}
              </a>
            </p>
          </aside>
        </form>
      </section>
    </>
  )
}

const TRUST_ICONS: React.ReactNode[] = [
  <path key="shield" d="M12 2l9 4v6c0 5-3.8 9.7-9 10-5.2-.3-9-5-9-10V6l9-4z M9 12l2 2 4-4" />,
  <g key="pin">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
    <circle cx="12" cy="10" r="3" />
  </g>,
  <path key="badge" d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" />,
]

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

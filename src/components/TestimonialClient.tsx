'use client'

import { useEffect, useState } from 'react'
import type { ImageWithAlt } from '@/lib/sanityImage'
import SanityImage from './SanityImage'

export type Quote = {
  text: string
  attribution: string
  date?: string | null
  source?: string | null
  avatar?: ImageWithAlt | null
  rating?: number | null
}

const AUTOPLAY_MS = 5000

function Star({ filled = true }: { filled?: boolean }) {
  return (
    <svg
      className={'w-5 h-5 ' + (filled ? 'text-yellow-400' : 'text-line')}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18 22l-6-3.7L6 22l1.5-7.2L2 10l7.1-1.1z" />
    </svg>
  )
}

function GoogleG() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M21.35 11.1H12v3.2h5.35c-.25 1.5-1.85 4.4-5.35 4.4-3.2 0-5.85-2.65-5.85-5.95s2.65-5.95 5.85-5.95c1.85 0 3.05.8 3.75 1.45l2.55-2.45C16.7 4.45 14.55 3.5 12 3.5 6.95 3.5 2.85 7.6 2.85 12.65S6.95 21.8 12 21.8c5.85 0 9.7-4.1 9.7-9.85 0-.65-.05-1.15-.15-1.65z"
        fill="#4285F4"
      />
    </svg>
  )
}

function formatDate(d?: string | null) {
  if (!d) return null
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

type Props = {
  quotes: Quote[]
  eyebrow?: string
  heading?: string
  aggregateRating?: number | null
  totalReviews?: number | null
  googleProfileUrl?: string | null
}

export default function TestimonialClient({
  quotes,
  eyebrow,
  heading,
  aggregateRating,
  totalReviews,
  googleProfileUrl,
}: Props) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setI((x) => (x + 1) % quotes.length), AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [paused, quotes.length])

  const next = () => setI((x) => (x + 1) % quotes.length)
  const prev = () => setI((x) => (x - 1 + quotes.length) % quotes.length)
  const goTo = (n: number) => setI(n)
  const current = quotes[i]
  const rating = Math.max(1, Math.min(5, current.rating ?? 5))

  return (
    <section
      className="py-16 md:py-20 bg-paper"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Customer testimonials"
    >
      <div className="max-w-[860px] mx-auto px-5 md:px-7 text-center">
        {(eyebrow || heading) && (
          <div className="mb-8">
            {eyebrow && (
              <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-3">
                <GoogleG />
                {eyebrow}
              </div>
            )}
            {heading && (
              <h2 className="display text-[32px] sm:text-[44px] md:text-[56px] m-0 leading-[1.05] text-ink">
                {heading}
              </h2>
            )}
          </div>
        )}

        {aggregateRating && totalReviews && (
          <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-white border border-line rounded-full px-5 py-2.5 mb-8 shadow-[0_4px_12px_rgba(8,24,63,.06)]">
            <span className="display text-[24px] leading-none text-ink">
              {aggregateRating.toFixed(1)}
            </span>
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, n) => (
                <Star key={n} filled={n < Math.round(aggregateRating)} />
              ))}
            </span>
            <span className="text-[13px] text-[#5b6987] font-semibold">
              {totalReviews} Google reviews
            </span>
            {googleProfileUrl && (
              <a
                href={googleProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-bold text-blue-500 hover:text-blue-700 underline underline-offset-2"
              >
                View on Google →
              </a>
            )}
          </div>
        )}

        <div className="flex justify-center gap-1 mb-6">
          {Array.from({ length: rating }).map((_, n) => (
            <Star key={n} />
          ))}
        </div>

        <div className="relative min-h-[180px] sm:min-h-[200px] md:min-h-[240px]">
          {quotes.map((q, n) => {
            const formattedDate = formatDate(q.date)
            const isGoogle = q.source === 'google'
            return (
              <div
                key={n}
                className={
                  'absolute inset-0 transition-opacity duration-500 ' +
                  (n === i ? 'opacity-100' : 'opacity-0 pointer-events-none')
                }
                aria-hidden={n !== i}
              >
                <blockquote className="display text-[24px] sm:text-[32px] md:text-[40px] text-ink leading-tight">
                  “{q.text}”
                </blockquote>
                <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
                  {q.avatar?.asset?._ref && (
                    <SanityImage
                      image={q.avatar}
                      width={56}
                      height={56}
                      className="w-10 h-10 rounded-full object-cover border border-line"
                    />
                  )}
                  <div className="mono text-[13px] tracking-[0.18em] uppercase text-[#5b6987]">
                    — {q.attribution}
                    {formattedDate && (
                      <span className="text-[#9aa6c0] ml-2 normal-case tracking-normal font-sans text-[12px]">
                        · {formattedDate}
                      </span>
                    )}
                  </div>
                  {isGoogle && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] uppercase text-[#5b6987] bg-paper border border-line rounded-full px-2.5 py-1">
                      <GoogleG />
                      Verified Google review
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous testimonial"
            className="w-10 h-10 rounded-full border border-line bg-white text-ink hover:border-blue-500 hover:text-blue-500 transition flex items-center justify-center"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="flex gap-2">
            {quotes.map((_, n) => (
              <button
                key={n}
                type="button"
                onClick={() => goTo(n)}
                aria-label={`Go to testimonial ${n + 1}`}
                aria-current={n === i}
                className="w-6 h-6 flex items-center justify-center group"
              >
                <span
                  className={
                    'block h-2 rounded-full transition-all ' +
                    (n === i ? 'w-8 bg-blue-500' : 'w-2 bg-line group-hover:bg-blue-500/40')
                  }
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            aria-label="Next testimonial"
            className="w-10 h-10 rounded-full border border-line bg-white text-ink hover:border-blue-500 hover:text-blue-500 transition flex items-center justify-center"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

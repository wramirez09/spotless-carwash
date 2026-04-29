'use client'

import { useEffect, useState } from 'react'

export type Quote = { text: string; attribution: string }

const AUTOPLAY_MS = 5000

function Star() {
  return (
    <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18 22l-6-3.7L6 22l1.5-7.2L2 10l7.1-1.1z" />
    </svg>
  )
}

export default function TestimonialClient({ quotes }: { quotes: Quote[] }) {
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

  return (
    <section
      className="py-16 md:py-20 bg-paper"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Customer testimonials"
    >
      <div className="max-w-[860px] mx-auto px-5 md:px-7 text-center">
        <div className="flex justify-center gap-1 mb-6">
          {Array.from({ length: 5 }).map((_, n) => (
            <Star key={n} />
          ))}
        </div>

        <div className="relative min-h-[180px] sm:min-h-[200px] md:min-h-[240px]">
          {quotes.map((q, n) => (
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
              <div className="mt-6 mono text-[13px] tracking-[0.18em] uppercase text-[#5b6987]">
                — {q.attribution}
              </div>
            </div>
          ))}
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

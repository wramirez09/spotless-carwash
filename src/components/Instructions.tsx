import { sanityFetch } from '@/lib/sanityFetch'
import { renderHighlight } from '@/lib/renderHighlight'
import { dialSteps as fallbackDial, type DialStep } from '@/src/data/dial'

type InstructionsData = {
  eyebrow: string
  sectionNumber: string
  headlineLine1: string
  headlineLine2: string
  tip: string
  priceLabel: string
  steps: DialStep[]
}

const INSTRUCTIONS_QUERY = `{
  "section": *[_type == "instructions"][0]{
    eyebrow, sectionNumber,
    headlineLine1, headlineLine2, tip, priceLabel
  },
  "steps": *[_type == "dialStep"] | order(n asc){ n, title, description }
}`

const FALLBACK: Omit<InstructionsData, 'steps'> = {
  eyebrow: 'Self-serve dial',
  sectionNumber: '05',
  headlineLine1: 'Nine settings.',
  headlineLine2: 'One **clean** car.',
  tip:
    'Nine premium wash settings at your fingertips — engine cleaner, tire & wheel cleaner, low-pressure presoak, high-pressure detergent, foaming brush, high-pressure rinse, clear coat sealant, LustraShield surface gloss, and spot-free rinse.\n\n$4.00 for 5 mins.\n\nFor best results, work top-to-bottom. Let presoak dwell 10–20 seconds before rinsing, and always finish with the spot-free rinse — never LustraShield as the last step.',
  priceLabel: '$4 / 5 min',
}

export default async function Instructions() {
  const data = await sanityFetch<{
    section?: Partial<InstructionsData>
    steps?: DialStep[]
  }>(INSTRUCTIONS_QUERY)

  const section = { ...FALLBACK, ...(data?.section ?? {}) }
  const steps: DialStep[] = data?.steps?.length ? data.steps : fallbackDial

  return (
    <section className="bg-[#0a1b3f] text-white py-16 md:py-24">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7 grid md:grid-cols-[.9fr_1.1fr] gap-10 md:gap-15 items-start">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-yellow-400 mb-2.5">
            <span className="mono text-[#a0b3da] font-medium">{section.sectionNumber} /</span> {section.eyebrow}
          </div>
          <h2 className="display text-[40px] sm:text-[56px] md:text-[72px] m-0 text-white">
            {section.headlineLine1}
            <br />
            {renderHighlight(section.headlineLine2, 'text-yellow-400')}
          </h2>
          <div className="max-w-[380px] mt-6">
            {section.tip.split(/\n\n+/).map((para, i) => {
              const isPrice = /^\$[\d.]+/.test(para.trim())
              if (isPrice) {
                return (
                  <p
                    key={i}
                    className="my-5 inline-block mono text-[13px] font-semibold bg-yellow-400/10 text-yellow-400 px-3 py-1.5 rounded-lg"
                  >
                    {para}
                  </p>
                )
              }
              return (
                <p
                  key={i}
                  className={
                    'm-0 text-blue-100 leading-relaxed' +
                    (i > 0 ? ' mt-6 pt-6 border-t border-white/10' : '')
                  }
                >
                  {para}
                </p>
              )
            })}
          </div>
        </div>
        <ol className="list-none p-0 m-0 bg-white/5 border border-white/10 rounded-[20px] overflow-hidden">
          {steps.map((s, i) => (
            <li
              key={s.n}
              value={s.n}
              className={
                'grid grid-cols-[60px_1fr_auto] sm:grid-cols-[80px_1fr_120px] items-center px-5 sm:px-6 py-4 gap-5' +
                (i < steps.length - 1 ? ' border-b border-white/10' : '')
              }
            >
              <div aria-hidden className="display text-[28px] text-yellow-400 leading-none">{s.n}</div>
              <div>
                <h3 className="m-0 mb-0.5 text-base font-extrabold tracking-tight">{s.title}</h3>
                <p className="m-0 text-[13px] text-blue-100 leading-snug">{s.description}</p>
              </div>
              <div className="mono text-[13px] font-semibold bg-yellow-400/10 text-yellow-400 px-2.5 py-1.5 rounded-lg text-center">
                {section.priceLabel}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

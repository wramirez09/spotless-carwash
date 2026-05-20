import { sanityFetch } from '@/lib/sanityFetch'
import { renderHighlight } from '@/lib/renderHighlight'
import DialChart, { type SanityDialRow } from './DialChart'

type InstructionsData = {
  eyebrow: string
  sectionNumber: string
  headlineLine1: string
  headlineLine2: string
  tip: string
  priceLabel: string
  dialRows?: SanityDialRow[] | null
}

const INSTRUCTIONS_QUERY = `*[_type == "instructions"][0]{
  eyebrow, sectionNumber,
  headlineLine1, headlineLine2, tip, priceLabel,
  dialRows[]{ label, spectrumPrefix, instructionLine1, instructionLine2, bgColor, fgColor, variant }
}`

const FALLBACK: InstructionsData = {
  eyebrow: 'Self-serve dial',
  sectionNumber: '05',
  headlineLine1: 'Ten settings.',
  headlineLine2: 'One **clean** car.',
  tip:
    'Ten premium wash settings at your fingertips — tire & wheel cleaner, low-pressure presoak, high-pressure detergent, foaming brush, high-pressure rinse, clear coat sealant, Durashield surface gloss, spot-free rinse and air shammee dryer.\n\n$4.00 for 5 mins.\n\nFor best results, work top-to-bottom. Let presoak dwell 10–20 seconds before rinsing, and always finish with the spot-free rinse — never Durashield as the last step.',
  priceLabel: '$4 / 5 min',
}

export default async function Instructions() {
  const data = await sanityFetch<Partial<InstructionsData>>(INSTRUCTIONS_QUERY)
  const section = { ...FALLBACK, ...(data ?? {}) }

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
          <p className="max-w-[380px] text-blue-100 leading-relaxed mt-6">{section.tip}</p>
        </div>
        <DialChart rows={section.dialRows ?? undefined} />
      </div>
    </section>
  )
}

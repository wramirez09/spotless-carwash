import { sanityFetch } from '@/lib/sanityFetch'
import { renderHighlight } from '@/lib/renderHighlight'
import { packages as fallbackPackages, type Pkg, type WashColor } from '@/src/data/washes'

type WashesData = {
  eyebrow: string
  sectionNumber: string
  heading: string
  subhead: string
  packages: Pkg[]
}

const WASHES_QUERY = `{
  "section": *[_type == "washesSection"][0]{
    eyebrow, sectionNumber, heading, subhead
  },
  "packages": *[_type == "washPackage"] | order(order asc, priceNumber asc){
    num, name, price, priceNumber, color, featured,
    features[]{ text, included }
  }
}`

const WASHES_FALLBACK: Omit<WashesData, 'packages'> = {
  eyebrow: 'Wash packages',
  sectionNumber: '01',
  heading: 'Four ways to make your car **shine**.',
  subhead:
    'Top three packages include the air cannon dryers. Pay at the cash station with Visa, Mastercard, Amex, tap, Apple Pay, cash, or wash tokens — choose, then wait for green.',
}

function Check({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M5 12l5 5L20 7" />
    </svg>
  )
}

const colorBadge: Record<WashColor, string> = {
  red: 'bg-red-500 text-white',
  green: 'bg-emerald-500 text-white',
  purple: 'bg-purple-500 text-white',
  blue: 'bg-sky-500 text-white',
}

const colorAccent: Record<WashColor, string> = {
  red: 'bg-red-500',
  green: 'bg-emerald-500',
  purple: 'bg-purple-500',
  blue: 'bg-sky-500',
}

function Card({ pkg }: { pkg: Pkg }) {
  if (pkg.featured) {
    return (
      <article className="relative overflow-hidden bg-blue-500 text-white border border-blue-700 rounded-2xl p-6 flex flex-col gap-3.5 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(27,79,217,.3)] transition">
        <span className={`absolute top-0 left-0 right-0 h-1.5 ${colorAccent[pkg.color]}`}></span>
        <div className="flex items-center justify-between">
          <span className="mono text-xs font-semibold text-blue-100">WASH / {pkg.num}</span>
          <span className={`text-[10px] tracking-[0.16em] font-extrabold px-2.5 py-1 rounded-full uppercase ${colorBadge[pkg.color]}`}>
            Most picked
          </span>
        </div>
        <h3 className="display text-[32px] m-0">{pkg.name}</h3>
        <div className="display text-[54px] leading-none">
          {pkg.price}
          <small className="text-lg font-bold text-blue-100 not-italic font-sans ml-1">/wash</small>
        </div>
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {pkg.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-blue-100 leading-snug">
              <Check className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              {f.text}
            </li>
          ))}
        </ul>
        <a
          href="#tokens"
          className="mt-auto bg-yellow-400 text-blue-700 text-center py-3 rounded-xl font-bold text-sm border border-yellow-400 hover:bg-white transition"
        >
          Choose {pkg.name}
        </a>
      </article>
    )
  }
  return (
    <article className="hover:lift bg-white border border-line rounded-2xl p-6 flex flex-col gap-3.5 hover:-translate-y-1 hover:border-blue-500 hover:shadow-[0_18px_40px_rgba(27,79,217,.12)] transition relative overflow-hidden">
      <span className={`absolute top-0 left-0 right-0 h-1.5 ${colorAccent[pkg.color]}`}></span>
      <div className="flex items-center justify-between">
        <span className="mono text-xs font-semibold text-[#5b6987]">WASH / {pkg.num}</span>
        <span className={`text-[10px] tracking-[0.16em] font-extrabold px-2.5 py-1 rounded-full uppercase ${colorBadge[pkg.color]}`}>
          {pkg.color}
        </span>
      </div>
      <h3 className="display text-[32px] m-0">{pkg.name}</h3>
      <div className="display text-[54px] leading-none">
        {pkg.price}
        <small className="text-lg font-bold text-[#5b6987] not-italic font-sans ml-1">/wash</small>
      </div>
      <ul className="list-none p-0 m-0 flex flex-col gap-2">
        {pkg.features.map((f, i) =>
          f.included ? (
            <li key={i} className="flex items-start gap-2 text-sm text-[#445273] leading-snug">
              <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              {f.text}
            </li>
          ) : (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-[#5b6987] leading-snug line-through"
            >
              <Check className="w-4 h-4 text-[#cfd6e6] mt-0.5 shrink-0" />
              {f.text}
            </li>
          ),
        )}
      </ul>
      <a
        href="#tokens"
        className="mt-auto bg-paper text-ink text-center py-3 rounded-xl font-bold text-sm border border-line hover:bg-blue-500 hover:text-white hover:border-blue-500 transition"
      >
        Choose {pkg.name}
      </a>
    </article>
  )
}

export default async function Washes() {
  const data = await sanityFetch<{
    section?: Partial<WashesData>
    packages?: Pkg[]
  }>(WASHES_QUERY)

  const section = { ...WASHES_FALLBACK, ...(data?.section ?? {}) }
  const packages: Pkg[] = data?.packages?.length ? data.packages : fallbackPackages

  return (
    <section id="washes" className="py-16 md:py-24">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7">
        <div className="flex items-end justify-between gap-10 mb-10 md:mb-12 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2.5">
              <span className="mono text-[#5b6987] font-medium">{section.sectionNumber} /</span> {section.eyebrow}
            </div>
            <h2 className="display text-[40px] sm:text-[56px] md:text-[72px] max-w-[780px] m-0">
              {renderHighlight(section.heading, 'text-blue-500 yellow-hl')}
            </h2>
          </div>
          <p className="max-w-[380px] text-[#445273] leading-relaxed">{section.subhead}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((p) => (
            <Card key={p.num} pkg={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

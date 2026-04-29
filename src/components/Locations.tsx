import Link from 'next/link'
import { sanityFetch } from '@/lib/sanityFetch'
import { renderHighlight } from '@/lib/renderHighlight'
import {
  locations as fallbackLocations,
  directionsUrl,
  type Location,
} from '@/src/data/locations'

type LocationsSectionData = {
  eyebrow: string
  sectionNumber: string
  heading: string
  subhead: string
  locations: Location[]
}

const LOCATIONS_QUERY = `{
  "section": *[_type == "locationsSection"][0]{
    eyebrow, sectionNumber, heading, subhead
  },
  "locations": *[_type == "location"]{
    "slug": slug.current,
    name, street, city, region, postalCode,
    phone, phoneHref, selfServeBays, touchlessBays, heated,
    gradient
  }
}`

const LOCATIONS_FALLBACK: Omit<LocationsSectionData, 'locations'> = {
  eyebrow: 'Locations',
  sectionNumber: '03',
  heading: 'Two locations. Ten bays. All in **Forest Park**.',
  subhead:
    'Both locations open 7am–10pm daily. Roosevelt Road has heated, enclosed automatic bays for winter washing.',
}

function Pin() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function Card({ loc }: { loc: Location }) {
  return (
    <article className="bg-white rounded-[22px] overflow-hidden border border-line flex flex-col">
      <div
        className="h-[240px] relative flex items-end p-6 text-white stripe"
        style={{ background: loc.gradient }}
      >
        <span className="absolute top-3.5 right-3.5 mono text-[11px] text-white/50 bg-black/20 px-2 py-1 rounded">
          {loc.photoCaption}
        </span>
        <h3 className="display text-[48px] m-0 relative">{loc.name}</h3>
      </div>
      <div className="p-7 flex flex-col gap-3.5 flex-1">
        <div className="flex items-start gap-2.5 text-[#445273] leading-relaxed">
          <Pin />
          <div>
            {loc.street}
            <br />
            {loc.city}, {loc.region} {loc.postalCode}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3.5 py-4 border-y border-dashed border-line">
          <div>
            <div className="display text-3xl text-blue-500">{loc.selfServeBays}</div>
            <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#5b6987] mt-0.5">
              Self-serve bays
            </div>
          </div>
          <div>
            <div className="display text-3xl text-blue-500">{loc.touchlessBays}</div>
            <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#5b6987] mt-0.5">
              Touchless auto
            </div>
          </div>
          <div>
            <div className="display text-3xl text-blue-500">7–10</div>
            <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#5b6987] mt-0.5">
              Daily hours
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-blue-500 font-bold inline-flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full bg-sky-400 animate-pulse2"
              style={{ boxShadow: '0 0 0 4px rgba(91,168,255,.25)' }}
            ></span>
            Open now
          </span>
          <a href={loc.phoneHref} className="mono text-[13px] text-[#5b6987]">
            {loc.phone}
          </a>
        </div>
        <div className="flex gap-2.5 mt-auto pt-3.5">
          <a
            href={directionsUrl(loc)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 text-center rounded-xl font-bold text-sm bg-blue-500 text-white border border-blue-500 hover:bg-blue-700 transition"
          >
            Get directions
          </a>
          <Link
            href={`/locations/${loc.slug}`}
            className="flex-1 py-3 text-center rounded-xl font-bold text-sm border border-line hover:border-blue-500 hover:text-blue-500 transition"
          >
            Site details
          </Link>
        </div>
      </div>
    </article>
  )
}

export default async function Locations() {
  const data = await sanityFetch<{
    section?: Partial<LocationsSectionData>
    locations?: Location[]
  }>(LOCATIONS_QUERY)

  const section = { ...LOCATIONS_FALLBACK, ...(data?.section ?? {}) }
  const locs: Location[] = data?.locations?.length ? data.locations : fallbackLocations

  return (
    <section id="locations" className="bg-paper2 border-y border-line py-16 md:py-24">
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

        <div className="grid md:grid-cols-2 gap-6">
          {locs.map((l) => (
            <Card key={l.slug} loc={l} />
          ))}
        </div>
      </div>
    </section>
  )
}

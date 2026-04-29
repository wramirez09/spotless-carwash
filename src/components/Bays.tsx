import { sanityFetch } from '@/lib/sanityFetch'
import { renderHighlight } from '@/lib/renderHighlight'

type Bay = {
  titleLine1: string
  titleLine2: string
  desc: string
  features: string[]
  bgClass?: string
  bgStyle?: React.CSSProperties
  icon: React.ReactNode
}

type BaysData = {
  eyebrow: string
  sectionNumber: string
  heading: string
  subhead: string
  bays: Pick<Bay, 'titleLine1' | 'titleLine2' | 'desc' | 'features'>[]
}

const BAYS_QUERY = `*[_type == "bays"][0]{
  eyebrow, sectionNumber, heading, subhead,
  bays[]{ titleLine1, titleLine2, desc, features }
}`

const BAYS_FALLBACK: BaysData = {
  eyebrow: 'Two ways to wash',
  sectionNumber: '04',
  heading: 'Sit back, or **do it yourself**.',
  subhead:
    'Hands-free touchless automatic washes, or self-serve bays with foaming brushes when you want to do it yourself.',
  bays: [
    {
      titleLine1: 'Touchless',
      titleLine2: 'Automatic Bays',
      desc:
        'Nothing touches your vehicle except soap, wax, and water. Simply pull in, and our touchless wash does the rest. At our Roosevelt Road location, heated enclosed bays keep your vehicle washed and blow-dried indoors — perfect for winter.',
      features: ['Heated indoor bays', 'Air cannon dryers', '~4 min wash', 'Brushless & scratchless'],
    },
    {
      titleLine1: 'Self-Serve',
      titleLine2: 'Wand Bays',
      desc:
        'Nine premium wash options at your fingertips: engine cleaner, tire & wheel cleaner, low-pressure presoak, high-pressure detergent, foaming brush, high-pressure rinse, clear coat sealant, LustraShield, and spot-free rinse. $4 for 5 minutes.',
      features: ['9 wash products', 'Spot-free rinse', 'LustraShield', 'Foaming brush'],
    },
  ],
}

const BG_CLASSES = ['bay-stripe', 'bg-blue-500'] as const
const ICONS: React.ReactNode[] = [
  (
    <svg className="w-[120px] h-[120px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M3 17h18M5 17v-5l2-5h10l2 5v5M7 17v2M17 17v2" />
      <circle cx="8" cy="14" r="1" />
      <circle cx="16" cy="14" r="1" />
    </svg>
  ),
  (
    <svg className="w-[120px] h-[120px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M5 21l4-9M9 12l3-8 3 8M15 12l4 9M9 12h6" />
      <circle cx="12" cy="3" r="1.5" />
    </svg>
  ),
]

function Card({ bay, index }: { bay: Bay; index: number }) {
  return (
    <article className="bg-white border border-line rounded-[22px] overflow-hidden flex flex-col">
      <div className={`h-[280px] relative overflow-hidden ${bay.bgClass ?? ''}`} style={bay.bgStyle}>
        <span className="absolute top-4 left-4 mono text-[11px] text-white/60 bg-black/40 px-2.5 py-1.5 rounded z-10">
          // photo: bay-{index + 1}.jpg
        </span>
        <div className="absolute inset-0 flex items-center justify-center text-white/20">
          {bay.icon}
        </div>
      </div>
      <div className="p-8 flex flex-col gap-4.5 flex-1">
        <h3 className="display text-[36px] m-0 leading-none mb-3">
          {bay.titleLine1}
          <br />
          {bay.titleLine2}
        </h3>
        <p className="m-0 text-[#445273] leading-relaxed mb-3">{bay.desc}</p>
        <div className="grid grid-cols-2 gap-2.5">
          {bay.features.map((f) => (
            <div
              key={f}
              className="flex items-center gap-2 text-[13px] text-[#1c2c52] bg-paper px-3 py-2.5 rounded-xl font-semibold"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {f}
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

export default async function Bays() {
  const data = await sanityFetch<Partial<BaysData>>(BAYS_QUERY)
  const section: BaysData = {
    ...BAYS_FALLBACK,
    ...(data ?? {}),
    bays: data?.bays?.length ? data.bays : BAYS_FALLBACK.bays,
  }
  const bays: Bay[] = section.bays.map((b, i) => ({
    ...b,
    bgClass: BG_CLASSES[i] ?? BG_CLASSES[0],
    icon: ICONS[i] ?? ICONS[0],
  }))

  return (
    <section id="bays" className="py-16 md:py-24">
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
          <p className="max-w-[380px] text-[#445273] leading-relaxed">
            {section.subhead}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {bays.map((b, i) => (
            <Card key={i} bay={b} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

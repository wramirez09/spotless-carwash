import Image from 'next/image'
import { sanityFetch } from '@/lib/sanityFetch'
import { renderHighlight } from '@/lib/renderHighlight'
import type { ImageWithAlt } from '../../lib/sanityImage'
import SanityImage from './SanityImage'

type BayKind = 'automatic' | 'self-serve'



type BayContent = {
  titleLine1: string
  titleLine2: string
  desc: string
  features: string[]
  photo?: ImageWithAlt | null
  kind?: BayKind
}

type Bay = BayContent & {
  bgClass?: string
  bgStyle?: React.CSSProperties
  icon: React.ReactNode
}

type BaysData = {
  eyebrow: string
  sectionNumber: string
  heading: string
  subhead: string
  bays: BayContent[]
}

const BAYS_QUERY = `*[_type == "bays"][0]{
  eyebrow, sectionNumber, heading, subhead,
  bays[]{ titleLine1, titleLine2, desc, features, photo, kind }
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
        'Drive in, drive out — clean in 4½ minutes. No brushes. No swirl marks. No risk to fresh paint or ceramic coatings. Roosevelt Rd\'s heated indoor bays let you wash year-round, even at -10°.',
      features: ['Heated indoor bays (Roosevelt Rd)', 'Air cannon dryers', '~4½ min wash', 'Brushless & scratchless'],
      kind: 'automatic',
    },
    {
      titleLine1: 'Self-Serve',
      titleLine2: 'Wand Bays',
      desc:
        'Wash it your way. Nine settings — from engine cleaner to Durashield gloss to spot-free rinse — for $4 every 5 minutes. Full dial walkthrough below.',
      features: ['9 wash settings', 'Spot-free rinse', 'Durashield gloss', 'Foaming brush'],
      kind: 'self-serve',
    },
  ],
}

const BG_BY_KIND: Record<BayKind, string> = {
  automatic: 'bay-stripe',
  'self-serve': 'bg-blue-500',
}

const ICON_BY_KIND: Record<BayKind, React.ReactNode> = {
  automatic: (
    <svg className="w-[120px] h-[120px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M3 17h18M5 17v-5l2-5h10l2 5v5M7 17v2M17 17v2" />
      <circle cx="8" cy="14" r="1" />
      <circle cx="16" cy="14" r="1" />
    </svg>
  ),
  'self-serve': (
    <svg className="w-[120px] h-[120px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M5 21l4-9M9 12l3-8 3 8M15 12l4 9M9 12h6" />
      <circle cx="12" cy="3" r="1.5" />
    </svg>
  ),
}

const LOCAL_PHOTO_BY_KIND: Record<BayKind, { src: string; alt: string; caption: string; objectPosition: string }> = {
  automatic: {
    src: '/images/roosevelt-bay.jpg',
    alt: 'Heated touchless automatic car wash bay interior at Spotless Carwash Roosevelt Rd, Forest Park IL',
    caption: '// touchless-bay',
    objectPosition: '50% 55%',
  },
  'self-serve': {
    src: '/images/self-serve-bay.jpg',
    alt: 'Self-serve wand car wash bays at Spotless Carwash, Forest Park IL — nine wash settings for $4',
    caption: '// self-serve-bays',
    objectPosition: '50% 60%',
  },
}

type LocalPhoto = { src: string; alt: string; caption: string; objectPosition: string }
type PhotoOverride = ImageWithAlt | LocalPhoto | null | undefined

function isSanityImage(v: PhotoOverride): v is ImageWithAlt {
  return !!v && typeof v === 'object' && 'asset' in v && !!(v as ImageWithAlt).asset?._ref
}

function Card({
  bay,
  index,
  photoOverrides,
}: {
  bay: Bay
  index: number
  photoOverrides?: Partial<Record<BayKind, PhotoOverride>>
}) {
  const kind: BayKind = (bay.kind ?? 'automatic') as BayKind
  const override = photoOverrides?.[kind]
  const overrideSanity = isSanityImage(override) ? override : null
  const overrideLocal = !overrideSanity && override && 'src' in (override as LocalPhoto) ? (override as LocalPhoto) : null
  const local = overrideLocal ?? LOCAL_PHOTO_BY_KIND[kind]
  const hasSanityPhoto = !!overrideSanity || !!bay.photo?.asset?._ref
  const sanityImage = overrideSanity ?? bay.photo
  const showImage = hasSanityPhoto || !!local
  return (
    <article className="bg-white border border-line rounded-[22px] overflow-hidden flex flex-col">
      <div
        className={`h-[280px] relative overflow-hidden ${showImage ? '' : bay.bgClass ?? ''}`}
        style={showImage ? { position: 'relative' } : bay.bgStyle}
      >
        {hasSanityPhoto && sanityImage ? (
          <SanityImage
            image={sanityImage}
            width={1200}
            height={560}
            sizes="(max-width: 768px) 100vw, 600px"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : local ? (
          <Image
            src={local.src}
            alt={local.alt}
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            style={{ objectFit: 'cover', objectPosition: local.objectPosition }}
            className="absolute inset-0"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/20">
            {bay.icon}
          </div>
        )}
        {showImage && (
          <>
            <div
              aria-hidden
              className="absolute inset-0 z-[1]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(8,24,63,.15) 0%, rgba(8,24,63,.4) 100%)',
              }}
            />
            <span className="absolute top-4 left-4 mono text-[11px] text-white/80 bg-black/40 px-2.5 py-1.5 rounded z-[2]">
              {local?.caption ?? `// photo: bay-${index + 1}.jpg`}
            </span>
          </>
        )}
        {!showImage && (
          <span className="absolute top-4 left-4 mono text-[11px] text-white/60 bg-black/40 px-2.5 py-1.5 rounded z-10">
            // photo: bay-{index + 1}.jpg
          </span>
        )}
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

export default async function Bays({
  photoOverrides,
}: {
  photoOverrides?: Partial<Record<BayKind, PhotoOverride>>
} = {}) {
  const data = await sanityFetch<Partial<BaysData>>(BAYS_QUERY)
  const section: BaysData = {
    ...BAYS_FALLBACK,
    ...(data ?? {}),
    bays: data?.bays?.length ? data.bays : BAYS_FALLBACK.bays,
  }
  const bays: Bay[] = section.bays.map((b, i) => {
    const kind: BayKind = b.kind ?? (i === 0 ? 'automatic' : 'self-serve')
    return {
      ...b,
      kind,
      bgClass: BG_BY_KIND[kind],
      icon: ICON_BY_KIND[kind],
    }
  })

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
            <Card key={i} bay={b} index={i} photoOverrides={photoOverrides} />
          ))}
        </div>
      </div>
    </section>
  )
}

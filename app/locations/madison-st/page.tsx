import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Washes from '@/src/components/Washes'
import Bays from '@/src/components/Bays'
import OtherServices from '@/src/components/OtherServices'
import Tokens from '@/src/components/Tokens'
// import Email from '@/src/components/Email'
import LocalBusinessSchema from '@/src/components/seo/LocalBusinessSchema'
import BreadcrumbSchema from '@/src/components/seo/BreadcrumbSchema'
import SanityImage from '@/src/components/SanityImage'
import { locations } from '@/src/data/locations'
import { sanityFetch } from '@/lib/sanityFetch'
import type { ImageWithAlt } from '@/lib/sanityImage'

const loc = locations.find((l) => l.slug === 'madison-st')!

const FULL_ADDRESS = `${loc.street}, ${loc.city}, ${loc.region} ${loc.postalCode}`
const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  FULL_ADDRESS,
)}`

// ---------------------------------------------------------------------------
// Hardcoded fallbacks. These are used field-by-field if Sanity returns null
// for a specific field. Keep them in sync with the seed.
// ---------------------------------------------------------------------------
const FALLBACK = {
  metaTitle: `Touchless Car Wash on Madison St, Forest Park IL`,
  metaDescription: `Spotless Carwash on Madison Street in Forest Park, IL. Touchless automatic bays and self-serve wand bays. Open 7am–10pm, every day since 1995. ${loc.street}.`,
  hero: {
    eyebrow: 'Spotless Carwash · Forest Park, IL · Open 7am–10pm',
    headlineSuffix: 'on Madison St',
    introParagraph: 'Touchless automatic bays and self-serve wand bays. Open 7am–10pm, every day.',
    addressLabel: 'Address',
    phoneLabel: 'Phone · Hours',
    hoursLine: 'Open 7am–10pm, every day',
    directionsLabel: 'Get directions',
    washesLabel: 'See wash packages',
    photoBadgeKicker: 'Keep it clean',
    photoBadgeText: 'Self-serve & touchless wash.',
  },
  findUs: {
    eyebrowPrefix: 'FIND US /',
    headingPrefix: 'Right here on',
    headingHighlight: 'Madison St',
    headingSuffix: '.',
    sideParagraph: 'On Madison Street just west of Jacksom blvd., Concordia Cemetery and the Forest Park Public Library are right nearby.',
    addressLabel: 'Address',
    hoursLabel: 'Hours',
    hoursPrimary: '7am–10pm, every day',
    hoursDetail: 'Bays open all hours. Attendants Mon–Fri, 9am -11am & 12pm–5pm, Sat/Sun 9–11am & 12–4pm.',
    gettingHereLabel: 'Getting here',
    gettingHereBullets: [
      'Easy from Oak Park & River Forest',
      'Quick Eisenhower (I-290) access',
      'Surface lot · vacuums on site',
    ],
    directionsLabel: 'Get directions',
    callLabel: 'Call',
  },
  about: {
    eyebrowPrefix: 'ABOUT /',
    headingBefore: 'The neighborhood car wash on',
    headingHighlight: 'Madison Street',
    headingAfter: '.',
    paragraphs: [
      'Spotless Carwash on Madison Street has been part of Forest Park for over 30 years. We sit on Madison just west of Jackson blvd. easy reach for drivers from Forest Park, Oak Park, River Forest, and Berwyn, with quick Eisenhower (I-290) access just to the north. Concordia Cemetery and the Forest Park Public Library are right around the corner.',
      'Madison St is our open-fronted location — the touchless automatic bays are brushless and scratchless, with high-pressure water, soap, and air cannon dryers handling the wash from start to finish. No spinning brushes, no fabric, no risk to fresh paint, ceramic coatings, or wraps.',
      `The lot has ${loc.touchlessBays} touchless automatic bays and ${loc.selfServeBays} self-serve wand bays with nine wash settings — engine cleaner through spot-free rinse — for $4 every 5 minutes. Pay-stations accept all major cards, tap, Apple Pay, cash, and prepaid Spotless wash tokens. Vacuums and vending are on the lot.`,
      'Bays are open 7am–10pm, every day. Attendants are on site Monday through Friday from 9am - 11am and noon to 5pm, and weekends & holidays from 9–11am and noon–4pm — they can help with tokens, change, and any equipment questions. Looking for heated indoor bays for winter? Head to our Roosevelt Rd location.',
    ],
  },
}

const META_QUERY = `*[_type == "location" && slug.current == $slug][0]{ metaTitle, metaDescription }`
const PAGE_QUERY = `*[_type == "location" && slug.current == $slug][0]{
  heroImage,
  touchlessBayPhoto,
  selfServeBayPhoto,
  heroSection,
  findUsSection,
  aboutSection
}`

type Paragraph = { text?: string | null } | null

type PageData = {
  heroImage?: ImageWithAlt | null
  touchlessBayPhoto?: ImageWithAlt | null
  selfServeBayPhoto?: ImageWithAlt | null
  heroSection?: {
    eyebrow?: string | null
    headlineSuffix?: string | null
    introParagraph?: string | null
    addressLabel?: string | null
    phoneLabel?: string | null
    hoursLine?: string | null
    directionsLabel?: string | null
    washesLabel?: string | null
    photoBadgeKicker?: string | null
    photoBadgeText?: string | null
  } | null
  findUsSection?: {
    eyebrowPrefix?: string | null
    headingPrefix?: string | null
    headingHighlight?: string | null
    headingSuffix?: string | null
    sideParagraph?: string | null
    addressLabel?: string | null
    hoursLabel?: string | null
    hoursPrimary?: string | null
    hoursDetail?: string | null
    gettingHereLabel?: string | null
    gettingHereBullets?: (string | null)[] | null
    directionsLabel?: string | null
    callLabel?: string | null
  } | null
  aboutSection?: {
    eyebrowPrefix?: string | null
    headingBefore?: string | null
    headingHighlight?: string | null
    headingAfter?: string | null
    paragraphs?: Paragraph[] | null
  } | null
}

const pick = <T,>(v: T | null | undefined, fallback: T): T =>
  v === null || v === undefined || v === '' ? fallback : v

export async function generateMetadata(): Promise<Metadata> {
  const data = await sanityFetch<{ metaTitle?: string; metaDescription?: string }>(
    META_QUERY,
    { params: { slug: loc.slug } },
  )
  return {
    title: pick(data?.metaTitle, FALLBACK.metaTitle),
    description: pick(data?.metaDescription, FALLBACK.metaDescription),
    alternates: { canonical: `/locations/${loc.slug}` },
  }
}

export default async function Page() {
  const data = await sanityFetch<PageData>(PAGE_QUERY, {
    params: { slug: loc.slug },
  })
  const heroImage = data?.heroImage ?? null
  const touchlessSanity = data?.touchlessBayPhoto ?? null
  const selfServeSanity = data?.selfServeBayPhoto ?? null

  const hero = data?.heroSection ?? {}
  const findUs = data?.findUsSection ?? {}
  const about = data?.aboutSection ?? {}

  const heroEyebrow = pick(hero.eyebrow, FALLBACK.hero.eyebrow)
  const heroHeadlineSuffix = pick(hero.headlineSuffix, FALLBACK.hero.headlineSuffix)
  const heroIntro = pick(hero.introParagraph, FALLBACK.hero.introParagraph)
  const heroAddressLabel = pick(hero.addressLabel, FALLBACK.hero.addressLabel)
  const heroPhoneLabel = pick(hero.phoneLabel, FALLBACK.hero.phoneLabel)
  const heroHoursLine = pick(hero.hoursLine, FALLBACK.hero.hoursLine)
  const heroDirectionsLabel = pick(hero.directionsLabel, FALLBACK.hero.directionsLabel)
  const heroWashesLabel = pick(hero.washesLabel, FALLBACK.hero.washesLabel)
  const heroBadgeKicker = pick(hero.photoBadgeKicker, FALLBACK.hero.photoBadgeKicker)
  const heroBadgeText = pick(hero.photoBadgeText, FALLBACK.hero.photoBadgeText)

  const findEyebrowPrefix = pick(findUs.eyebrowPrefix, FALLBACK.findUs.eyebrowPrefix)
  const findHeadingPrefix = pick(findUs.headingPrefix, FALLBACK.findUs.headingPrefix)
  const findHeadingHighlight = pick(findUs.headingHighlight, FALLBACK.findUs.headingHighlight)
  const findHeadingSuffix = pick(findUs.headingSuffix, FALLBACK.findUs.headingSuffix)
  const findSideParagraph = pick(findUs.sideParagraph, FALLBACK.findUs.sideParagraph)
  const findAddressLabel = pick(findUs.addressLabel, FALLBACK.findUs.addressLabel)
  const findHoursLabel = pick(findUs.hoursLabel, FALLBACK.findUs.hoursLabel)
  const findHoursPrimary = pick(findUs.hoursPrimary, FALLBACK.findUs.hoursPrimary)
  const findHoursDetail = pick(findUs.hoursDetail, FALLBACK.findUs.hoursDetail)
  const findGettingHereLabel = pick(findUs.gettingHereLabel, FALLBACK.findUs.gettingHereLabel)
  const findBullets =
    findUs.gettingHereBullets && findUs.gettingHereBullets.filter((b): b is string => !!b).length > 0
      ? findUs.gettingHereBullets.filter((b): b is string => !!b)
      : FALLBACK.findUs.gettingHereBullets
  const findDirectionsLabel = pick(findUs.directionsLabel, FALLBACK.findUs.directionsLabel)
  const findCallLabel = pick(findUs.callLabel, FALLBACK.findUs.callLabel)

  const aboutEyebrowPrefix = pick(about.eyebrowPrefix, FALLBACK.about.eyebrowPrefix)
  const aboutHeadingBefore = pick(about.headingBefore, FALLBACK.about.headingBefore)
  const aboutHeadingHighlight = pick(about.headingHighlight, FALLBACK.about.headingHighlight)
  const aboutHeadingAfter = pick(about.headingAfter, FALLBACK.about.headingAfter)
  const aboutParagraphs =
    about.paragraphs && about.paragraphs.filter((p) => p && p.text).length > 0
      ? (about.paragraphs.filter((p) => p && p.text).map((p) => p!.text!) as string[])
      : FALLBACK.about.paragraphs

  return (
    <>
      <LocalBusinessSchema location={loc} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: loc.name },
        ]}
      />
      <header
        className="relative overflow-hidden text-white pt-14 md:pt-20 pb-16 md:pb-24"
        style={{
          background: 'linear-gradient(135deg,#0A2A6B 0%,#1B4FD9 100%)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 85% 10%, rgba(120,200,255,0.30) 0%, rgba(120,200,255,0) 70%), radial-gradient(55% 55% at 10% 95%, rgba(8,24,63,0.55) 0%, rgba(8,24,63,0) 70%)',
          }}
        />

        <div className="relative z-10 max-w-[1240px] mx-auto px-5 md:px-7 grid lg:grid-cols-[1.35fr_1fr] gap-10 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2.5 text-[11px] md:text-xs font-bold tracking-[0.2em] uppercase text-blue-100 mb-6">
              <span
                className="w-2 h-2 rounded-full bg-yellow-400"
                style={{ boxShadow: '0 0 0 4px rgba(255,217,61,.18)' }}
              />
              {heroEyebrow}
            </div>

            <h1 className="display italic uppercase text-[56px] sm:text-[80px] md:text-[112px] lg:text-[140px] [text-shadow:-0.035em_0.05em_0_#0a2a6b]">
              <span className="text-[1.75em]">S</span>potless
              <span className="block pl-[.5em]">Carwash</span>
              <span className="block normal-case text-blue-100 text-[0.62em] mt-2">
                {heroHeadlineSuffix}
              </span>
            </h1>

            <p className="mt-6 text-lg max-w-[480px] text-blue-100 leading-relaxed">
              {heroIntro}
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4 max-w-[640px]">
              <div className="bg-white/10 rounded-2xl p-5 border border-white/15 backdrop-blur-sm">
                <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-yellow-400 mb-2">
                  {heroAddressLabel}
                </div>
                <div className="font-semibold text-white text-[17px]">
                  {loc.street}
                </div>
                <div className="text-blue-100 text-sm">
                  {loc.city}, {loc.region} {loc.postalCode}
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-5 border border-white/15 backdrop-blur-sm">
                <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-yellow-400 mb-2">
                  {heroPhoneLabel}
                </div>
                <a
                  href={loc.phoneHref}
                  className="font-semibold text-white text-[17px] block"
                >
                  {loc.phone}
                </a>
                <div className="text-blue-100 text-sm">
                  {heroHoursLine}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3 flex-wrap">
              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full font-bold text-[15px] bg-yellow-400 text-blue-700 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(255,217,61,.35)] transition"
              >
                {heroDirectionsLabel}
                <svg
                  className="w-[18px] h-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
              <Link
                href="/#washes"
                className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full font-bold text-[15px] border-2 border-white/40 hover:border-white hover:bg-white/10 transition"
              >
                {heroWashesLabel}
              </Link>
            </div>
          </div>

          <div className="relative">
            <div
              className="relative aspect-square rounded-[28px] overflow-hidden border-2 border-white/15"
              style={{ boxShadow: '0 30px 80px rgba(8,24,63,.45)' }}
            >
              {heroImage?.asset?._ref ? (
                <SanityImage
                  image={heroImage}
                  width={1200}
                  height={1200}
                  priority
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <Image
                  src="/images/madison-hero.png"
                  alt="Spotless Carwash Madison St storefront"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 480px"
                  style={{ objectFit: 'cover', objectPosition: '50% 55%' }}
                  decoding="async"
                />
              )}
            </div>
            <div
              className="absolute -bottom-4 -left-5 bg-yellow-400 text-blue-700 rounded-2xl px-4 py-3 border-2 border-blue-700"
              style={{ boxShadow: '0 12px 30px rgba(0,0,0,.3)' }}
            >
              <div className="text-[10px] font-bold tracking-[0.22em] uppercase">
                {heroBadgeKicker}
              </div>
              <div className="display italic text-[20px] leading-tight">
                {heroBadgeText}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="py-14 md:py-20 bg-paper2 border-b border-line">
        <div className="max-w-[1240px] mx-auto px-5 md:px-7">
          <div className="flex items-end justify-between gap-8 mb-8 md:mb-10 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2.5">
                <span className="mono text-[#5b6987] font-medium">{findEyebrowPrefix}</span> {loc.name}
              </div>
              <h2 className="display text-[40px] sm:text-[56px] md:text-[68px] m-0 max-w-[680px]">
                {findHeadingPrefix} <span className="text-blue-500 yellow-hl">{findHeadingHighlight}</span>{findHeadingSuffix}
              </h2>
            </div>
            <p className="max-w-[360px] text-[#445273] leading-relaxed">
              {findSideParagraph}
            </p>
          </div>

          <div className="grid lg:grid-cols-[1.45fr_1fr] gap-5 md:gap-6">
            <div className="rounded-2xl overflow-hidden border border-line shadow-[0_8px_24px_rgba(8,24,63,.08)] order-2 lg:order-1">
              <iframe
                title={`Map of Spotless Carwash on ${loc.name}`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(FULL_ADDRESS)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-[400px] md:h-[520px] block border-0"
                allowFullScreen
              />
            </div>
            <div className="bg-white rounded-2xl border border-line p-7 md:p-8 flex flex-col gap-5 order-1 lg:order-2">
              <div>
                <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2">
                  {findAddressLabel}
                </div>
                <div className="font-extrabold text-ink text-[17px] leading-tight">
                  {loc.street}
                </div>
                <div className="text-[#5b6987] text-sm mt-0.5">
                  {loc.city}, {loc.region} {loc.postalCode}
                </div>
              </div>
              <div className="border-t border-dashed border-line pt-5">
                <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2">
                  {findHoursLabel}
                </div>
                <div className="font-extrabold text-ink">{findHoursPrimary}</div>
                <div className="text-[#5b6987] text-sm mt-1 leading-snug">
                  {findHoursDetail}
                </div>
              </div>
              <div className="border-t border-dashed border-line pt-5">
                <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2">
                  {findGettingHereLabel}
                </div>
                <ul className="text-sm text-[#445273] leading-relaxed space-y-1.5 list-none p-0 m-0">
                  {findBullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-[8px] shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-dashed border-line pt-5 flex gap-2.5">
                <a
                  href={DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-3 rounded-xl font-bold text-sm bg-blue-500 text-white border border-blue-500 hover:bg-blue-700 transition"
                >
                  {findDirectionsLabel}
                </a>
                <a
                  href={loc.phoneHref}
                  className="flex-1 text-center py-3 rounded-xl font-bold text-sm border border-line text-ink hover:border-blue-500 hover:text-blue-500 transition"
                >
                  {findCallLabel}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 border-b border-line">
        <div className="max-w-[1240px] mx-auto px-5 md:px-7 grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2.5">
              <span className="mono text-[#5b6987] font-medium">{aboutEyebrowPrefix}</span> {loc.name}
            </div>
            <h2 className="display text-[36px] sm:text-[48px] md:text-[56px] m-0 leading-[1.05]">
              {aboutHeadingBefore}{' '}
              <span className="text-blue-500 yellow-hl">{aboutHeadingHighlight}</span>{aboutHeadingAfter}
            </h2>
          </div>
          <div className="text-[#445273] leading-relaxed text-[17px] space-y-5 max-w-[640px]">
            {aboutParagraphs.map((p, i) => {
              const isLast = i === aboutParagraphs.length - 1
              if (isLast) {
                const target = 'Roosevelt Rd location'
                const idx = p.indexOf(target)
                if (idx >= 0) {
                  return (
                    <p key={i}>
                      {p.slice(0, idx)}
                      <a
                        href="/locations/roosevelt-rd"
                        className="text-blue-500 font-semibold underline"
                      >
                        {target}
                      </a>
                      {p.slice(idx + target.length)}
                    </p>
                  )
                }
              }
              return <p key={i}>{p}</p>
            })}
          </div>
        </div>
      </section>

      <Washes />
      <Bays
        photoOverrides={{
          automatic:
            touchlessSanity ?? {
              src: '/images/madison-touchless-bays.jpg',
              alt: 'Madison St touchless automatic bays',
              caption: '// touchless-bay',
              objectPosition: '50% 55%',
            },
          'self-serve':
            selfServeSanity ?? {
              src: '/images/madison-bays.jpg',
              alt: 'Madison St self-serve wand bays',
              caption: '// self-serve-bays',
              objectPosition: '50% 55%',
            },
        }}
      />
      <OtherServices />
      <Tokens />
      {/* <Email /> */}
    </>
  )
}

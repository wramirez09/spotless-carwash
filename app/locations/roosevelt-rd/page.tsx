import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Washes from '@/src/components/Washes'
import Bays from '@/src/components/Bays'
import OtherServices from '@/src/components/OtherServices'
import Tokens from '@/src/components/Tokens'
import Email from '@/src/components/Email'
import LocalBusinessSchema from '@/src/components/seo/LocalBusinessSchema'
import BreadcrumbSchema from '@/src/components/seo/BreadcrumbSchema'
import SanityImage from '@/src/components/SanityImage'
import { locations } from '@/src/data/locations'
import { sanityFetch } from '@/lib/sanityFetch'
import type { ImageWithAlt } from '@/lib/sanityImage'

const loc = locations.find((l) => l.slug === 'roosevelt-rd')!

const FULL_ADDRESS = `${loc.street}, ${loc.city}, ${loc.region} ${loc.postalCode}`
const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  FULL_ADDRESS,
)}`

const META_QUERY = `*[_type == "location" && slug.current == $slug][0]{ metaTitle, metaDescription }`
const IMAGES_QUERY = `*[_type == "location" && slug.current == $slug][0]{
  heroImage, touchlessBayPhoto, selfServeBayPhoto
}`

type LocationImages = {
  heroImage?: ImageWithAlt | null
  touchlessBayPhoto?: ImageWithAlt | null
  selfServeBayPhoto?: ImageWithAlt | null
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await sanityFetch<{ metaTitle?: string; metaDescription?: string }>(
    META_QUERY,
    { params: { slug: loc.slug } },
  )
  return {
    title: data?.metaTitle ?? `Touchless Car Wash on Roosevelt Rd, Forest Park IL`,
    description:
      data?.metaDescription ??
      `Spotless Carwash on Roosevelt Rd in Forest Park, IL. Heated indoor touchless bays and self-serve wand bays. Open 7am–10pm, every day since 1994. ${loc.street}.`,
    alternates: { canonical: `/locations/${loc.slug}` },
  }
}

export default async function Page() {
  const images = await sanityFetch<LocationImages>(IMAGES_QUERY, {
    params: { slug: loc.slug },
  })
  const heroImage = images?.heroImage ?? null
  const bayOverrides = {
    automatic: images?.touchlessBayPhoto ?? null,
    'self-serve': images?.selfServeBayPhoto ?? null,
  } as const
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
              Spotless Carwash · Forest Park, IL · Open 7am–10pm
            </div>

            <h1 className="display italic uppercase text-[56px] sm:text-[80px] md:text-[112px] lg:text-[140px] [text-shadow:-0.035em_0.05em_0_#0a2a6b]">
              <span className="text-[1.75em]">S</span>potless
              <span className="block pl-[.5em]">Carwash</span>
              <span className="block normal-case text-blue-100 text-[0.62em] mt-2">
                on Roosevelt Rd
              </span>
            </h1>

            <p className="mt-6 text-lg max-w-[480px] text-blue-100 leading-relaxed">
              Touchless automatic bays and self-serve wand bays. Open
              7am–10pm, every day.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4 max-w-[640px]">
              <div className="bg-white/10 rounded-2xl p-5 border border-white/15 backdrop-blur-sm">
                <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-yellow-400 mb-2">
                  Address
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
                  Phone · Hours
                </div>
                <a
                  href={loc.phoneHref}
                  className="font-semibold text-white text-[17px] block"
                >
                  {loc.phone}
                </a>
                <div className="text-blue-100 text-sm">
                  Open 7am–10pm, every day
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
                Get directions
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
                See wash packages
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
                  src="/images/rooslevelt-spotless-sign.jpg"
                  alt="Spotless Carwash Roosevelt Rd storefront"
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
                Keep it clean
              </div>
              <div className="display italic text-[20px] leading-tight">
                Touchless automatic wash.
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
                <span className="mono text-[#5b6987] font-medium">FIND US /</span> {loc.name}
              </div>
              <h2 className="display text-[40px] sm:text-[56px] md:text-[68px] m-0 max-w-[680px]">
                Right here on <span className="text-blue-500 yellow-hl">Roosevelt Rd</span>.
              </h2>
            </div>
            <p className="max-w-[360px] text-[#445273] leading-relaxed">
              On Roosevelt Road just east of Harlem Avenue. Heated indoor bays mean you can wash year-round, even at -10°.
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
                  Address
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
                  Hours
                </div>
                <div className="font-extrabold text-ink">7am–10pm, every day</div>
                <div className="text-[#5b6987] text-sm mt-1 leading-snug">
                  Bays open all hours. Attendants Mon–Fri 12–5pm, Sat/Sun 9–11am &amp; 12–4pm.
                </div>
              </div>
              <div className="border-t border-dashed border-line pt-5">
                <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2">
                  Getting here
                </div>
                <ul className="text-sm text-[#445273] leading-relaxed space-y-1.5 list-none p-0 m-0">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-[8px] shrink-0" />
                    Just east of Harlem Avenue
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-[8px] shrink-0" />
                    Quick from Oak Park, River Forest &amp; Berwyn
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-[8px] shrink-0" />
                    Heated indoor bays · vacuums on site
                  </li>
                </ul>
              </div>
              <div className="border-t border-dashed border-line pt-5 flex gap-2.5">
                <a
                  href={DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-3 rounded-xl font-bold text-sm bg-blue-500 text-white border border-blue-500 hover:bg-blue-700 transition"
                >
                  Get directions
                </a>
                <a
                  href={loc.phoneHref}
                  className="flex-1 text-center py-3 rounded-xl font-bold text-sm border border-line text-ink hover:border-blue-500 hover:text-blue-500 transition"
                >
                  Call
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
              <span className="mono text-[#5b6987] font-medium">ABOUT /</span> {loc.name}
            </div>
            <h2 className="display text-[36px] sm:text-[48px] md:text-[56px] m-0 leading-[1.05]">
              The car wash South Forest Park has trusted{' '}
              <span className="text-blue-500 yellow-hl">since 1994</span>.
            </h2>
          </div>
          <div className="text-[#445273] leading-relaxed text-[17px] space-y-5 max-w-[640px]">
            <p>
              Spotless Carwash on Roosevelt Road has been washing cars in Forest Park
              for over 30 years. We sit on Roosevelt just east of Harlem Avenue — a
              quick stop for drivers from Forest Park, Oak Park, River Forest,
              Berwyn, Cicero, and Maywood.
            </p>
            <p>
              Roosevelt Rd is our heated location: the touchless automatic bays here
              are fully enclosed and warmed, so your car gets washed and air-dried
              indoors even on the worst Chicago winter days. No frozen door handles,
              no ice on the dryer, no waiting for a thaw to wash off road salt.
            </p>
            <p>
              The lot has{' '}
              <span className="font-semibold text-ink">{loc.touchlessBays} touchless automatic bays</span>{' '}
              and{' '}
              <span className="font-semibold text-ink">{loc.selfServeBays} self-serve wand bays</span>{' '}
              — so whether you want to drive in and let the machine do the work, or
              wash the engine bay and wheels yourself with a wand, we have the right
              bay open. Pay-stations accept all major cards, tap, Apple Pay, cash,
              and prepaid Spotless wash tokens. Vacuums and vending are on the lot.
            </p>
            <p>
              Bays are open 7am–10pm, every day. Attendants are on site Monday
              through Friday from noon to 5pm, and weekends &amp; holidays from
              9–11am and noon–4pm — they can help with tokens, change, and any
              equipment questions. Closer to north Forest Park? See our{' '}
              <a
                href="/locations/madison-st"
                className="text-blue-500 font-semibold underline"
              >
                Madison St location
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <Washes />
      <Bays photoOverrides={bayOverrides} />
      <OtherServices />
      <Tokens />
      <Email />
    </>
  )
}

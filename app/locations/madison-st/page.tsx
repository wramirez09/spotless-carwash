import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Washes from '@/src/components/Washes'
import Bays from '@/src/components/Bays'
import OtherServices from '@/src/components/OtherServices'
import Tokens from '@/src/components/Tokens'
import Email from '@/src/components/Email'
import LocalBusinessSchema from '@/src/components/seo/LocalBusinessSchema'
import { locations } from '@/src/data/locations'
import { sanityFetch } from '@/lib/sanityFetch'

const loc = locations.find((l) => l.slug === 'madison-st')!

const FULL_ADDRESS = `${loc.street}, ${loc.city}, ${loc.region} ${loc.postalCode}`
const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  FULL_ADDRESS,
)}`

const META_QUERY = `*[_type == "location" && slug.current == $slug][0]{ metaTitle, metaDescription }`

export async function generateMetadata(): Promise<Metadata> {
  const data = await sanityFetch<{ metaTitle?: string; metaDescription?: string }>(
    META_QUERY,
    { params: { slug: loc.slug } },
  )
  return {
    title: data?.metaTitle ?? `${loc.name} · Spotless Carwash · Forest Park, IL`,
    description:
      data?.metaDescription ??
      `Spotless Carwash on Madison Street in Forest Park, IL. Touchless automatic bays and self-serve wand bays. Open 7am–10pm, every day. ${loc.street}.`,
  }
}

export default function Page() {
  return (
    <>
      <LocalBusinessSchema location={loc} />
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
              <span className="block pl-[0.5em]">Carwash</span>
              <span className="block normal-case text-blue-100 text-[0.62em] mt-2">
                on Madison St
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
              <Image
                src="/images/madison-hero.png"
                alt="Spotless Carwash Madison St storefront"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 480px"
                style={{ objectFit: 'cover', objectPosition: '50% 55%' }}
                decoding="async"
              />
            </div>
            <div
              className="absolute -bottom-4 -left-5 bg-yellow-400 text-blue-700 rounded-2xl px-4 py-3 border-2 border-blue-700"
              style={{ boxShadow: '0 12px 30px rgba(0,0,0,.3)' }}
            >
              <div className="text-[10px] font-bold tracking-[0.22em] uppercase">
                Keep it clean
              </div>
              <div className="display italic text-[20px] leading-tight">
                Self-serve &amp; touchless wash.
              </div>
            </div>
          </div>
        </div>
      </header>

      <Washes />
      <Bays
        photoOverrides={{
          'self-serve': {
            src: '/images/madison-bays.jpg',
            alt: 'Madison St self-serve wand bays',
            caption: '// self-serve-bays',
            objectPosition: '50% 55%',
          },
        }}
      />
      <OtherServices />
      <Tokens />
      <Email />
    </>
  )
}

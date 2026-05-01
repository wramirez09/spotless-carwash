import Washes from './Washes'
import Bays from './Bays'
import OtherServices from './OtherServices'
import Tokens from './Tokens'
import Email from './Email'
import SanityImage from './SanityImage'
import { directionsUrl, fullAddress, type Location } from '@/src/data/locations'
import { getSiteSettings } from '@/lib/siteSettings'
import { sanityFetch } from '@/lib/sanityFetch'

type LocationCopy = {
  heatedHeroBlurb?: string
  unheatedHeroBlurb?: string
  touchlessBlurb?: string
  selfServeBlurb?: string
  paymentBlurb?: string
  addressIntroTemplate?: string
  winterBlurb?: string
}

const COPY_FALLBACK: Required<LocationCopy> = {
  heatedHeroBlurb:
    "Heated, enclosed automatic touchless bays — your car is washed and air-dried inside, so doors and locks don't freeze on the way out. Self-serve wand bays on site too.",
  unheatedHeroBlurb:
    'Touchless automatic bays and self-serve wand bays. Open 7am–10pm every day.',
  touchlessBlurb:
    'Brushless, scratchless, ~4 min 30s. Air cannon dryers on the top three packages.',
  selfServeBlurb:
    'Nine-setting dial: presoak through spot-free rinse. $4.00 for 5 minutes.',
  paymentBlurb:
    'Visa · Mastercard · Amex · Tap · Apple Pay · Cash · Wash tokens.',
  addressIntroTemplate:
    'Find us at {address}. Pay at the station with Visa, Mastercard, Amex, tap or Apple Pay, cash, or wash tokens.',
  winterBlurb:
    'In winter, head straight for the heated automatic bays — your car is washed inside and air-dried before you pull out.',
}

const COPY_QUERY = `*[_type == "locationsSection"][0]{
  heatedHeroBlurb, unheatedHeroBlurb, touchlessBlurb, selfServeBlurb,
  paymentBlurb, addressIntroTemplate, winterBlurb
}`

export default async function LocationPage({ location }: { location: Location }) {
  const [settings, copyData] = await Promise.all([
    getSiteSettings(),
    sanityFetch<LocationCopy>(COPY_QUERY),
  ])
  const copy: Required<LocationCopy> = {
    heatedHeroBlurb: copyData?.heatedHeroBlurb || COPY_FALLBACK.heatedHeroBlurb,
    unheatedHeroBlurb: copyData?.unheatedHeroBlurb || COPY_FALLBACK.unheatedHeroBlurb,
    touchlessBlurb: copyData?.touchlessBlurb || COPY_FALLBACK.touchlessBlurb,
    selfServeBlurb: copyData?.selfServeBlurb || COPY_FALLBACK.selfServeBlurb,
    paymentBlurb: copyData?.paymentBlurb || COPY_FALLBACK.paymentBlurb,
    addressIntroTemplate:
      copyData?.addressIntroTemplate || COPY_FALLBACK.addressIntroTemplate,
    winterBlurb: copyData?.winterBlurb || COPY_FALLBACK.winterBlurb,
  }
  const heroBlurb = location.heated ? copy.heatedHeroBlurb : copy.unheatedHeroBlurb
  return (
    <>
      <header
        className="relative overflow-hidden text-white pt-14 md:pt-20 pb-16 md:pb-24"
        style={{ background: location.gradient }}
      >
        {location.photo?.asset?._ref && (
          <div className="absolute inset-0 z-0">
            <SanityImage
              image={location.photo}
              width={2400}
              height={1200}
              sizes="100vw"
              priority
              className="w-full h-full object-cover opacity-40"
            />
          </div>
        )}
        <div className="relative z-10 max-w-[1240px] mx-auto px-5 md:px-7">
          <div className="inline-flex items-center gap-2.5 text-xs font-bold tracking-[0.18em] uppercase text-blue-100 mb-6">
            <span
              className="w-2 h-2 rounded-full bg-yellow-400"
              style={{ boxShadow: '0 0 0 4px rgba(255,217,61,.18)' }}
            ></span>
            Spotless Carwash · Forest Park, IL · {settings.hoursLine}
          </div>
          <h1 className="display italic uppercase text-[56px] sm:text-[80px] md:text-[112px] lg:text-[140px] [text-shadow:-0.035em_0.05em_0_#0a2a6b]">
            <span className="text-[1.75em]">S</span>potless
            <span className="block pl-[0.5em]">Carwash</span>
            <span className="block normal-case text-blue-100 text-[0.62em] mt-2">
              on {location.name}
            </span>
          </h1>
          <p className="mt-6 text-lg max-w-[560px] text-blue-100 leading-relaxed">
            {location.pageDescription || heroBlurb}
          </p>

          <div className="mt-8 grid sm:grid-cols-2 gap-6 max-w-[640px]">
            <div className="bg-white/10 rounded-2xl p-5 border border-white/15">
              <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-yellow-400 mb-2">
                Address
              </div>
              <div className="font-semibold text-white">{location.street}</div>
              <div className="text-blue-100 text-sm">
                {location.city}, {location.region} {location.postalCode}
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-5 border border-white/15">
              <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-yellow-400 mb-2">
                Phone · Hours
              </div>
              <a href={location.phoneHref} className="font-semibold text-white block">
                {location.phone}
              </a>
              <div className="text-blue-100 text-sm">{settings.hoursLine}</div>
            </div>
          </div>

          <div className="mt-8 flex gap-3 flex-wrap">
            <a
              href={directionsUrl(location)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full font-bold text-[15px] bg-yellow-400 text-blue-700 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(255,217,61,.35)] transition"
            >
              Get directions
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a
              href="#washes"
              className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full font-bold text-[15px] border-2 border-white/40 hover:border-white hover:bg-white/10 transition"
            >
              See wash packages
            </a>
          </div>
        </div>
      </header>

      <section className="py-14 md:py-20">
        <div className="max-w-[1240px] mx-auto px-5 md:px-7 grid md:grid-cols-3 gap-6">
          <div className="bg-paper rounded-2xl p-7 border border-line">
            <div className="display text-5xl text-blue-500">{location.touchlessBays}</div>
            <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#5b6987] mt-1.5">
              Touchless automatic bays
            </div>
            <p className="mt-3 text-sm text-[#445273]">{copy.touchlessBlurb}</p>
          </div>
          <div className="bg-paper rounded-2xl p-7 border border-line">
            <div className="display text-5xl text-blue-500">{location.selfServeBays}</div>
            <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#5b6987] mt-1.5">
              Self-serve wand bays
            </div>
            <p className="mt-3 text-sm text-[#445273]">{copy.selfServeBlurb}</p>
          </div>
          <div className="bg-paper rounded-2xl p-7 border border-line">
            <div className="display text-5xl text-blue-500">{settings.hoursShort}</div>
            <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#5b6987] mt-1.5">
              Open every day
            </div>
            <p className="mt-3 text-sm text-[#445273]">{copy.paymentBlurb}</p>
          </div>
        </div>
        <div className="max-w-[1240px] mx-auto px-5 md:px-7 mt-10">
          <p className="text-[#445273] leading-relaxed max-w-[760px]">
            {(() => {
              const [before, after] = copy.addressIntroTemplate.split('{address}')
              return (
                <>
                  {before}
                  <a
                    href={directionsUrl(location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 font-semibold underline"
                  >
                    {fullAddress(location)}
                  </a>
                  {after ?? ''}
                </>
              )
            })()}
            {location.heated ? ` ${location.winterAddon || copy.winterBlurb}` : ''}
          </p>
        </div>
      </section>

      <Washes />
      <Bays />
      <OtherServices />
      <Tokens />
      <Email />
    </>
  )
}

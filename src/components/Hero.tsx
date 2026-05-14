import HeroLights, { type HeroLightsLabels } from './HeroLights'
import { sanityFetch } from '@/lib/sanityFetch'
import SanityImage from './SanityImage'
import type { ImageWithAlt } from '@/lib/sanityImage'

const HERO_QUERY = `{
  "hero": *[_type == "hero"][0]{
  eyebrow,
  headlineLine1,
  headlineLine2,
  headlineTagline,
  subheadYellow,
  subheadBody,
  primaryCta{ label, href, external },
  secondaryCta{ label, href, external },
  tickerItems,
  bayCardStatus,
  bayCardHeading,
  bayCardBody,
  avgWashTime,
  paymentLine,
  backgroundImage
  },
  "lights": *[_type == "heroLights"][0]{
    redLabel, yellowLabel, greenLabel
  }
}`

type CtaLink = { label: string; href: string; external?: boolean }
type HeroData = {
  eyebrow?: string
  headlineLine1?: string
  headlineLine2?: string
  headlineTagline?: string
  subheadYellow?: string
  subheadBody?: string
  primaryCta?: CtaLink
  secondaryCta?: CtaLink
  tickerItems?: string[]
  bayCardStatus?: string
  bayCardHeading?: string
  bayCardBody?: string
  avgWashTime?: string
  paymentLine?: string
  backgroundImage?: ImageWithAlt | null
}

const HERO_FALLBACK: Required<Omit<HeroData, 'backgroundImage'>> = {
  eyebrow: 'Forest Park, Illinois · Two locations',
  headlineLine1: 'Spotless',
  headlineLine2: 'Carwash',
  headlineTagline: '— keep it clean.',
  subheadYellow: "Forest Park's touchless car wash. For 30 years.",
  subheadBody:
    'Heated indoor bays. No brushes. Open 7am–10pm, every day since 1994.',
  primaryCta: { label: 'See wash packages', href: '#washes', external: false },
  secondaryCta: { label: 'How it works', href: '#how', external: false },
  tickerItems: [
    'KEEP IT CLEAN',
    'TOUCHLESS AUTO WASH',
    'HEATED INDOOR BAYS AT ROOSEVELT RD',
    'SELF-SERVE WAND BAYS',
    'OPEN 7AM–10PM',
    'SPOT FREE RINSE',
  ],
  bayCardStatus: 'Bay 02 ready · Roosevelt Rd',
  bayCardHeading: 'Pull up & watch the lights.',
  bayCardBody:
    "Don't enter unless the light is green. Pull forward slowly, let the message guide you.",
  avgWashTime: '4 min 30s',
  paymentLine: 'Visa · MC · Amex · Apple Pay · Cash · Tokens',
}

function TickerRow({ items }: { items: string[] }) {
  return (
    <span className="inline-flex items-center gap-12">
      {items.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-12">
          {t}
          <span className="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
        </span>
      ))}
    </span>
  )
}

type HeroQueryResult = {
  hero?: HeroData | null
  lights?: { redLabel?: string; yellowLabel?: string; greenLabel?: string } | null
}

export default async function Hero() {
  const result = await sanityFetch<HeroQueryResult>(HERO_QUERY)
  const hero = { ...HERO_FALLBACK, ...(result?.hero ?? {}) }
  const headline1 = hero.headlineLine1
  const lightLabels: HeroLightsLabels = {
    wait: result?.lights?.redLabel,
    slow: result?.lights?.yellowLabel,
    go: result?.lights?.greenLabel,
  }

  return (
    <header
      className="relative overflow-hidden text-white pt-14 md:pt-18"
      style={{ background: 'linear-gradient(180deg,#1947c9 0%,#1B4FD9 55%,#2358ee 100%)' }}
    >
      {hero.backgroundImage?.asset?._ref && (
        <div className="absolute inset-0 pointer-events-none">
          <SanityImage
            image={hero.backgroundImage}
            width={2400}
            height={1200}
            sizes="100vw"
            priority
            className="w-full h-full object-cover opacity-25"
          />
        </div>
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 50% at 80% 10%,rgba(91,168,255,.55),transparent 60%),radial-gradient(40% 40% at 0% 100%,rgba(10,42,107,.6),transparent 60%)',
        }}
      ></div>
      <div className="relative max-w-[1240px] mx-auto px-5 md:px-1 grid md:grid-cols-[1.15fr_.85fr] gap-10 md:gap-15 items-end">
        <div>
          <div className="inline-flex items-center gap-2.5 text-xs font-bold tracking-[0.18em] uppercase text-blue-100 mb-6">
            <span
              className="w-2 h-2 rounded-full bg-yellow-400"
              style={{ boxShadow: '0 0 0 4px rgba(255,217,61,.18)' }}
            ></span>
            {hero.eyebrow}
          </div>
          <h1 className="display italic uppercase text-[64px] sm:text-[96px] md:text-[140px] lg:text-[168px] [text-shadow:-0.035em_0.05em_0_#0a2a6b]">
            <span className="text-[1.75em]">{headline1.charAt(0)}</span>
            {headline1.slice(1)}
            <span className="block pl-[.5em]">{hero.headlineLine2}</span>
            <span className="block normal-case text-blue-100 text-[0.62em] mt-2">{hero.headlineTagline}</span>
          </h1>
          <p className="mt-5 text-xl md:text-2xl font-bold text-yellow-400 max-w-[640px]">
            {hero.subheadYellow}
          </p>
          <p className="mt-5 text-lg max-w-[520px] text-blue-100 leading-relaxed">
            {hero.subheadBody}
          </p>
          <div className="flex gap-3 mt-8 flex-wrap">
            <a
              href={hero.primaryCta.href}
              className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full font-bold text-[15px] bg-yellow-400 text-blue-700 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(255,217,61,.35)] transition"
            >
              {hero.primaryCta.label}
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a
              href={hero.secondaryCta.href}
              className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full font-bold text-[15px] border-2 border-white/40 hover:border-white hover:bg-white/10 transition"
            >
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>

        <aside className="bg-white text-ink rounded-3xl p-6 translate-y-0 md:translate-y-15 shadow-[0_24px_60px_rgba(8,24,63,.35)]">
          <div className="flex items-center gap-2.5 font-bold text-[13px] text-blue-500">
            <span
              className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse2"
              style={{ boxShadow: '0 0 0 5px rgba(34,197,94,.25)' }}
            ></span>
            {hero.bayCardStatus}
          </div>
          <h2 className="mt-3.5 text-[22px] font-extrabold tracking-tight">
            {hero.bayCardHeading}
          </h2>
          <p className="text-[#5b6987] text-sm mt-1">{hero.bayCardBody}</p>
          <HeroLights labels={lightLabels} />
          <div className="flex justify-between items-center mt-4 pt-3.5 border-t border-dashed border-line text-[13px]">
            <span>Avg. wash time</span>
            <b className="font-extrabold">{hero.avgWashTime}</b>
          </div>
          <div className="flex justify-between items-start gap-3 mt-3.5 pt-3.5 border-t border-dashed border-line text-[13px]">
            <span className="shrink-0">Payments</span>
            <b className="font-extrabold text-right">{hero.paymentLine}</b>
          </div>
        </aside>
      </div>

      <div className="bg-yellow-400 text-blue-700 py-3.5 mt-14 md:mt-20 border-y-[3px] border-blue-700 overflow-hidden">
        <div className="flex gap-12 whitespace-nowrap animate-scroll display text-[22px]">
          <TickerRow items={hero.tickerItems} />
          <TickerRow items={hero.tickerItems} />
        </div>
      </div>
    </header>
  )
}

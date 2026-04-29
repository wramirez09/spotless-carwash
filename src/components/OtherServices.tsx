import { sanityFetch } from '@/lib/sanityFetch'
import { renderHighlight } from '@/lib/renderHighlight'

type ServiceCard = {
  code?: string
  title: string
  body: string
  chips?: string[]
  featured?: boolean
  theme?: 'default' | 'blue' | 'wide'
}

type ScheduleRow = { label: string; hours: string }

type OtherServicesData = {
  eyebrow: string
  sectionNumber: string
  heading: string
  subhead: string
  services: ServiceCard[]
  attendant: {
    code: string
    heading: string
    body: string
    schedule: ScheduleRow[]
  }
  houseRules: { kicker: string; body: string }
}

const OTHER_SERVICES_QUERY = `*[_type == "otherServices"][0]{
  eyebrow, sectionNumber, heading, subhead,
  services[]{ code, title, body, chips, featured, theme },
  attendant{ code, heading, body, schedule[]{ label, hours } },
  houseRules{ kicker, body }
}`

const FALLBACK: OtherServicesData = {
  eyebrow: 'Other services',
  sectionNumber: '06',
  heading: 'Everything else **on the lot**.',
  subhead:
    'Vacuums, vending, attendants on duty, and a few house rules. Wash hours are 7AM–10PM daily — bays are always open, attendants keep set hours.',
  services: [
    {
      code: 'SVC / 01',
      title: 'Payment, your way',
      body:
        'All wash bays take all major credit cards, ones, fives & quarters. The automatics also take tens. Tap and Apple Pay accepted too.',
      chips: ['Credit cards', 'Tap / Apple Pay', '$1 / $5', '$10 (auto only)', 'Quarters'],
    },
    {
      code: 'SVC / 02',
      title: 'Vending machines',
      body:
        'Fragrance trees, blue shammy towels & Armor All pads — stocked on-site whenever you need them.',
      chips: ['Fragrance trees', 'Shammy towels', 'Armor All pads'],
    },
    {
      code: 'SVC / 03',
      title: 'Vacuums on the lot',
      body:
        'High-suction vacuums positioned around both lots. Drop a buck and clean out the cabin while your wax cures.',
      theme: 'blue',
    },
    {
      code: 'SVC / 04',
      title: 'Get glossy with **LustraShield**.',
      body:
        'A surface gloss enhancer that beads water and leaves a deep shine. Available in **every bay** — automatic and self-serve. Apply before the spot-free rinse for best results.',
      chips: ['All auto bays', 'All self-serve bays', 'Water-beading shine'],
      featured: true,
      theme: 'wide',
    },
    {
      code: 'SVC / 05',
      title: 'Wash hours',
      body: 'Daily — every day of the week.',
    },
  ],
  attendant: {
    code: 'SVC / 06 — Attendants on duty',
    heading: 'Friendly faces, ready to help.',
    body: 'Attendants on the lot to walk you through bays, swap bills, or just keep things tidy.',
    schedule: [
      { label: 'Mon – Fri', hours: '12PM – 5PM' },
      { label: 'Sat / Sun / Holidays', hours: '9AM – 11AM & 12PM – 4PM' },
    ],
  },
  houseRules: {
    kicker: '// please note',
    body: 'Help keep Spotless a clean, quiet & safe place to wash your car.',
  },
}

function CardIcon({ children }: { children: React.ReactNode }) {
  return <div className="w-7 h-7">{children}</div>
}

function PaymentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1B4FD9" strokeWidth="2">
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path d="M2 10h20M6 15h4" />
    </svg>
  )
}

function VendingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1B4FD9" strokeWidth="2">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h2" />
    </svg>
  )
}

function VacuumIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#FFD93D" strokeWidth="2">
      <path d="M4 21h16M6 21V11a4 4 0 014-4h0V5a2 2 0 012-2h0a2 2 0 012 2v2h0a4 4 0 014 4v10" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1B4FD9" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

const ICON_FOR: (i: number) => React.ReactNode = (i) =>
  [<PaymentIcon key="p" />, <VendingIcon key="v" />, <VacuumIcon key="vac" />, null, <ClockIcon key="c" />][i] ?? null

function ServiceCardEl({ s, index }: { s: ServiceCard; index: number }) {
  const icon = ICON_FOR(index)

  // Vacuums (blue theme card)
  if (s.theme === 'blue') {
    return (
      <article className="bg-blue-500 text-white border border-blue-700 rounded-2xl p-7 flex flex-col gap-3.5 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 90% 0%,rgba(255,217,61,.18),transparent 55%)' }}
        ></div>
        <div className="relative flex items-center justify-between">
          <span className="mono text-xs font-semibold text-blue-100">{s.code}</span>
          {icon && <CardIcon>{icon}</CardIcon>}
        </div>
        <h3 className="display text-[28px] m-0 relative">{s.title}</h3>
        <p className="m-0 text-blue-100 leading-relaxed text-[15px] relative">{s.body}</p>
        <div className="relative flex items-baseline gap-2 mt-auto pt-2">
          <span className="display text-5xl text-yellow-400 leading-none">$1</span>
          <span className="text-blue-100 font-bold text-sm">/ 4 minutes</span>
        </div>
      </article>
    )
  }

  // LustraShield wide / featured card
  if (s.theme === 'wide') {
    return (
      <article className="bg-white border border-line rounded-2xl p-7 flex flex-col gap-3.5 sm:col-span-2">
        <div className="flex items-center justify-between">
          <span className="mono text-xs font-semibold text-[#5b6987]">{s.code}</span>
          {s.featured && (
            <span className="bg-yellow-400 text-blue-700 text-[10px] tracking-[0.16em] font-extrabold px-2.5 py-1 rounded-full uppercase">
              Featured
            </span>
          )}
        </div>
        <h3 className="display text-[36px] m-0">
          {renderHighlight(s.title, 'text-blue-500 yellow-hl')}
        </h3>
        <p className="m-0 text-[#445273] leading-relaxed text-[15px] max-w-[560px]">
          {renderHighlight(s.body, 'font-bold')}
        </p>
        {s.chips && s.chips.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-auto pt-2">
            {s.chips.map((t) => (
              <span key={t} className="bg-paper text-[#1c2c52] text-xs font-bold px-2.5 py-1.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
        )}
      </article>
    )
  }

  // Wash hours card (index 4 in fallback) — special big-time display
  const isWashHours = index === 4
  if (isWashHours) {
    return (
      <article className="bg-white border border-line rounded-2xl p-7 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <span className="mono text-xs font-semibold text-[#5b6987]">{s.code}</span>
          {icon && <CardIcon>{icon}</CardIcon>}
        </div>
        <h3 className="display text-[28px] m-0">{s.title}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="display text-[42px] text-blue-500 leading-none">7AM</span>
          <span className="text-[#5b6987] font-bold">–</span>
          <span className="display text-[42px] text-blue-500 leading-none">10PM</span>
        </div>
        <p className="m-0 text-[#445273] leading-relaxed text-sm">{s.body}</p>
      </article>
    )
  }

  // Default card (Payment, Vending)
  return (
    <article className="bg-white border border-line rounded-2xl p-7 flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <span className="mono text-xs font-semibold text-[#5b6987]">{s.code}</span>
        {icon && <CardIcon>{icon}</CardIcon>}
      </div>
      <h3 className="display text-[28px] m-0">{s.title}</h3>
      <p className="m-0 text-[#445273] leading-relaxed text-[15px]">{s.body}</p>
      {s.chips && s.chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
          {s.chips.map((t) => (
            <span key={t} className="bg-paper text-[#1c2c52] text-xs font-bold px-2.5 py-1.5 rounded-full">
              {t}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

export default async function OtherServices() {
  const data = await sanityFetch<Partial<OtherServicesData>>(OTHER_SERVICES_QUERY)
  const s: OtherServicesData = {
    ...FALLBACK,
    ...(data ?? {}),
    services: data?.services?.length ? data.services : FALLBACK.services,
    attendant: { ...FALLBACK.attendant, ...(data?.attendant ?? {}) },
    houseRules: { ...FALLBACK.houseRules, ...(data?.houseRules ?? {}) },
  }

  return (
    <section id="services" className="pt-16 md:pt-24 pb-8 md:pb-10">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7">
        <div className="flex items-end justify-between gap-10 mb-10 md:mb-12 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2.5">
              <span className="mono text-[#5b6987] font-medium">{s.sectionNumber} /</span> {s.eyebrow}
            </div>
            <h2 className="display text-[40px] sm:text-[56px] md:text-[72px] max-w-[780px] m-0">
              {renderHighlight(s.heading, 'text-blue-500 yellow-hl')}
            </h2>
          </div>
          <p className="max-w-[380px] text-[#445273] leading-relaxed">{s.subhead}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {s.services.map((sv, i) => (
            <ServiceCardEl key={`${sv.code ?? i}-${i}`} s={sv} index={i} />
          ))}
        </div>

        {/* Attendants */}
        <article className="mt-4 bg-paper2 border border-line rounded-2xl p-8 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 md:gap-8 items-center">
          <div className="bg-white border border-line rounded-2xl w-16 h-16 flex items-center justify-center">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#1B4FD9" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0116 0" />
            </svg>
          </div>
          <div>
            <div className="mono text-[11px] font-semibold text-[#5b6987] tracking-[0.18em] uppercase">
              {s.attendant.code}
            </div>
            <h3 className="display text-[30px] mt-1.5 mb-1.5 m-0">{s.attendant.heading}</h3>
            <p className="m-0 text-[#445273] leading-relaxed text-[15px]">{s.attendant.body}</p>
          </div>
          <div className="flex flex-col gap-2.5 md:min-w-[280px]">
            {s.attendant.schedule.map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-center bg-white border border-line rounded-xl px-4 py-3 text-sm gap-2"
              >
                <span className="font-bold text-[#1c2c52]">{row.label}</span>
                <span className="mono text-blue-500 font-semibold text-right">{row.hours}</span>
              </div>
            ))}
          </div>
        </article>

        {/* House rules banner */}
        <div className="mt-6 bg-blue-700 text-white rounded-2xl p-8 md:px-10 flex flex-col sm:flex-row items-center gap-7 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 0% 50%,rgba(255,217,61,.12),transparent 50%)' }}
          ></div>
          <div
            className="bg-yellow-400 text-blue-700 w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-[3px] border-white relative"
            style={{ boxShadow: '0 0 0 3px #0A2A6B' }}
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 9v4M12 17h0" />
              <path d="M10.3 3.86l-8.05 14a2 2 0 001.74 3h16.06a2 2 0 001.74-3l-8.05-14a2 2 0 00-3.48 0z" />
            </svg>
          </div>
          <div className="relative flex flex-col justify-center">
            <div className="mono text-[11px] font-semibold text-yellow-400 tracking-[0.22em] uppercase mb-1.5">
              {s.houseRules.kicker}
            </div>
            <p className="display text-[22px] sm:text-[26px] md:text-[32px] leading-tight m-0">
              {s.houseRules.body}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

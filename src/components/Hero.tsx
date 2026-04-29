import HeroLights from './HeroLights'

const tickerItems = [
  'KEEP IT CLEAN',
  'TOUCHLESS AUTO WASH',
  'HEATED BAYS AT ROOSEVELT RD',
  'OPEN 7AM–10PM',
  'SPOT FREE RINSE',
]

function TickerRow() {
  return (
    <span className="inline-flex items-center gap-12">
      {tickerItems.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-12">
          {t}
          <span className="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
        </span>
      ))}
    </span>
  )
}

export default function Hero() {
  return (
    <header
      className="relative overflow-hidden text-white pt-14 md:pt-18"
      style={{ background: 'linear-gradient(180deg,#1947c9 0%,#1B4FD9 55%,#2358ee 100%)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 50% at 80% 10%,rgba(91,168,255,.55),transparent 60%),radial-gradient(40% 40% at 0% 100%,rgba(10,42,107,.6),transparent 60%)',
        }}
      ></div>
      <div className="relative max-w-[1240px] mx-auto px-5 md:px-7 grid md:grid-cols-[1.15fr_.85fr] gap-10 md:gap-15 items-end">
        <div>
          <div className="inline-flex items-center gap-2.5 text-xs font-bold tracking-[0.18em] uppercase text-blue-100 mb-6">
            <span
              className="w-2 h-2 rounded-full bg-yellow-400"
              style={{ boxShadow: '0 0 0 4px rgba(255,217,61,.18)' }}
            ></span>
            Forest Park, Illinois · Two locations · Since the 90s
          </div>
          <h1 className="display text-[64px] sm:text-[96px] md:text-[140px] lg:text-[168px] [text-shadow:-0.035em_0.05em_0_#0a2a6b]">
            <span className="text-yellow-400 text-[200px]">S</span>potless
            <br />
            Carwash
            <span className="block text-blue-100 text-[0.62em] mt-2">— keep it clean.</span>
          </h1>
          <p className="mt-5 text-xl md:text-2xl font-bold text-yellow-400 max-w-[640px]">
            Forest Park's touchless car wash.
          </p>
          <p className="mt-5 text-lg max-w-[520px] text-blue-100 leading-relaxed">
            Nothing touches your vehicle except soap, wax, and water. Simply pull in, and our touchless wash does the rest. At our Roosevelt Road location, heated enclosed bays keep your vehicle washed and blow-dried indoors—perfect for winter.
          </p>
          <div className="flex gap-3 mt-8 flex-wrap">
            <a
              href="#washes"
              className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full font-bold text-[15px] bg-yellow-400 text-blue-700 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(255,217,61,.35)] transition"
            >
              See wash packages
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full font-bold text-[15px] border-2 border-white/40 hover:border-white hover:bg-white/10 transition"
            >
              How it works
            </a>
          </div>
        </div>

        <aside className="bg-white text-ink rounded-3xl p-6 translate-y-0 md:translate-y-15 shadow-[0_24px_60px_rgba(8,24,63,.35)]">
          <div className="flex items-center gap-2.5 font-bold text-[13px] text-blue-500">
            <span
              className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse2"
              style={{ boxShadow: '0 0 0 5px rgba(91,168,255,.25)' }}
            ></span>
            Bay 02 ready · Roosevelt Rd
          </div>
          <h2 className="mt-3.5 text-[22px] font-extrabold tracking-tight">
            Pull up &amp; watch the lights.
          </h2>
          <p className="text-[#5b6987] text-sm mt-1">
            Don't enter unless the light is green. Pull forward slowly, let the message guide you.
          </p>
          <HeroLights />
          <div className="flex justify-between items-center mt-4 pt-3.5 border-t border-dashed border-line text-[13px]">
            <span>Avg. wash time</span>
            <b className="font-extrabold">4 min 30s</b>
          </div>
          <div className="flex justify-between items-start gap-3 mt-3.5 pt-3.5 border-t border-dashed border-line text-[13px]">
            <span className="shrink-0">Payments</span>
            <b className="font-extrabold text-right">Visa · MC · Amex · Apple Pay · Cash · Tokens</b>
          </div>
        </aside>
      </div>

      <div className="bg-yellow-400 text-blue-700 py-3.5 mt-14 md:mt-20 border-y-[3px] border-blue-700 overflow-hidden">
        <div className="flex gap-12 whitespace-nowrap animate-scroll display text-[22px]">
          <TickerRow />
          <TickerRow />
        </div>
      </div>
    </header>
  )
}

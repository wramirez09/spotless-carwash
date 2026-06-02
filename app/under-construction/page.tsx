import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Spotless Carwash — Site under construction',
  description:
    'Our website is getting a fresh coat. Our bays are open and washing as always — touchless automatic, self-serve wand bays, and Lustra Shield gloss. Forest Park, IL.',
  openGraph: {
    title: 'Spotless Carwash — Site under construction',
    description:
      'Our bays are open and washing as always — touchless automatic, self-serve wand bays, and Lustra Shield gloss. Forest Park, IL.',
  },
}

export default function UnderConstructionPage() {
  return (
    <div
      className="min-h-screen flex flex-col text-white"
      style={{ background: 'linear-gradient(180deg,#1947c9 0%,#1B4FD9 55%,#2358ee 100%)' }}
    >
      <div className="sticky top-0 z-50">
        {/* NAV — branding only */}
        <nav className="bg-blue-500 text-white border-b-[3px] border-blue-700">
          <div className="max-w-[1240px] mx-auto flex items-center justify-center px-5 md:px-7 py-3.5">
            <span className="uc-display italic uppercase text-white text-[22px] [text-shadow:-0.035em_0.05em_0_#0a2a6b]">
              <span className="text-[35px]">S</span>POTLESS
              <div className="pl-[.5em]">CARWASH</div>
            </span>
          </div>
        </nav>

        {/* TOP RIBBON */}
        <div className="bg-yellow-400 text-blue-700 py-3.5 border-y-[3px] border-blue-700">
          <div className="max-w-[1240px] mx-auto px-5 md:px-7 text-center font-extrabold tracking-[0.16em] text-[13px] sm:text-sm">
            SINCE 1994 · FOREST PARK&apos;S CAR WASH FOR 30 YEARS
          </div>
        </div>
      </div>

      {/* HERO / ANNOUNCEMENT */}
      <main className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 uc-hazard-soft pointer-events-none"></div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(60% 50% at 80% 0%,rgba(91,168,255,.4),transparent 60%),radial-gradient(50% 40% at 0% 100%,rgba(10,42,107,.5),transparent 60%)',
          }}
        ></div>

        {/* HERO CONTENT */}
        <section className="relative max-w-[1100px] mx-auto px-5 md:px-7 pt-16 md:pt-24 pb-12 text-center">
          <div className="inline-flex items-center gap-2.5 bg-yellow-400 text-blue-700 rounded-full px-4 py-2 text-[11px] font-extrabold tracking-[0.22em] uppercase mb-7 border-2 border-blue-700">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 9v4M12 17h0" />
              <path d="M10.3 3.86l-8.05 14a2 2 0 001.74 3h16.06a2 2 0 001.74-3l-8.05-14a2 2 0 00-3.48 0z" />
            </svg>
            Pardon our dust
          </div>

          <h1 className="uc-display text-[clamp(2.75rem,12vw,8.75rem)] leading-[0.95]">
            Website under
            <span className="block">
              <em className="text-yellow-400" style={{ fontStyle: 'italic' }}>
                construction
              </em>
              .
            </span>
          </h1>

          <p className="mt-7 max-w-[640px] mx-auto text-[#cfe0ff] text-lg leading-relaxed">
            Our new website is getting a fresh coat. While we polish the digital storefront, our{' '}
            <strong className="text-white">bays are open and washing as always</strong> — touchless
            automatic, self-serve wand bays, and Lustra Shield gloss in every bay.
          </p>

          {/* progress bar */}
          <div className="mt-9 max-w-[520px] mx-auto">
            <div className="flex justify-between items-baseline mb-2 text-[12px] font-bold tracking-[0.2em] uppercase">
              <span className="text-[#cfe0ff]">Build progress</span>
              <span className="mono text-yellow-400">68%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/15">
              <div className="h-full bg-yellow-400 rounded-full uc-hazard" style={{ width: '68%' }}></div>
            </div>
            <div className="mt-3 mono text-[11px] text-[#9bb6ff] text-left sm:text-center">
              est. relaunch — summer 2026
            </div>
          </div>

          {/* BUTTONS */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="tel:+17087712945"
              className="inline-flex items-center gap-3 bg-yellow-400 text-blue-700 font-extrabold px-6 py-3.5 rounded-full border-2 border-blue-700 hover:bg-white transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              Call (708) 771-2945
            </a>
            <a
              href="https://maps.google.com/?q=7802+Madison+Street+Forest+Park+IL"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-transparent text-white border-2 border-white/40 px-6 py-3.5 rounded-full font-extrabold hover:border-white transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Find us on Google Maps
            </a>
          </div>

          <section className="mt-10 rounded-[32px] border border-white/20 bg-white/10 p-5 shadow-[0_35px_70px_-35px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <div className="max-w-[980px] mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-[#cfe0ff]">Buy wash tokens</p>
                <p className="mt-1 text-xl font-black text-white">Save up to 20% on ultimate washes</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://www.paypal.com/ncp/payment/VZ896M2HPTEPC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-full bg-yellow-400 px-6 py-3.5 text-blue-950 font-extrabold shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300"
                >
                  <span>Buy tokens</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M13 5l7 7-7 7" />
                    <path d="M5 12h14" />
                  </svg>
                </a>
                <a
                  href="tel:+17087712945"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3.5 text-sm font-bold text-white transition hover:border-white"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  Call (708) 771-2945
                </a>
              </div>
            </div>
          </section>

          {/* LOCATION INTRO */}
          <div className="max-w-[1100px] mx-auto text-left mt-14 px-5 md:px-7">
            <div className="mono text-[11px] uppercase tracking-[0.3em] text-yellow-400 mb-3">Find us</div>
            <h2 className="uc-display text-4xl md:text-[56px]">
              Two locations. Ten bays. All in Forest Park.
            </h2>
            <p className="mt-4 text-[#cfe0ff] max-w-[760px] text-sm md:text-base">
              Both locations open 7am–10pm daily. Roosevelt Rd has heated indoor touchless automatic
              bays for winter; Madison St serves Forest Park, Oak Park, and Eisenhower commuters from
              the north.
            </p>
          </div>

          {/* LOCATION CARDS */}
          <section className="mt-14 grid gap-6 lg:grid-cols-2">
            <article className="rounded-[32px] bg-white/95 text-slate-950 shadow-[0_30px_95px_-40px_rgba(9,55,132,.55)] p-8 border border-slate-200/80 backdrop-blur-sm text-left">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.32em] text-slate-400">LOC / 01</span>
                  <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                    Roosevelt Rd{' '}
                    <span className="inline-flex items-center rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-blue-950">
                      New
                    </span>
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black tracking-tight text-blue-950">7→10</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">Daily hours</p>
                </div>
              </div>
              <p className="mt-6 text-sm text-slate-600">
                7343 Roosevelt Road
                <br />
                Forest Park, IL 60130
              </p>
              <p className="mt-4 text-sm uppercase tracking-[0.22em] text-blue-950 font-bold">
                3 self-serve bays · 2 touchless auto · 7am–10pm daily
              </p>
              <a
                href="https://maps.google.com/?q=7343+Roosevelt+Road+Forest+Park+IL"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700"
              >
                Get directions
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </a>
            </article>

            <article className="rounded-[32px] bg-white/95 text-slate-950 shadow-[0_30px_95px_-40px_rgba(9,55,132,.55)] p-8 border border-slate-200/80 backdrop-blur-sm text-left">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.32em] text-slate-400">LOC / 02</span>
                  <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">Madison St</h2>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black tracking-tight text-blue-950">7→10</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">Daily hours</p>
                </div>
              </div>
              <p className="mt-6 text-sm text-slate-600">
                7802 Madison Street
                <br />
                Forest Park, IL 60130
              </p>
              <p className="mt-4 text-sm uppercase tracking-[0.22em] text-blue-950 font-bold">
                3 self-serve bays · 2 touchless auto · 7am–10pm daily
              </p>
              <a
                href="https://maps.google.com/?q=7802+Madison+Street+Forest+Park+IL"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700"
              >
                Get directions
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </a>
            </article>
          </section>

          <section className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] bg-white/10 border border-white/15 p-5 backdrop-blur-sm flex items-start gap-4">
              <div className="min-w-[44px] min-h-[44px] rounded-2xl bg-yellow-400 text-blue-950 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#cfe0ff]">Phone</p>
                <p className="mt-2 font-bold text-white">(708) 771-2945</p>
              </div>
            </div>
            <div className="rounded-[24px] bg-white/10 border border-white/15 p-5 backdrop-blur-sm flex items-start gap-4">
              <div className="min-w-[44px] min-h-[44px] rounded-2xl bg-yellow-400 text-blue-950 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 4h16v16H4z" />
                  <path d="M4 4l8 8 8-8" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#cfe0ff]">Email</p>
                <p className="mt-2 font-bold text-white">info@spotlessautowash.com</p>
              </div>
            </div>
            <div className="rounded-[24px] bg-white/10 border border-white/15 p-5 backdrop-blur-sm flex items-start gap-4">
              <div className="min-w-[44px] min-h-[44px] rounded-2xl bg-yellow-400 text-blue-950 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M5.5 20.5a7 7 0 0113 0" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#cfe0ff]">Attendants</p>
                <p className="mt-2 font-bold text-white">
                  M–F 12–5pm
                  <br />
                  Wknd 9–11 &amp; 12–4
                </p>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  )
}

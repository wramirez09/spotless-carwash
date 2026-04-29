function CardIcon({ children }: { children: React.ReactNode }) {
  return <div className="w-7 h-7">{children}</div>
}

export default function OtherServices() {
  return (
    <section id="services" className="pb-16 md:pb-24 pt-16 md:pt-24">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7">
        <div className="flex items-end justify-between gap-10 mb-10 md:mb-12 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2.5">
              <span className="mono text-[#5b6987] font-medium">06 /</span> Other services
            </div>
            <h2 className="display text-[40px] sm:text-[56px] md:text-[72px] max-w-[780px] m-0">
              Everything else <em className="text-blue-500 yellow-hl">on the lot</em>.
            </h2>
          </div>
          <p className="max-w-[380px] text-[#445273] leading-relaxed">
            Vacuums, vending, attendants on duty, and a few house rules. Wash hours are 7AM–10PM
            daily — bays are always open, attendants keep set hours.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Payment */}
          <article className="bg-white border border-line rounded-2xl p-7 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="mono text-xs font-semibold text-[#5b6987]">SVC / 01</span>
              <CardIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="#1B4FD9" strokeWidth="2">
                  <rect x="2" y="6" width="20" height="13" rx="2" />
                  <path d="M2 10h20M6 15h4" />
                </svg>
              </CardIcon>
            </div>
            <h3 className="display text-[28px] m-0">Payment, your way</h3>
            <p className="m-0 text-[#445273] leading-relaxed text-[15px]">
              All wash bays take all major credit cards, ones, fives &amp; quarters. The automatics
              also take tens. Tap and Apple Pay accepted too.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
              {['Credit cards', 'Tap / Apple Pay', '$1 / $5', '$10 (auto only)', 'Quarters'].map((t) => (
                <span key={t} className="bg-paper text-[#1c2c52] text-xs font-bold px-2.5 py-1.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </article>

          {/* Vending */}
          <article className="bg-white border border-line rounded-2xl p-7 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="mono text-xs font-semibold text-[#5b6987]">SVC / 02</span>
              <CardIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="#1B4FD9" strokeWidth="2">
                  <rect x="5" y="3" width="14" height="18" rx="2" />
                  <path d="M9 7h6M9 11h6M9 15h2" />
                </svg>
              </CardIcon>
            </div>
            <h3 className="display text-[28px] m-0">Vending machines</h3>
            <p className="m-0 text-[#445273] leading-relaxed text-[15px]">
              Fragrance trees, blue shammy towels &amp; Armor All pads — stocked on-site whenever
              you need them.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
              {['Fragrance trees', 'Shammy towels', 'Armor All pads'].map((t) => (
                <span key={t} className="bg-paper text-[#1c2c52] text-xs font-bold px-2.5 py-1.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </article>

          {/* Vacuums */}
          <article className="bg-blue-500 text-white border border-blue-700 rounded-2xl p-7 flex flex-col gap-3.5 relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 90% 0%,rgba(255,217,61,.18),transparent 55%)' }}
            ></div>
            <div className="relative flex items-center justify-between">
              <span className="mono text-xs font-semibold text-blue-100">SVC / 03</span>
              <CardIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="#FFD93D" strokeWidth="2">
                  <path d="M4 21h16M6 21V11a4 4 0 014-4h0V5a2 2 0 012-2h0a2 2 0 012 2v2h0a4 4 0 014 4v10" />
                </svg>
              </CardIcon>
            </div>
            <h3 className="display text-[28px] m-0 relative">Vacuums on the lot</h3>
            <p className="m-0 text-blue-100 leading-relaxed text-[15px] relative">
              High-suction vacuums positioned around both lots. Drop a buck and clean out the cabin
              while your wax cures.
            </p>
            <div className="relative flex items-baseline gap-2 mt-auto pt-2">
              <span className="display text-5xl text-yellow-400 leading-none">$1</span>
              <span className="text-blue-100 font-bold text-sm">/ 4 minutes</span>
            </div>
          </article>

          {/* LustraShield */}
          <article className="bg-white border border-line rounded-2xl p-7 flex flex-col gap-3.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="mono text-xs font-semibold text-[#5b6987]">SVC / 04</span>
              <span className="bg-yellow-400 text-blue-700 text-[10px] tracking-[0.16em] font-extrabold px-2.5 py-1 rounded-full uppercase">
                Featured
              </span>
            </div>
            <h3 className="display text-[36px] m-0">
              Get glossy with <span className="text-blue-500 yellow-hl">LustraShield</span>.
            </h3>
            <p className="m-0 text-[#445273] leading-relaxed text-[15px] max-w-[560px]">
              A surface gloss enhancer that beads water and leaves a deep shine. Available in{' '}
              <strong>every bay</strong> — automatic and self-serve. Apply before the spot-free
              rinse for best results.
            </p>
            <div className="flex flex-wrap gap-2 mt-auto pt-2">
              {['All auto bays', 'All self-serve bays', 'Water-beading shine'].map((t) => (
                <span key={t} className="bg-paper text-[#1c2c52] text-xs font-bold px-2.5 py-1.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </article>

          {/* Wash hours */}
          <article className="bg-white border border-line rounded-2xl p-7 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="mono text-xs font-semibold text-[#5b6987]">SVC / 05</span>
              <CardIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="#1B4FD9" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </CardIcon>
            </div>
            <h3 className="display text-[28px] m-0">Wash hours</h3>
            <div className="flex items-baseline gap-1.5">
              <span className="display text-[42px] text-blue-500 leading-none">7AM</span>
              <span className="text-[#5b6987] font-bold">–</span>
              <span className="display text-[42px] text-blue-500 leading-none">10PM</span>
            </div>
            <p className="m-0 text-[#445273] leading-relaxed text-sm">Daily — every day of the week.</p>
          </article>
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
              SVC / 06 — Attendants on duty
            </div>
            <h3 className="display text-[30px] mt-1.5 mb-1.5 m-0">Friendly faces, ready to help.</h3>
            <p className="m-0 text-[#445273] leading-relaxed text-[15px]">
              Attendants on the lot to walk you through bays, swap bills, or just keep things tidy.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 md:min-w-[280px]">
            <div className="flex justify-between items-center bg-white border border-line rounded-xl px-4 py-3 text-sm">
              <span className="font-bold text-[#1c2c52]">Mon – Fri</span>
              <span className="mono text-blue-500 font-semibold">12PM – 5PM</span>
            </div>
            <div className="flex justify-between items-center bg-white border border-line rounded-xl px-4 py-3 text-sm gap-2">
              <span className="font-bold text-[#1c2c52]">Sat / Sun / Holidays</span>
              <span className="mono text-blue-500 font-semibold text-right">9AM – 11AM &amp; 12PM – 4PM</span>
            </div>
          </div>
        </article>

        {/* House rules banner */}
        <div className="mt-6 bg-blue-700 text-white rounded-2xl p-8 md:px-10 flex flex-col sm:flex-row items-start sm:items-center gap-7 relative overflow-hidden">
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
          <div className="relative">
            <div className="mono text-[11px] font-semibold text-yellow-400 tracking-[0.22em] uppercase mb-1.5">
              // please note
            </div>
            <p className="display text-[22px] sm:text-[26px] md:text-[32px] leading-tight m-0">
              Help keep Spotless a clean, quiet &amp; safe place to wash your car.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

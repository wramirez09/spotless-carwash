const tiers = [
  { qty: 5, price: '$45' },
  { qty: 10, price: '$85 · save $5' },
  { qty: 25, price: '$200 · save $25' },
]

export default function Tokens() {
  return (
    <section id="tokens" className="pb-16 md:pb-24 pt-16 md:pt-24">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7">
        <div
          className="rounded-[28px] p-8 md:p-16 grid md:grid-cols-2 gap-10 md:gap-15 items-center relative overflow-hidden text-white"
          style={{ background: 'linear-gradient(135deg,#1B4FD9 0%,#0A2A6B 100%)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 90% 10%,rgba(255,217,61,.2),transparent 50%)',
            }}
          ></div>
          <div className="relative flex flex-col justify-center h-full">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-yellow-400 mb-2.5">
              <span className="mono text-blue-200 font-medium">06 /</span> Wash tokens
            </div>
            <h2 className="display text-[40px] sm:text-[56px] md:text-[68px] m-0 mb-4">
              Buy a stack,
              <br />
              save a stack of <em className="text-yellow-400">cash</em>.
            </h2>
            <p className="text-blue-100 leading-relaxed max-w-[440px] mb-7">
              Pre-paid tokens for the automatic bays — works at both Forest Park locations. Stash
              'em in the glovebox and skip the cash station.
            </p>
            <a
              href="#"
              className="self-start inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full font-bold text-[15px] bg-yellow-400 text-blue-700 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(255,217,61,.35)] transition"
            >
              Buy tokens
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>
          <div className="relative flex flex-col gap-3.5 items-end justify-center">
            {tiers.map((t) => (
              <div
                key={t.qty}
                className="bg-yellow-400 text-blue-700 rounded-full px-7 py-4.5 flex items-center gap-4.5 display shadow-[0_12px_30px_rgba(0,0,0,.3)] w-fit"
              >
                <span className="text-[38px] leading-none">{t.qty}</span>
                <span className="text-sm not-italic font-sans font-extrabold tracking-[0.08em] uppercase border-l-2 border-blue-700 pl-4.5">
                  Tokens
                </span>
                <span className="bg-blue-700 text-yellow-400 text-[11px] not-italic font-sans font-extrabold px-2.5 py-1 rounded-full tracking-[0.1em]">
                  {t.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

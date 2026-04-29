import { dialSteps } from '@/src/data/dial'

export default function Instructions() {
  return (
    <section className="bg-[#0a1b3f] text-white py-16 md:py-24">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7 grid md:grid-cols-[.9fr_1.1fr] gap-10 md:gap-15 items-start">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-yellow-400 mb-2.5">
            <span className="mono text-[#a0b3da] font-medium">05 /</span> Self-serve dial
          </div>
          <h2 className="display text-[40px] sm:text-[56px] md:text-[72px] m-0 text-white">
            Nine settings.
            <br />
            One <em className="text-yellow-400">clean</em> car.
          </h2>
          <p className="max-w-[380px] text-blue-100 leading-relaxed mt-6">
            Always start at the top, work top-to-bottom, and let presoak sit 10–20 seconds before
            rinsing. Finish with spot-free rinse — never DuraShield as the final step.
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-[20px] overflow-hidden">
          {dialSteps.map((s, i) => (
            <div
              key={s.n}
              className={
                'grid grid-cols-[60px_1fr_auto] sm:grid-cols-[80px_1fr_120px] items-center px-5 sm:px-6 py-4 gap-5' +
                (i < dialSteps.length - 1 ? ' border-b border-white/10' : '')
              }
            >
              <div className="display text-[28px] text-yellow-400 leading-none">{s.n}</div>
              <div>
                <h3 className="m-0 mb-0.5 text-base font-extrabold tracking-tight">{s.title}</h3>
                <p className="m-0 text-[13px] text-blue-100 leading-snug">{s.description}</p>
              </div>
              <div className="mono text-[13px] font-semibold bg-yellow-400/10 text-yellow-400 px-2.5 py-1.5 rounded-lg text-center">
                $4 / 5 min
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useState } from 'react'

const steps = [
  { n: '01', t: 'Pay at the station', d: 'Tap, card, cash, or token — Apple Pay too. Pick your wash (8, 9, 10, or 12) and confirm.' },
  { n: '02', t: 'Wait for green', d: "Don't pull in unless you have a green light. Red & yellow mean wait." },
  { n: '03', t: 'Pull in & park', d: 'Pull forward slowly. Hit the RED STOP signal, then put your car in park and sit tight.' },
  { n: '04', t: 'Watch the timer', d: 'Check the countdown timer straight ahead. When the door opens and the dryers finish, pull through.' },
]

const seq = [
  { r: 0, y: 0, g: 1, t: 'GO' },
  { r: 0, y: 1, g: 0, t: 'BACK UP' },
  { r: 1, y: 0, g: 0, t: 'STOP' },
  { r: 0, y: 1, g: 0, t: 'BACK UP' },
]

export default function How() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % seq.length), 2200)
    return () => clearInterval(id)
  }, [])

  const s = seq[i]

  return (
    <section id="how" className="pb-16 md:pb-24">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7">
        <div className="bg-[#0a1b3f] text-white rounded-[28px] p-8 md:p-16 grid md:grid-cols-2 gap-10 md:gap-15 items-center relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(50% 60% at 80% 50%,rgba(27,79,217,.45),transparent 70%)',
            }}
          ></div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-yellow-400 mb-2.5">
              <span className="mono text-blue-200 font-medium">02 /</span> How it works
            </div>
            <h2 className="display text-[36px] md:text-[60px] m-0 mb-4">
              Watch the lights.
              <br />
              Don't back up.
            </h2>
            <p className="text-blue-100 leading-relaxed max-w-[480px]">
              Our automatic bays run on a simple traffic-light system. Wait for green, pull forward
              slow, hit the stop signal, and let the timer count down.
            </p>
            <div className="flex flex-col gap-5 mt-8">
              {steps.map((st) => (
                <div key={st.n} className="flex gap-4 items-start">
                  <div className="display text-[34px] text-yellow-400 leading-none w-11 shrink-0">
                    {st.n}
                  </div>
                  <div>
                    <h3 className="m-0 mb-1 text-[17px] font-extrabold tracking-tight">{st.t}</h3>
                    <p className="m-0 text-sm text-blue-100">{st.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            className="relative bg-[#06122c] rounded-3xl border-2 border-[#142855] p-9 flex flex-col gap-4.5 items-center"
            style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,.6),0 30px 80px rgba(0,0,0,.5)' }}
          >
            <div className="display text-white text-lg">BAY SIGNAL</div>
            <div className={'lamp' + (s.r ? ' on-r' : '')}></div>
            <div className={'lamp' + (s.y ? ' on-y' : '')}></div>
            <div className={'lamp' + (s.g ? ' on-g' : '')}></div>
            <div className="mono text-[11px] tracking-[0.18em] uppercase text-blue-200 -mt-2">
              // status: {s.t}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

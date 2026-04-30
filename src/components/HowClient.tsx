'use client'

import { useEffect, useState } from 'react'
import { renderHighlight } from '@/lib/renderHighlight'

export type HowStep = { n: string; title: string; description: string }
export type HowData = {
  eyebrow: string
  sectionNumber: string
  headlineLine1: string
  headlineLine2: string
  lede: string
  steps: HowStep[]
  bayLabel: string
}

const seq = [
  { r: 0, y: 0, g: 1, t: 'GO' },
  { r: 0, y: 1, g: 0, t: 'BACK UP' },
  { r: 1, y: 0, g: 0, t: 'STOP' },
  { r: 0, y: 1, g: 0, t: 'BACK UP' },
]

export default function HowClient({ data }: { data: HowData }) {
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
              <span className="mono text-blue-200 font-medium">{data.sectionNumber} /</span> {data.eyebrow}
            </div>
            <h2 className="display text-[36px] md:text-[60px] m-0 mb-4">
              {renderHighlight(data.headlineLine1, 'text-yellow-400')}
              <br />
              {renderHighlight(data.headlineLine2, 'text-yellow-400')}
            </h2>
            <p className="text-blue-100 leading-relaxed max-w-[480px]">{data.lede}</p>
            <div className="flex flex-col gap-5 mt-8">
              {data.steps.map((st) => (
                <div key={st.n} className="flex gap-4 items-start">
                  <div className="display text-[34px] text-yellow-400 leading-none w-11 shrink-0">
                    {st.n}
                  </div>
                  <div>
                    <h3 className="m-0 mb-1 text-[17px] font-extrabold tracking-tight">{st.title}</h3>
                    <p className="m-0 text-sm text-blue-100">{st.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            className="relative bg-[#06122c] rounded-3xl border-2 border-[#142855] px-9 pt-6 pb-5 flex flex-col items-center gap-4"
            style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,.6),0 30px 80px rgba(0,0,0,.5)' }}
          >
            <div className="display text-white text-lg">{data.bayLabel}</div>
            <div className="flex flex-col items-center gap-4">
              <div className={'lamp' + (s.r ? ' on-r' : '')}></div>
              <div className={'lamp' + (s.y ? ' on-y' : '')}></div>
              <div className={'lamp' + (s.g ? ' on-g' : '')}></div>
            </div>
            <div className="mono text-[11px] tracking-[0.18em] uppercase text-blue-200">
              // status: {s.t}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

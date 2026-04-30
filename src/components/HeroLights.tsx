'use client'

import { useEffect, useState } from 'react'

type Light = 'wait' | 'slow' | 'go'

const order: Light[] = ['wait', 'slow', 'go', 'slow']

const DEFAULT_LABELS: Record<Light, string> = {
  wait: 'Stop',
  slow: 'Back up',
  go: 'Go',
}

export type HeroLightsLabels = Partial<Record<Light, string>>

const off = {
  wait: { background: '#3a1015', boxShadow: 'inset 0 -6px 12px rgba(0,0,0,.4)' },
  slow: { background: '#3a2a10', boxShadow: 'inset 0 -6px 12px rgba(0,0,0,.4)' },
  go: { background: '#0a2a14', boxShadow: 'inset 0 -6px 12px rgba(0,0,0,.4)' },
} as const

const on = {
  wait: {
    background: 'radial-gradient(circle at 35% 30%,#ff7a85,#c8112a 70%)',
    boxShadow: '0 0 22px rgba(231,42,67,.85),inset 0 -6px 12px rgba(0,0,0,.3)',
  },
  slow: {
    background: 'radial-gradient(circle at 35% 30%,#ffe98a,#f4b400 70%)',
    boxShadow: '0 0 22px rgba(244,180,0,.8),inset 0 -6px 12px rgba(0,0,0,.3)',
  },
  go: {
    background: 'radial-gradient(circle at 35% 30%,#a8f0b4,#22c55e 70%)',
    boxShadow: '0 0 22px rgba(34,197,94,.85),inset 0 -6px 12px rgba(0,0,0,.3)',
  },
} as const

export default function HeroLights({ labels = {} }: { labels?: HeroLightsLabels } = {}) {
  const label: Record<Light, string> = { ...DEFAULT_LABELS, ...labels }
  const [i, setI] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % order.length), 1400)
    return () => clearInterval(id)
  }, [])

  const active = order[i]

  return (
    <div className="grid grid-cols-3 gap-2.5 mt-4">
      {(['wait', 'slow', 'go'] as Light[]).map((light) => {
        const isActive = active === light
        const style = isActive ? on[light] : off[light]
        return (
          <div
            key={light}
            className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5 bg-[#0d1a3a] text-white font-bold text-[11px] tracking-[0.12em] uppercase"
          >
            <div
              className="w-[34px] h-[34px] rounded-full transition-all duration-500 ease-in-out"
              style={style}
            ></div>
            {label[light]}
          </div>
        )
      })}
    </div>
  )
}

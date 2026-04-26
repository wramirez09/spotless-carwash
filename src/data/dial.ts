import type { ReactNode } from 'react'

export type DialStep = {
  n: number
  title: string
  description: string
  descriptionRich?: ReactNode
}

export const dialSteps: DialStep[] = [
  { n: 1, title: 'Engine cleaner', description: 'Low pressure — degrease engine bay & wheel wells.' },
  { n: 2, title: 'Pre-soak', description: 'Loosens road grime — let it dwell 15 seconds.' },
  { n: 3, title: 'Tire & wheel cleaner', description: 'Targeted blast for brake dust & salt buildup.' },
  { n: 4, title: 'High-pressure soap', description: 'Deep clean — work corner-to-corner.' },
  { n: 5, title: 'Foaming brush', description: 'Soft brush + thick suds. Top-down.' },
  { n: 6, title: 'High-pressure rinse', description: 'Strip the suds before they dry.' },
  { n: 7, title: 'Tri-foam polish', description: 'Wax-rich — restores shine.' },
  { n: 8, title: 'Lustra Shield', description: 'Surface gloss — apply before spot-free.' },
  { n: 9, title: 'Spot-free rinse', description: 'De-ionized — no streaks, no spots.' },
]

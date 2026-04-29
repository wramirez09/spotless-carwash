import type { ReactNode } from 'react'

export type DialStep = {
  n: number
  title: string
  description: string
  descriptionRich?: ReactNode
}

export const dialSteps: DialStep[] = [
  { n: 1, title: 'Tire & wheel cleaner', description: 'Targeted blast for brake dust & salt buildup.' },
  { n: 2, title: 'Low-pressure presoak', description: 'Loosens road grime — let it dwell 10–20 seconds.' },
  { n: 3, title: 'Foaming brush', description: 'Soft brush + thick suds. Top-down.' },
  { n: 4, title: 'Polish', description: 'Wax-rich tri-foam — restores shine.' },
  { n: 5, title: 'DuraShield surface gloss', description: 'Surface gloss — apply before spot-free, not as the final step.' },
  { n: 6, title: 'High-pressure soap', description: 'Deep clean — work corner-to-corner.' },
  { n: 7, title: 'High-pressure rinse', description: 'Strip the suds before they dry.' },
  { n: 8, title: 'Spot-free rinse', description: 'De-ionized — no streaks, no spots. Finish here.' },
  { n: 9, title: 'Air-shammee Air Dryer', description: 'Powerful air dryer — finish dry without towels.' },
]

import type { ReactNode } from 'react'

export type DialStep = {
  n: number
  title: string
  description: string
  descriptionRich?: ReactNode
}

export const dialSteps: DialStep[] = [
  { n: 1, title: 'Engine cleaner', description: 'Apply to entire engine. Spot-free rinse.' },
  { n: 2, title: 'Tire & wheel cleaner', description: 'Apply to wheels or tires. High-pressure rinse.' },
  { n: 3, title: 'Low-pressure presoak', description: 'Apply to entire vehicle from bottom up.' },
  { n: 4, title: 'High-pressure detergent', description: 'Apply to entire vehicle from bottom up.' },
  { n: 5, title: 'Foaming brush detergent', description: 'Scrub vehicle, top to bottom. High-pressure rinse.' },
  { n: 6, title: 'High-pressure rinse', description: 'Rinse entire vehicle from top down.' },
  { n: 7, title: 'Clear coat sealant', description: 'Apply to entire vehicle. Finish with final rinse.' },
  { n: 8, title: 'LustraShield', description: 'Apply to entire vehicle. Finish with final rinse.' },
  { n: 9, title: 'Spot-free rinse', description: 'Apply spot-free rinse to entire vehicle.' },
]

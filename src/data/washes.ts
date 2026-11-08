export type WashColor = 'red' | 'green' | 'purple' | 'blue'

export type Pkg = {
  num: string
  name: string
  price: string
  priceNumber: number
  color: WashColor
  features: { text: string; included: boolean }[]
  featured?: boolean
}

// Mirrors the washPackage documents in Sanity, which are the source of truth
// for the wash lineup AND for token pricing: each package's price is the value
// of its token, and every token pack is priced from it (see lib/washPricing.ts).
// This copy is only used when the CMS can't be reached — keep it in step.
export const packages: Pkg[] = [
  {
    num: '10',
    name: 'Deluxe',
    price: '$10',
    priceNumber: 10,
    color: 'green',
    featured: true,
    features: [
      { text: 'Undercarriage spray', included: true },
      { text: 'Single presoak', included: true },
      { text: 'High-pressure rinse', included: true },
      { text: 'Polish', included: true },
      { text: 'Spot-free rinse', included: true },
      { text: 'Air cannon dryer', included: true },
    ],
  },
  {
    num: '12',
    name: 'Ultimate',
    price: '$12',
    priceNumber: 12,
    color: 'purple',
    features: [
      { text: 'Undercarriage spray', included: true },
      { text: 'Double presoak', included: true },
      { text: 'Double high-pressure rinse', included: true },
      { text: 'Polish', included: true },
      { text: 'Spot-free rinse', included: true },
      { text: 'Air cannon dryer', included: true },
    ],
  },
  {
    num: '14',
    name: 'Lustre',
    price: '$14',
    priceNumber: 14,
    color: 'blue',
    features: [
      { text: 'Undercarriage spray', included: true },
      { text: 'Double presoak', included: true },
      { text: 'Double high-pressure rinse', included: true },
      { text: 'Durashield wax', included: true },
      { text: 'Spot-free rinse', included: true },
      { text: 'Air cannon dryer', included: true },
    ],
  },
]

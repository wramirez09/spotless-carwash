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

export const packages: Pkg[] = [
  {
    num: '08',
    name: 'Quick',
    price: '$8',
    priceNumber: 8,
    color: 'red',
    features: [
      { text: 'Single presoak', included: true },
      { text: 'High-pressure rinse', included: true },
      { text: 'Polish', included: true },
    ],
  },
  {
    num: '09',
    name: 'Deluxe',
    price: '$9',
    priceNumber: 9,
    color: 'green',
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
    num: '10',
    name: 'Ultimate',
    price: '$10',
    priceNumber: 10,
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
    num: '12',
    name: 'Lustre',
    price: '$12',
    priceNumber: 12,
    color: 'blue',
    featured: true,
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

export type Pkg = {
  num: string
  name: string
  price: string
  priceNumber: number
  features: { text: string; included: boolean }[]
  featured?: boolean
}

export const packages: Pkg[] = [
  {
    num: '01',
    name: 'Basic',
    price: '$8',
    priceNumber: 8,
    features: [
      { text: 'Pre-soak', included: true },
      { text: 'High-pressure rinse', included: true },
      { text: 'Air cannon dryer', included: false },
      { text: 'Wheel cleaner', included: false },
    ],
  },
  {
    num: '02',
    name: 'Clean',
    price: '$10',
    priceNumber: 10,
    features: [
      { text: 'Pre-soak & foam', included: true },
      { text: 'High-pressure rinse', included: true },
      { text: 'Air cannon dryer', included: true },
      { text: 'Lustra Shield', included: false },
    ],
  },
  {
    num: '03',
    name: 'Spotless',
    price: '$13',
    priceNumber: 13,
    featured: true,
    features: [
      { text: 'Undercarriage spray', included: true },
      { text: 'Foaming brush polish', included: true },
      { text: 'Air cannon dryer', included: true },
      { text: 'Spot-free rinse', included: true },
    ],
  },
  {
    num: '04',
    name: 'Showroom',
    price: '$16',
    priceNumber: 16,
    features: [
      { text: 'Triple-foam wax', included: true },
      { text: 'Lustra Shield seal', included: true },
      { text: 'Hot wax overhead', included: true },
      { text: 'Air cannon dryer', included: true },
    ],
  },
]

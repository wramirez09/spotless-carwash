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
    name: 'Deluxe (No Dryer)',
    price: '$8',
    priceNumber: 8,
    color: 'red',
    features: [
      { text: 'Pre-soak', included: true },
      { text: 'High-pressure rinse', included: true },
      { text: 'Foaming brush polish', included: false },
      { text: 'Air cannon dryer', included: false },
    ],
  },
  {
    num: '09',
    name: 'Deluxe',
    price: '$9',
    priceNumber: 9,
    color: 'green',
    featured: true,
    features: [
      { text: 'Pre-soak & foam', included: true },
      { text: 'High-pressure rinse', included: true },
      { text: 'Air cannon dryer', included: true },
      { text: 'DuraShield surface gloss', included: false },
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
      { text: 'Foaming brush polish', included: true },
      { text: 'Air cannon dryer', included: true },
      { text: 'Spot-free rinse', included: true },
    ],
  },
  {
    num: '12',
    name: 'Lustre',
    price: '$12',
    priceNumber: 12,
    color: 'blue',
    features: [
      { text: 'Triple-foam wax', included: true },
      { text: 'DuraShield surface gloss', included: true },
      { text: 'Hot wax overhead', included: true },
      { text: 'Air cannon dryer', included: true },
    ],
  },
]

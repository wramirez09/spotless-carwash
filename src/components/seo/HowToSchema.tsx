import { dialSteps } from '@/src/data/dial'
import JsonLd from './JsonLd'

export default function HowToSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to use a Spotless Carwash self-serve bay',
    description:
      'The nine-setting dial sequence for a self-serve wand bay at Spotless Carwash. Always work top-down and finish on spot-free rinse.',
    totalTime: 'PT5M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '2.25' },
    step: dialSteps.map((s) => ({
      '@type': 'HowToStep',
      position: s.n,
      name: s.title,
      text: s.description,
    })),
  }
  return <JsonLd data={data} />
}

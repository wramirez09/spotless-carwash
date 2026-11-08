import { sanityFetch } from '@/lib/sanityFetch'
import { fillWashValues } from '@/lib/pricingCopy'
import { getWashLineup } from '@/lib/washPackages'
import HowClient, { type HowData } from './HowClient'

const HOW_QUERY = `*[_type == "howSection"][0]{
  eyebrow, sectionNumber,
  headlineLine1, headlineLine2,
  lede, bayLabel,
  steps[]{ n, title, description }
}`

const FALLBACK: HowData = {
  eyebrow: 'How it works',
  sectionNumber: '02',
  headlineLine1: 'Watch the lights.',
  headlineLine2: "Don't back up.",
  lede:
    'Our automatic bays run on a simple traffic-light system. Wait for green, pull forward slow, hit the stop signal, and let the timer count down.',
  bayLabel: 'BAY SIGNAL',
  steps: [
    {
      n: '01',
      title: 'Pay at the station',
      description: 'Tap, card, cash, or token — Apple Pay too. Pick your wash ({washValues}) and confirm.',
    },
    {
      n: '02',
      title: 'Wait for green',
      description: "Don't pull in unless you have a green light. Red & yellow mean wait.",
    },
    {
      n: '03',
      title: 'Pull in & park',
      description: 'Pull forward slowly. Hit the RED STOP signal, then put your car in park and sit tight.',
    },
    {
      n: '04',
      title: 'Watch the timer',
      description:
        'Check the countdown timer straight ahead. When the door opens and the dryers finish, pull through.',
    },
  ],
}

export default async function How() {
  const [data, washes] = await Promise.all([
    sanityFetch<Partial<HowData>>(HOW_QUERY),
    getWashLineup(),
  ])
  // The wash numbers on the pay station follow the wash packages; a stale
  // "(8, 9, 10, or 12)" left in the CMS is corrected to the current lineup.
  const values = washes.tiers.map((t) => t.washValue)
  const steps = (data?.steps?.length ? data.steps : FALLBACK.steps).map((s) => ({
    ...s,
    description: fillWashValues(s.description, values),
  }))
  const merged: HowData = { ...FALLBACK, ...(data ?? {}), steps }
  return <HowClient data={merged} />
}

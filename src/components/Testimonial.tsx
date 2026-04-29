import { sanityFetch } from '@/lib/sanityFetch'
import TestimonialClient, { type Quote } from './TestimonialClient'

const TESTIMONIAL_QUERY = `*[_type == "testimonialSection"][0]{
  quotes[]{ text, attribution }
}`

const FALLBACK: Quote[] = [
  {
    text:
      'Pulled in right before close after a Chicago snowstorm. Heated bay, four and a half minutes, drove out spotless. The only place that does it right.',
    attribution: 'Forest Park regular',
  },
  {
    text:
      'Self-serve bays have everything you need. The LustraShield + spot-free combo is the move. Tokens make the price feel like nothing.',
    attribution: 'Detail-obsessed neighbor',
  },
  {
    text:
      'My salt-covered SUV looked brand new in under five minutes. Touchless and zero scratches — I will not go anywhere else.',
    attribution: 'Oak Park commuter',
  },
]

export default async function Testimonial() {
  const data = await sanityFetch<{ quotes?: Quote[] }>(TESTIMONIAL_QUERY)
  const quotes = data?.quotes?.length ? data.quotes : FALLBACK
  return <TestimonialClient quotes={quotes} />
}

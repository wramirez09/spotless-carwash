import { sanityFetch } from '@/lib/sanityFetch'
import EmailClient, { type EmailData } from './EmailClient'

const EMAIL_QUERY = `*[_type == "emailSection"][0]{
  headlineLine1, headlineLine2, body, placeholder, submitLabel, successLabel
}`

const FALLBACK: EmailData = {
  headlineLine1: 'Join the list.',
  headlineLine2: 'Wash deals, first.',
  body: 'Subscribe for occasional Forest Park car-care tips, token discounts, and seasonal promos. No spam — unsubscribe anytime.',
  placeholder: 'you@example.com',
  submitLabel: 'Subscribe',
  successLabel: "You're subscribed ✓",
}

export default async function Email() {
  const data = await sanityFetch<Partial<EmailData>>(EMAIL_QUERY)
  return <EmailClient data={{ ...FALLBACK, ...(data ?? {}) }} />
}

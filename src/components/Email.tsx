import { sanityFetch } from '@/lib/sanityFetch'
import EmailClient, { type EmailData } from './EmailClient'

const EMAIL_QUERY = `*[_type == "emailSection"][0]{
  headlineLine1, headlineLine2, body, placeholder, submitLabel, successLabel
}`

const FALLBACK: EmailData = {
  headlineLine1: 'Spotless updates,',
  headlineLine2: 'straight to your inbox.',
  body: 'Subscribe for occasional Forest Park car-care tips and updates from Spotless Car Wash. No spam — unsubscribe anytime.',
  placeholder: 'Enter your email',
  submitLabel: 'Subscribe',
  successLabel: "You're subscribed ✓",
}

export default async function Email() {
  const data = await sanityFetch<Partial<EmailData>>(EMAIL_QUERY)
  return <EmailClient data={{ ...FALLBACK, ...(data ?? {}) }} />
}

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
  // Gated behind an env flag (opt-in): the section only renders when
  // PROMOTIONS_SIGNUP_ENABLED is exactly 'true'. Read server-side, so when off
  // the section never reaches the client HTML.
  if (process.env.PROMOTIONS_SIGNUP_ENABLED !== 'true') return null

  const data = await sanityFetch<Partial<EmailData>>(EMAIL_QUERY)
  return <EmailClient data={{ ...FALLBACK, ...(data ?? {}) }} />
}

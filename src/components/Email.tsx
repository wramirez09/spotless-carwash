import { sanityFetch } from '@/lib/sanityFetch'
import EmailClient, { type EmailData } from './EmailClient'

const EMAIL_QUERY = `*[_type == "emailSection"][0]{
  headlineLine1, headlineLine2, body, placeholder, submitLabel, successLabel
}`

const FALLBACK: EmailData = {
  headlineLine1: 'Special sales,',
  headlineLine2: 'straight to your inbox.',
  body: 'Token discounts, seasonal promos, and the occasional free wash.',
  placeholder: 'you@example.com',
  submitLabel: 'Subscribe',
  successLabel: 'Subscribed ✓',
}

export default async function Email() {
  const data = await sanityFetch<Partial<EmailData>>(EMAIL_QUERY)
  return <EmailClient data={{ ...FALLBACK, ...(data ?? {}) }} />
}

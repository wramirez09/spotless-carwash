import { sanityFetch } from '@/lib/sanityFetch'
import EmailClient, { type EmailData } from './EmailClient'

const EMAIL_QUERY = `*[_type == "emailSection"][0]{
  headlineLine1, headlineLine2, body, placeholder, submitLabel, successLabel
}`

const FALLBACK: EmailData = {
  headlineLine1: 'Get $5 off',
  headlineLine2: 'your first Ultimate wash.',
  body: 'Subscribe for occasional Forest Park car-care tips, token discounts, seasonal promos, and the occasional free wash.',
  placeholder: 'you@example.com',
  submitLabel: 'Send my $5 code',
  successLabel: 'Code on the way ✓',
}

export default async function Email() {
  const data = await sanityFetch<Partial<EmailData>>(EMAIL_QUERY)
  return <EmailClient data={{ ...FALLBACK, ...(data ?? {}) }} />
}

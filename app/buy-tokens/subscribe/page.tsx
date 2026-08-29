import type { Metadata } from 'next'
import SubscribeClient, { type SubscribeCopy } from './SubscribeClient'
import { sanityFetch } from '@/lib/sanityFetch'
import { getSubscriptionPricing } from '@/lib/subscriptionPricing'

const SUBSCRIBE_FALLBACK: SubscribeCopy = {
  metaTitle: 'Wash Token Subscription',
  metaDescription:
    'Wash tokens delivered every month. Pick a plan, and your tokens arrive by mail — no reordering, cancel anytime. Both Forest Park locations.',
  ribbonText: 'Cancel anytime · Secure checkout · Powered by Stripe',
  breadcrumbHome: 'Home',
  breadcrumbTokens: 'Buy tokens',
  breadcrumbCurrent: 'Subscribe',
  headingPrefix: 'Tokens in the mail,',
  headingHighlight: 'every month',
  headingSuffix: '.',
  subhead:
    'Pick a plan and your wash tokens show up by mail. Nothing to reorder, nothing to remember — and they never expire. Cancel any time from your billing page.',

  step1Number: '01',
  step1Kicker: 'Step one',
  step1Title: 'Pick your plan.',
  mostPopularLabel: 'Most Popular',
  perMonthSuffix: '/ mo',
  perTokenSuffix: 'per wash',
  tokensSuffix: 'tokens a month',

  step2Number: '02',
  step2Kicker: 'Step two',
  step2Title: 'Your details.',
  emailLabel: 'Email',
  emailPlaceholder: 'you@example.com',
  emailHelper: 'Receipts and shipping updates go here.',
  nameLabel: 'Full name',
  namePlaceholder: 'Pat Driver',
  phoneLabel: 'Phone',
  phoneOptionalLabel: '(optional)',
  phonePlaceholder: '(708) 555-0100',
  requiredMark: '*',
  mailingListLabel: 'Email me Spotless deals and seasonal offers.',

  step3Number: '03',
  step3Kicker: 'Step three',
  step3Title: 'How delivery works.',
  deliveryHeading: 'Mailed to your door',
  deliveryBody:
    "Your tokens go out by USPS after each monthly payment clears. Add your mailing address on the next screen — Stripe collects it as part of checkout.",
  deliveryChips: ['Both Forest Park locations', 'Tokens never expire', 'Cancel anytime'],

  summaryHeading: 'Your plan',
  summaryBadge: 'Subscription',
  billedLabel: 'Billed',
  billedValue: 'Monthly, starting today',
  totalLabel: 'Per month',
  submitLabel: 'Start subscription',
  submittingLabel: 'Redirecting to Stripe…',
  erroredLabel: 'Try again',
  submitDisclaimer:
    "You'll be redirected to Stripe to enter payment and shipping details. No card details are stored on our site.",
  checkoutErrorMessage:
    'Something went wrong. Please try again or call (708) 771-2945.',

  trustItems: [
    { line1: 'Cancel', line2: 'anytime' },
    { line1: 'Works at', line2: 'both locations' },
    { line1: 'Never', line2: 'expire' },
  ],
  contactPrefix: 'Questions? Call',
  contactConnector: 'or email',
  contactPhoneDisplay: '(708) 771-2945',
  contactEmail: 'info@spotlessautowash.com',
}

const QUERY = `*[_type == "subscriptionPage"][0]{
  metaTitle, metaDescription, ribbonText,
  breadcrumbHome, breadcrumbTokens, breadcrumbCurrent,
  headingPrefix, headingHighlight, headingSuffix, subhead,
  step1Number, step1Kicker, step1Title, mostPopularLabel,
  perMonthSuffix, perTokenSuffix, tokensSuffix,
  step2Number, step2Kicker, step2Title,
  emailLabel, emailPlaceholder, emailHelper,
  nameLabel, namePlaceholder,
  phoneLabel, phoneOptionalLabel, phonePlaceholder, requiredMark,
  mailingListLabel,
  step3Number, step3Kicker, step3Title,
  deliveryHeading, deliveryBody, deliveryChips,
  summaryHeading, summaryBadge, billedLabel, billedValue, totalLabel,
  submitLabel, submittingLabel, erroredLabel, submitDisclaimer,
  checkoutErrorMessage,
  trustItems[]{ line1, line2 },
  contactPrefix, contactConnector, contactPhoneDisplay, contactEmail
}`

async function loadCopy(): Promise<SubscribeCopy> {
  const data = await sanityFetch<Partial<SubscribeCopy> | null>(QUERY)
  if (!data) return SUBSCRIBE_FALLBACK
  // Merge field-by-field so any unset Studio field falls back to the inline
  // default — same approach as the buy-tokens page.
  const merged: SubscribeCopy = { ...SUBSCRIBE_FALLBACK }
  for (const [k, v] of Object.entries(data) as [keyof SubscribeCopy, unknown][]) {
    if (v === null || v === undefined) continue
    if (Array.isArray(v) && v.length === 0) continue
    // @ts-expect-error -- safe per-field copy
    merged[k] = v
  }
  return merged
}

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const copy = await loadCopy()
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: { canonical: '/buy-tokens/subscribe' },
    robots: { index: true, follow: true },
  }
}

export default async function SubscribePage() {
  const [copy, pricing] = await Promise.all([loadCopy(), getSubscriptionPricing()])
  return <SubscribeClient copy={copy} plans={pricing.plans} />
}

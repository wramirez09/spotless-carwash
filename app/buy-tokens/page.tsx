import type { Metadata } from 'next'
import BuyTokensClient, { type BuyTokensCopy } from './BuyTokensClient'
import { sanityFetch } from '@/lib/sanityFetch'
import { getCheckoutPricing } from '@/lib/stripePricing'

const BUY_TOKENS_FALLBACK: BuyTokensCopy = {
  metaTitle: 'Buy Wash Tokens',
  metaDescription:
    "Pre-paid wash tokens for Spotless Carwash's automatic bays. Works at both Forest Park locations. Secure checkout powered by Stripe.",
  ribbonText: 'Secure checkout · Encrypted · Powered by Stripe',
  breadcrumbHome: 'Home',
  breadcrumbCurrent: 'Buy tokens',
  headingPrefix: 'Buy wash',
  headingHighlight: 'tokens',
  headingSuffix: '.',
  subhead:
    "Pre-paid tokens for the automatic bays. Works at both Forest Park locations — Roosevelt Rd and Madison St. Stash 'em in the glovebox and skip the cash station.",
  step1Number: '01',
  step1Kicker: 'Step one',
  step1Title: 'Pick a token pack.',
  mostPopularLabel: 'Most Popular',
  packCodePrefix: 'Pack',
  packTokensSuffix: 'wash · 4-pack',
  savePrefix: 'SAVE',
  eachSuffix: 'ea.',
  quantityHeading: 'Number of packs',
  quantitySubtext: 'Buy multiple packs of the same size.',
  quantityDecreaseLabel: 'Decrease quantity',
  quantityIncreaseLabel: 'Increase quantity',
  quantityInputLabel: 'Number of packs',
  modeHelper: 'Choose how you want to buy',
  modeSingleLabel: 'Single tokens',
  modePackLabel: '4-Pack · Save $5',
  packTokensSuffixSingle: 'wash · single',
  quantityHeadingSingle: 'Number of tokens',
  quantitySubtextSingle: 'Buy any number of individual tokens at the same wash value.',
  quantityInputLabelSingle: 'Number of tokens',
  tokenSingular: 'token',
  tokenPlural: 'tokens',
  step2Number: '02',
  step2Kicker: 'Step two',
  step2Title: 'Your details.',
  emailLabel: 'Email',
  emailPlaceholder: 'you@example.com',
  emailHelper: 'Receipt and token codes will be sent here.',
  nameLabel: 'Full name',
  namePlaceholder: 'Pat Driver',
  phoneLabel: 'Phone',
  phoneOptionalLabel: '(optional)',
  phonePlaceholder: '(708) 555-0100',
  requiredMark: '*',
  step3Number: '03',
  step3Kicker: 'Step three',
  step3Title: 'How to get your tokens.',
  deliveryHeading: 'Email delivery',
  deliveryBody:
    'Token codes are emailed within 1 minute of payment. Bring the email to either location or pick up physical tokens at the cash station during attendant hours.',
  deliveryChips: ['Roosevelt Rd · 24h', 'Madison St · 7am–10pm'],
  summaryHeading: 'Order summary',
  summaryBadge: 'Order',
  perTokenSuffix: 'per token',
  packSingular: 'pack',
  packPlural: 'packs',
  savingsLabel: 'You save',
  taxLabel: 'Tax',
  taxValue: 'Calculated at checkout',
  totalLabel: 'Total',
  submitLabel: 'Pay with Stripe',
  submittingLabel: 'Redirecting to Stripe…',
  erroredLabel: 'Try again',
  submitDisclaimer:
    "You'll be redirected to Stripe to complete payment. No card details are stored on our site.",
  trustItems: [
    { line1: 'PCI-DSS', line2: 'encrypted' },
    { line1: 'Works at', line2: 'both locations' },
    { line1: 'Never', line2: 'expire' },
  ],
  contactPrefix: 'Questions? Call',
  contactConnector: 'or email',
  contactPhoneDisplay: '(708) 771-2945',
  contactEmail: 'info@spotlessautowash.com',
  checkoutErrorMessage: 'Something went wrong. Please try again or call (708) 771-2945.',
}

const QUERY = `*[_type == "buyTokensPage"][0]{
  metaTitle, metaDescription, ribbonText,
  breadcrumbHome, breadcrumbCurrent,
  headingPrefix, headingHighlight, headingSuffix, subhead,
  step1Number, step1Kicker, step1Title, mostPopularLabel,
  packCodePrefix, packTokensSuffix, savePrefix, eachSuffix,
  quantityHeading, quantitySubtext, quantityDecreaseLabel, quantityIncreaseLabel, quantityInputLabel,
  modeHelper, modeSingleLabel, modePackLabel,
  packTokensSuffixSingle, quantityHeadingSingle, quantitySubtextSingle, quantityInputLabelSingle,
  tokenSingular, tokenPlural,
  step2Number, step2Kicker, step2Title,
  emailLabel, emailPlaceholder, emailHelper,
  nameLabel, namePlaceholder,
  phoneLabel, phoneOptionalLabel, phonePlaceholder, requiredMark,
  step3Number, step3Kicker, step3Title,
  deliveryHeading, deliveryBody, deliveryChips,
  summaryHeading, summaryBadge, perTokenSuffix, packSingular, packPlural,
  savingsLabel, taxLabel, taxValue, totalLabel,
  submitLabel, submittingLabel, erroredLabel, submitDisclaimer,
  trustItems[]{ line1, line2 },
  contactPrefix, contactConnector, contactPhoneDisplay, contactEmail,
  checkoutErrorMessage
}`

async function loadCopy(): Promise<BuyTokensCopy> {
  const data = await sanityFetch<Partial<BuyTokensCopy> | null>(QUERY)
  if (!data) return BUY_TOKENS_FALLBACK
  // Merge field-by-field so any unset field falls back to the inline default.
  const merged: BuyTokensCopy = { ...BUY_TOKENS_FALLBACK }
  for (const [k, v] of Object.entries(data) as [keyof BuyTokensCopy, unknown][]) {
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
    alternates: { canonical: '/buy-tokens' },
    robots: { index: true, follow: true },
  }
}
type SearchParams = Promise<Record<string, string | string[] | undefined>>

/**
 * `?_now=<ISO>` simulates a wall-clock time for the Father's Day sale window —
 * used by e2e tests (see `e2e/fathersDaySale.spec.ts`). The override is
 * IGNORED on Vercel Production so it can never leak into a real customer
 * session; on Preview / local dev it's honored if the value parses.
 */
function parseNowOverride(value: string | string[] | undefined): number | undefined {
  if (process.env.VERCEL_ENV === 'production') return undefined
  if (typeof value !== 'string' || value.length === 0) return undefined
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? undefined : ms
}

export default async function BuyTokensPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const params = (await searchParams) ?? {}
  const nowOverrideMs = parseNowOverride(params._now)
  const [copy, pricing] = await Promise.all([
    loadCopy(),
    getCheckoutPricing(nowOverrideMs),
  ])
  return <BuyTokensClient copy={copy} pricing={pricing} />
}

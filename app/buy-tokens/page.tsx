import type { Metadata } from 'next'
import BuyTokensClient from './BuyTokensClient'

export const metadata: Metadata = {
  title: 'Buy Wash Tokens',
  description:
    "Pre-paid wash tokens for Spotless Carwash's automatic bays. Works at both Forest Park locations. Secure checkout powered by Stripe.",
  alternates: { canonical: '/buy-tokens' },
  robots: { index: true, follow: true },
}

export default function BuyTokensPage() {
  return <BuyTokensClient />
}

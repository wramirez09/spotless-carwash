import NavClient, { type NavData } from './NavClient'
import { sanityFetch } from '@/lib/sanityFetch'

const NAV_QUERY = `*[_type == "navbar"][0]{
  logo,
  sectionLinks[]{ label, href, external },
  pageLinks[]{ label, href, external },
  paypalUrl,
  buyTokensLabel,
  phone,
  phoneHref,
  email,
  hoursLine,
  ribbonText
}`

const RIBBON_FALLBACK = "Since 1995 · Forest Park's car wash for 30 years"

const SUBSCRIBE_LINK = { label: 'Subscribe', href: '/buy-tokens/subscribe' }

/**
 * Guarantee the wash-club link is in the nav.
 *
 * `pageLinks` comes from Sanity whenever the navbar document has any, so a
 * fallback-only entry would never appear on the live site. This appends the
 * link only when Sanity doesn't already contain one pointing at the subscribe
 * page — so once it's added in the Studio (in whatever position) this becomes a
 * no-op and the Studio is back in control.
 */
function withSubscribeLink<T extends { href?: string }>(links: T[]): T[] {
  const present = links.some((l) => (l.href ?? '').includes('/buy-tokens/subscribe'))
  return present ? links : [...links, SUBSCRIBE_LINK as unknown as T]
}

const NAV_FALLBACK: NavData = {
  sectionLinks: [
    { label: 'Washes', href: '/#washes' },
    { label: 'How it works', href: '/#how' },
    { label: 'Bays', href: '/#bays' },
    { label: 'Services', href: '/#services' },
    { label: 'Tokens', href: '/#tokens' },
  ],
  pageLinks: [
    { label: 'Roosevelt Rd', href: '/locations/roosevelt-rd' },
    { label: 'Madison St', href: '/locations/madison-st' },
    { label: 'FAQ', href: '/faq' },
    SUBSCRIBE_LINK,
  ],
  paypalUrl: '/buy-tokens',
  buyTokensLabel: 'Buy tokens →',
  phone: '(708) 771-2945',
  phoneHref: 'tel:7087712945',
  email: 'info@spotlessautowash.com',
  hoursLine: 'Open 7am–10pm, every day',
}

export default async function Nav() {
  const data = await sanityFetch<Partial<NavData> & { ribbonText?: string }>(NAV_QUERY)
  const nav: NavData = {
    ...NAV_FALLBACK,
    ...(data ?? {}),
    sectionLinks: data?.sectionLinks ?? NAV_FALLBACK.sectionLinks,
    pageLinks: withSubscribeLink(data?.pageLinks ?? NAV_FALLBACK.pageLinks),
  }
  return <NavClient data={nav} ribbonText={data?.ribbonText || RIBBON_FALLBACK} />
}

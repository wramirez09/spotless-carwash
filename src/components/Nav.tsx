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
  hoursLine
}`

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
  ],
  paypalUrl: 'https://www.paypal.com/ncp/payment/VZ896M2HPTEPC',
  buyTokensLabel: 'Buy tokens →',
  phone: '(708) 771-2945',
  phoneHref: 'tel:7087712945',
  email: 'hello@spotlesscarwash.com',
  hoursLine: 'Open 7am–10pm, every day',
}

export default async function Nav() {
  const data = await sanityFetch<Partial<NavData>>(NAV_QUERY)
  const nav: NavData = {
    ...NAV_FALLBACK,
    ...(data ?? {}),
    sectionLinks: data?.sectionLinks ?? NAV_FALLBACK.sectionLinks,
    pageLinks: data?.pageLinks ?? NAV_FALLBACK.pageLinks,
  }
  return (
    <>
      <NavClient data={nav} />
      <div className="bg-yellow-400 text-blue-700 border-b-[3px] border-blue-700">
        <div className="max-w-[1240px] mx-auto px-5 md:px-7 py-2 text-center text-[12px] sm:text-[13px] font-extrabold tracking-[0.14em] uppercase">
          Since 1994 · Forest Park's car wash for 30 years
        </div>
      </div>
    </>
  )
}

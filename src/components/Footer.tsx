import Link from 'next/link'
import { sanityFetch } from '@/lib/sanityFetch'
import type { ImageWithAlt } from '@/lib/sanityImage'
import SanityImage from './SanityImage'

type Item = { href: string; label: string; external?: boolean }
type Col = { title: string; items: Item[] }

const FOOTER_QUERY = `*[_type == "footer"][0]{
  logo,
  tagline,
  columns[]{ title, items[]{ label, href, external } },
  copyrightLine,
  kicker
}`

type FooterData = {
  logo?: ImageWithAlt | null
  tagline: string
  columns: Col[]
  copyrightLine: string
  kicker: string
}

const FOOTER_FALLBACK: FooterData = {
  tagline:
    'Touchless, brushless, trackless & scratchless automatic carwashes serving Forest Park.',
  columns: [
    {
      title: 'Locations',
      items: [
        { href: '/locations/roosevelt-rd', label: '7343 Roosevelt Rd' },
        { href: '/locations/madison-st', label: '7802 Madison St' },
      ],
    },
    {
      title: 'Site',
      items: [
        { href: '/#washes', label: 'Wash packages' },
        { href: '/#bays', label: 'Bays' },
        { href: '/#tokens', label: 'Wash tokens' },
        { href: '/#how', label: 'How it works' },
        { href: '/faq', label: 'FAQ' },
      ],
    },
    {
      title: 'Contact',
      items: [
        { href: 'tel:7087712945', label: '(708) 771-2945', external: true },
        { href: 'mailto:hello@spotlesscarwash.com', label: 'hello@spotlesscarwash.com', external: true },
        { href: '/faq', label: 'Open 7am–10pm' },
      ],
    },
  ],
  copyrightLine: '© 2026 Spotless Carwash · Forest Park, IL',
  kicker: 'Keep it clean.',
}

export default async function Footer() {
  const data = await sanityFetch<Partial<FooterData>>(FOOTER_QUERY)
  const footer: FooterData = {
    ...FOOTER_FALLBACK,
    ...(data ?? {}),
    columns: data?.columns?.length ? data.columns : FOOTER_FALLBACK.columns,
  }

  return (
    <footer className="bg-blue-700 text-blue-100 pt-16 pb-8">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7">
        <div className="mb-10 pb-8 border-b border-white/10">
          <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-blue-200 mb-3">
            Serving the Forest Park area
          </div>
          <p className="text-blue-100 leading-relaxed text-[15px] max-w-[760px] m-0">
            Spotless Carwash is the touchless &amp; self-serve car wash for{' '}
            <Link href="/locations/roosevelt-rd" className="text-white font-semibold hover:text-yellow-400">
              Forest Park
            </Link>
            , Oak Park, River Forest, Berwyn, Maywood, Cicero, and Oak Park-River Forest
            commuters across western Cook County. Two locations, open 7am–10pm every day since 1994.
          </p>
        </div>
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 mb-12">
          <div>
            <Link href="/" className="inline-block mb-3 leading-none">
              {footer.logo?.asset?._ref ? (
                <SanityImage
                  image={footer.logo}
                  width={240}
                  height={72}
                  className="h-14 w-auto"
                />
              ) : (
                <span className="display italic uppercase text-white text-[22px] leading-none [text-shadow:-0.035em_0.05em_0_#0a2a6b]">
                  <span className="text-[35px]">S</span>POTLESS
                  <div className="pl-[.5em]">CARWASH</div>
                </span>
              )}
            </Link>
            <p className="text-blue-200 text-sm leading-relaxed max-w-[340px] mt-4.5">
              {footer.tagline}
            </p>
          </div>
          {footer.columns.map((c) => (
            <div key={c.title}>
              <h2 className="m-0 mb-4.5 text-[11px] tracking-[0.22em] uppercase font-bold text-blue-200">
                {c.title}
              </h2>
              <ul className="list-none p-0 m-0 flex flex-col gap-1">
                {c.items.map((it) =>
                  it.external ? (
                    <li key={it.label}>
                      <a href={it.href} className="text-sm text-blue-50 hover:text-yellow-400">
                        {it.label}
                      </a>
                    </li>
                  ) : (
                    <li key={it.label}>
                      <Link href={it.href} className="text-sm text-blue-50 hover:text-yellow-400">
                        {it.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center border-t border-white/10 pt-6 text-xs text-blue-200 flex-wrap gap-3">
          <div className="mono">{footer.copyrightLine}</div>
          <div className="flex items-center gap-4 mono">
            <Link href="/privacy" className="hover:text-yellow-400">Privacy</Link>
            <Link href="/terms" className="hover:text-yellow-400">Terms</Link>
            <span>{footer.kicker}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

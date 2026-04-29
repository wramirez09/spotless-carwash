import Link from 'next/link'

type Item = { href: string; label: string; external?: boolean }
type Col = { title: string; items: Item[] }

const cols: Col[] = [
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
]

export default function Footer() {
  return (
    <footer className="bg-blue-700 text-blue-100 pt-16 pb-8">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 mb-12">
          <div>
            <Link href="/" className="logo-mark inline-block mb-3" >
              <span className="display text-white text-[22px]">
                <span className="text-yellow-400">S</span>POTLESS
              </span>
            </Link>
            <p className="text-blue-200 text-sm leading-relaxed max-w-[340px] mt-4.5">
              Touchless, brushless, trackless &amp; scratchless automatic carwashes serving Forest
              Park.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h2 className="m-0 mb-4.5 text-[11px] tracking-[0.22em] uppercase font-bold text-blue-200">
                {c.title}
              </h2>
              <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
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
          <div className="mono">© 2026 Spotless Carwash · Forest Park, IL</div>
          <div className="mono">Keep it clean.</div>
        </div>
      </div>
    </footer>
  )
}

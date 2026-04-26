const links = [
  { href: '#washes', label: 'Washes' },
  { href: '#how', label: 'How it works' },
  { href: '#locations', label: 'Locations' },
  { href: '#bays', label: 'Bays' },
  { href: '#tokens', label: 'Tokens' },
]

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-blue-500 text-white border-b-[3px] border-blue-700">
      <div className="max-w-[1240px] mx-auto flex items-center gap-4 md:gap-6 px-5 md:px-7 py-3.5">
        <div className="logo-mark">
          <span className="display text-white text-[22px]">
            <span className="text-yellow-400">S</span>POTLESS
          </span>
        </div>
        <div className="ml-auto hidden md:flex flex-wrap gap-1.5">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 rounded-full font-semibold text-sm text-blue-100 hover:bg-white/10 hover:text-white transition"
            >
              {l.label}
            </a>
          ))}
        </div>
        <a
          href="#tokens"
          className="bg-yellow-400 text-blue-700 px-4 py-2.5 rounded-full font-extrabold text-sm hover:bg-white transition"
        >
          Buy tokens →
        </a>
      </div>
    </nav>
  )
}

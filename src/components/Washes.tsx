type Pkg = {
  num: string
  name: string
  price: string
  features: { text: string; included: boolean }[]
  featured?: boolean
}

const packages: Pkg[] = [
  {
    num: '01',
    name: 'Basic',
    price: '$8',
    features: [
      { text: 'Pre-soak', included: true },
      { text: 'High-pressure rinse', included: true },
      { text: 'Air cannon dryer', included: false },
      { text: 'Wheel cleaner', included: false },
    ],
  },
  {
    num: '02',
    name: 'Clean',
    price: '$10',
    features: [
      { text: 'Pre-soak & foam', included: true },
      { text: 'High-pressure rinse', included: true },
      { text: 'Air cannon dryer', included: true },
      { text: 'Lustra Shield', included: false },
    ],
  },
  {
    num: '03',
    name: 'Spotless',
    price: '$13',
    featured: true,
    features: [
      { text: 'Undercarriage spray', included: true },
      { text: 'Foaming brush polish', included: true },
      { text: 'Air cannon dryer', included: true },
      { text: 'Spot-free rinse', included: true },
    ],
  },
  {
    num: '04',
    name: 'Showroom',
    price: '$16',
    features: [
      { text: 'Triple-foam wax', included: true },
      { text: 'Lustra Shield seal', included: true },
      { text: 'Hot wax overhead', included: true },
      { text: 'Air cannon dryer', included: true },
    ],
  },
]

function Check({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M5 12l5 5L20 7" />
    </svg>
  )
}

function Card({ pkg }: { pkg: Pkg }) {
  if (pkg.featured) {
    return (
      <article className="bg-blue-500 text-white border border-blue-700 rounded-2xl p-6 flex flex-col gap-3.5 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(27,79,217,.3)] transition">
        <div className="flex items-center justify-between">
          <span className="mono text-xs font-semibold text-blue-100">PKG / {pkg.num}</span>
          <span className="bg-yellow-400 text-blue-700 text-[10px] tracking-[0.16em] font-extrabold px-2.5 py-1 rounded-full uppercase">
            Most picked
          </span>
        </div>
        <h3 className="display text-[32px] m-0">{pkg.name}</h3>
        <div className="display text-[54px] leading-none">
          {pkg.price}
          <small className="text-lg font-bold text-blue-100 not-italic font-sans ml-1">/wash</small>
        </div>
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {pkg.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-blue-100 leading-snug">
              <Check className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              {f.text}
            </li>
          ))}
        </ul>
        <a
          href="#"
          className="mt-auto bg-yellow-400 text-blue-700 text-center py-3 rounded-xl font-bold text-sm border border-yellow-400 hover:bg-white transition"
        >
          Choose {pkg.name}
        </a>
      </article>
    )
  }
  return (
    <article className="hover:lift bg-white border border-line rounded-2xl p-6 flex flex-col gap-3.5 hover:-translate-y-1 hover:border-blue-500 hover:shadow-[0_18px_40px_rgba(27,79,217,.12)] transition">
      <div className="flex items-center justify-between">
        <span className="mono text-xs font-semibold text-[#9aa9c9]">PKG / {pkg.num}</span>
      </div>
      <h3 className="display text-[32px] m-0">{pkg.name}</h3>
      <div className="display text-[54px] leading-none">
        {pkg.price}
        <small className="text-lg font-bold text-[#5b6987] not-italic font-sans ml-1">/wash</small>
      </div>
      <ul className="list-none p-0 m-0 flex flex-col gap-2">
        {pkg.features.map((f, i) =>
          f.included ? (
            <li key={i} className="flex items-start gap-2 text-sm text-[#445273] leading-snug">
              <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              {f.text}
            </li>
          ) : (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-[#aab5cd] leading-snug line-through"
            >
              <Check className="w-4 h-4 text-[#cfd6e6] mt-0.5 shrink-0" />
              {f.text}
            </li>
          ),
        )}
      </ul>
      <a
        href="#"
        className="mt-auto bg-paper text-ink text-center py-3 rounded-xl font-bold text-sm border border-line hover:bg-blue-500 hover:text-white hover:border-blue-500 transition"
      >
        Choose {pkg.name}
      </a>
    </article>
  )
}

export default function Washes() {
  return (
    <section id="washes" className="py-16 md:py-24">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7">
        <div className="flex items-end justify-between gap-10 mb-10 md:mb-12 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2.5">
              <span className="mono text-[#9aa9c9] font-medium">01 /</span> Wash packages
            </div>
            <h2 className="display text-[40px] sm:text-[56px] md:text-[72px] max-w-[780px] m-0">
              Four ways to make your car <em className="text-blue-500 yellow-hl">shine</em>.
            </h2>
          </div>
          <p className="max-w-[380px] text-[#445273] leading-relaxed">
            Top three packages include the air cannon dryers. Just put your money or swipe your
            credit card in the cash station — choose, then wait for green.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((p) => (
            <Card key={p.num} pkg={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

type Service = {
  title: string
  body: string
}

const services: Service[] = [
  {
    title: 'Payments at every bay',
    body:
      'All wash bays take major credit cards, $1s and $5s, and quarters. The automatics also take $10s. Tap and Apple Pay accepted too.',
  },
  {
    title: 'Vending machines',
    body:
      'Fragrance trees, blue sham towels, and Armor All pads available on site — grab what you need before you start.',
  },
  {
    title: 'Vacuums on the lot',
    body: '4 minutes for $1.00. No tokens needed.',
  },
  {
    title: 'Get glossy with LustraShield',
    body: 'LustraShield surface gloss is available in every bay — automatic and self-serve.',
  },
  {
    title: 'Wash hours',
    body: 'Open 7am–10pm, every day.',
  },
  {
    title: 'Attendant hours',
    body:
      'Friendly attendants on duty Monday–Friday 12–5pm. Saturdays, Sundays, and holidays 9–11am and 12–4pm.',
  },
]

export default function OtherServices() {
  return (
    <section id="services" className="py-16 md:py-24 bg-paper">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7">
        <div className="flex items-end justify-between gap-10 mb-10 md:mb-12 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2.5">
              <span className="mono text-[#5b6987] font-medium">07 /</span> Other services
            </div>
            <h2 className="display text-[40px] sm:text-[56px] md:text-[72px] max-w-[780px] m-0">
              Everything you need <em className="text-blue-500 yellow-hl">on site</em>.
            </h2>
          </div>
          <p className="max-w-[380px] text-[#445273] leading-relaxed">
            Vacuums, vending, attendants, and LustraShield in every bay. Pull up with whatever's in
            your pocket — bills, quarters, cards, or your phone.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <article
              key={s.title}
              className="bg-white border border-line rounded-2xl p-6 hover:border-blue-500 hover:shadow-[0_18px_40px_rgba(27,79,217,.08)] transition"
            >
              <h3 className="m-0 mb-2 text-[18px] font-extrabold tracking-tight">{s.title}</h3>
              <p className="m-0 text-[#445273] leading-relaxed text-sm">{s.body}</p>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-[13px] font-bold tracking-[0.18em] uppercase text-[#5b6987]">
          Please help keep Spotless Auto Wash a clean, quiet, and safe place to wash your car.
        </p>
      </div>
    </section>
  )
}

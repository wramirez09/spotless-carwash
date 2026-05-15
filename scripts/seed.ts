/**
 * One-shot seeder: pushes current in-code content into the Sanity dataset.
 *
 * Run with:
 *   SANITY_WRITE_TOKEN=<token> yarn ts-node --project tsconfig.seed.json scripts/seed.ts
 *
 * Or simpler with tsx (already pulled in via Sanity dev deps):
 *   SANITY_WRITE_TOKEN=<token> npx tsx scripts/seed.ts
 *
 * Get a write token: Sanity Manage → API → Tokens → Add API token (Editor or Admin).
 *
 * Each singleton is created with a fixed _id matching its type, so re-runs
 * upsert in place. Multi-doc types (location, washPackage, dialStep, faqEntry)
 * use a deterministic _id derived from a natural key for the same reason.
 */

import { createClient } from '@sanity/client'
import { locations as locationsData } from '../src/data/locations'
import { packages as packagesData } from '../src/data/washes'
import { dialSteps as dialData } from '../src/data/dial'
import { faqs as faqsData } from '../src/data/faq'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const token = process.env.SANITY_WRITE_TOKEN

if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
if (!token) throw new Error('Missing SANITY_WRITE_TOKEN (Sanity Manage → API → Tokens, Editor role)')

const client = createClient({
  projectId,
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

// ---------------------------------------------------------------------------
// Singleton documents
// ---------------------------------------------------------------------------

type SeedDoc = { _id: string; _type: string;[k: string]: unknown }

const singletons: Record<string, SeedDoc> = {
  siteSettings: {
    _id: 'siteSettings',
    _type: 'siteSettings',
    titleDefault: 'Touchless Car Wash in Forest Park, IL | Spotless Carwash',
    titleTemplate: '%s | Spotless Carwash',
    description:
      "Forest Park's touchless car wash. Two locations with heated automatic bays for winter and self-serve wand bays. Open 7am–10pm daily.",
    keywords: [
      'car wash',
      'touchless car wash',
      'self-serve car wash',
      'Forest Park IL',
      'Forest Park car wash',
      'heated car wash',
      'wash tokens',
      'apple pay car wash',
      'tap to pay car wash',
    ],
    ogTitle: 'Spotless Carwash · Touchless Car Wash · Forest Park, IL',
    ogDescription:
      'Two Forest Park locations, heated automatic bays, self-serve wand bays. Open 7am–10pm daily.',
    twitterTitle: 'Spotless Carwash · Touchless Car Wash · Forest Park, IL',
    twitterDescription:
      'Two Forest Park locations, heated automatic bays, self-serve wand bays. Open 7am–10pm daily.',
  },

  navbar: {
    _id: 'navbar',
    _type: 'navbar',
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
    paypalUrl: '/buy-tokens',
    buyTokensLabel: 'Buy tokens →',
    phone: '(708) 771-2945',
    phoneHref: 'tel:7087712945',
    email: 'info@spotlessautowash.com',
    hoursLine: 'Open 7am–10pm, every day',
    ribbonText: "Since 1995 · Forest Park's car wash for 30 years",
  },

  footer: {
    _id: 'footer',
    _type: 'footer',
    tagline:
      'Touchless, brushless, trackless & scratchless automatic carwashes serving Forest Park.',
    columns: [
      {
        title: 'Locations',
        items: [
          { label: '7343 Roosevelt Rd', href: '/locations/roosevelt-rd' },
          { label: '7802 Madison St', href: '/locations/madison-st' },
        ],
      },
      {
        title: 'Site',
        items: [
          { label: 'Wash packages', href: '/#washes' },
          { label: 'Bays', href: '/#bays' },
          { label: 'Wash tokens', href: '/#tokens' },
          { label: 'How it works', href: '/#how' },
          { label: 'FAQ', href: '/faq' },
        ],
      },
      {
        title: 'Contact',
        items: [
          { label: '(708) 771-2945', href: 'tel:7087712945', external: true },
          { label: 'info@spotlessautowash.com', href: 'mailto:info@spotlessautowash.com', external: true },
          { label: 'Open 7am–10pm', href: '/faq' },
        ],
      },
    ],
    copyrightLine: '© 2026 Spotless Carwash · Forest Park, IL',
    kicker: 'Keep it clean.',
  },

  hero: {
    _id: 'hero',
    _type: 'hero',
    eyebrow: 'Forest Park, Illinois · Two locations',
    headlineLine1: 'Spotless',
    headlineLine2: 'Carwash',
    headlineTagline: '— keep it clean.',
    subheadYellow: "Forest Park's touchless car wash. For 30 years.",
    subheadBody:
      'Heated indoor bays. No brushes. Open 7am–10pm, every day since 1995.',
    primaryCta: { label: 'See wash packages', href: '#washes' },
    secondaryCta: { label: 'How it works', href: '#how' },
    tickerItems: [
      'KEEP IT CLEAN',
      'TOUCHLESS AUTO WASH',
      'HEATED INDOOR BAYS AT ROOSEVELT RD',
      'SELF-SERVE WAND BAYS',
      'OPEN 7AM–10PM · SINCE THE 90s',
      'SPOT FREE RINSE',
    ],
    bayCardStatus: 'Bay 02 ready · Roosevelt Rd',
    bayCardHeading: 'Pull up & watch the lights.',
    bayCardBody:
      "Don't enter unless the light is green. Pull forward slowly, let the message guide you.",
    avgWashTime: '4 min 30s',
    paymentLine: 'Visa · MC · Amex · Apple Pay · Cash · Tokens',
  },

  heroLights: {
    _id: 'heroLights',
    _type: 'heroLights',
    redLabel: 'Stop',
    yellowLabel: 'Back up',
    greenLabel: 'Go',
  },

  washesSection: {
    _id: 'washesSection',
    _type: 'washesSection',
    eyebrow: 'Wash packages',
    sectionNumber: '01',
    heading: 'Four ways to make your car **shine**.',
    subhead:
      'Top three packages include the air cannon dryers. Pay at the cash station with Visa, Mastercard, Amex, tap, Apple Pay, cash, or wash tokens — choose, then wait for green.',
  },

  howSection: {
    _id: 'howSection',
    _type: 'howSection',
    eyebrow: 'How it works',
    sectionNumber: '02',
    headlineLine1: 'Watch the lights.',
    headlineLine2: "Don't back up.",
    lede:
      'Our automatic bays run on a simple traffic-light system. Wait for green, pull forward slow, hit the stop signal, and let the timer count down.',
    bayLabel: 'BAY SIGNAL',
    steps: [
      {
        n: '01',
        title: 'Pay at the station',
        description:
          'Tap, card, cash, or token — Apple Pay too. Pick your wash (8, 9, 10, or 12) and confirm.',
      },
      {
        n: '02',
        title: 'Wait for green',
        description: "Don't pull in unless you have a green light. Red & yellow mean wait.",
      },
      {
        n: '03',
        title: 'Pull in & park',
        description:
          'Pull forward slowly. Hit the RED STOP signal, then put your car in park and sit tight.',
      },
      {
        n: '04',
        title: 'Watch the timer',
        description:
          'Check the countdown timer straight ahead. When the door opens and the dryers finish, pull through.',
      },
    ],
  },

  locationsSection: {
    _id: 'locationsSection',
    _type: 'locationsSection',
    eyebrow: 'Locations',
    sectionNumber: '03',
    heading: 'Two locations. Ten bays. All in **Forest Park**.',
    subhead:
      'Both locations open 7am–10pm daily. Roosevelt Rd has heated, enclosed automatic bays for winter — perfect for Forest Park, River Forest, and Oak Park drivers. Madison St serves Forest Park, Oak Park, and Eisenhower commuters from the north.',
  },

  bays: {
    _id: 'bays',
    _type: 'bays',
    eyebrow: 'Two ways to wash',
    sectionNumber: '04',
    heading: 'Sit back, or **do it yourself**.',
    subhead:
      'Hands-free touchless automatic washes, or self-serve bays with foaming brushes when you want to do it yourself.',
    bays: [
      {
        _key: 'bay-automatic',
        _type: 'bayCard',
        kind: 'automatic',
        titleLine1: 'Touchless',
        titleLine2: 'Automatic Bays',
        desc:
          'Drive in, drive out — clean in 4½ minutes. No brushes. No swirl marks. No risk to fresh paint or ceramic coatings. Roosevelt Rd\'s heated indoor bays let you wash year-round, even at -10°.',
        features: ['Heated indoor bays (Roosevelt Rd)', 'Air cannon dryers', '~4½ min wash', 'Brushless & scratchless'],
      },
      {
        _key: 'bay-self-serve',
        _type: 'bayCard',
        kind: 'self-serve',
        titleLine1: 'Self-Serve',
        titleLine2: 'Wand Bays',
        desc:
          'Wash it your way. Nine settings — from engine cleaner to Durashield gloss to spot-free rinse — for $4 every 5 minutes. Full dial walkthrough below.',
        features: ['9 wash settings', 'Spot-free rinse', 'Durashield gloss', 'Foaming brush'],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Reviews (Google Business Profile)
  //
  // TODO(reviews): replace the placeholder quotes below with REAL reviews from
  // your Google Business Profile. To do that, edit the testimonialSection
  // document directly in Sanity Studio (Reviews tab) — paste 4–6 of your
  // best 4★/5★ reviews including reviewer name, date, and rating, and set
  // source: 'google' on each one to enable the "Verified Google review" badge
  // and emit Review schema. Then update aggregateRating + totalReviews to your
  // actual GBP numbers (e.g. 4.6 stars across 142 reviews) and paste your
  // googleProfileUrl. Reviews under 4 stars are filtered out automatically.
  // ---------------------------------------------------------------------------
  testimonialSection: {
    _id: 'testimonialSection',
    _type: 'testimonialSection',
    eyebrow: 'Reviews from Google',
    heading: 'What Forest Park drivers say.',
    // TODO: replace with your real GBP aggregate rating + review count.
    // Leaving these unset means the rating badge + AggregateRating schema
    // will be hidden until you paste real numbers.
    aggregateRating: null,
    totalReviews: null,
    googleProfileUrl: null,
    quotes: [
      {
        text:
          'Pulled in right before close after a Chicago snowstorm. Heated bay, four and a half minutes, drove out spotless. The only place that does it right.',
        attribution: 'Mike R., Forest Park',
        rating: 5,
        // source intentionally unset — these are placeholder quotes, not real
        // Google reviews. Replace with real GBP reviews and set source: 'google'
        // before emitting Review schema.
      },
      {
        text:
          'Self-serve bays have everything you need. The Durashield + spot-free combo is the move. Tokens make the price feel like nothing.',
        attribution: 'Anna T., Oak Park',
        rating: 5,
      },
      {
        text:
          'My salt-covered SUV looked brand new in under five minutes. Touchless and zero scratches — I will not go anywhere else.',
        attribution: 'Dave K., Oak Park',
        rating: 5,
      },
    ],
  },

  instructions: {
    _id: 'instructions',
    _type: 'instructions',
    eyebrow: 'Self-serve dial',
    sectionNumber: '05',
    headlineLine1: 'Nine settings.',
    headlineLine2: 'One **clean** car.',
    tip:
      'Ten premium wash settings at your fingertips — tire & wheel cleaner, low-pressure presoak, high-pressure detergent, foaming brush, high-pressure rinse, clear coat sealant, Durashield surface gloss, spot-free rinse and air shammee dryer.\n\n$4.00 for 5 mins.\n\nFor best results, work top-to-bottom. Let presoak dwell 10–20 seconds before rinsing, and always finish with the spot-free rinse — never Durashield as the last step.',
    priceLabel: '$4 / 5 min',
  },

  otherServices: {
    _id: 'otherServices',
    _type: 'otherServices',
    eyebrow: 'Other services',
    sectionNumber: '06',
    heading: 'Everything else **on the lot**.',
    subhead:
      'Vacuums, vending, attendants on duty, and a few house rules. Wash hours are 7AM–10PM daily — bays are always open, attendants keep set hours.',
    services: [
      {
        code: 'SVC / 01',
        title: 'Payment, your way',
        body:
          'All wash bays take all major credit cards, ones, fives & quarters. The automatics also take tens. Tap and Apple Pay accepted too.',
        chips: ['Credit cards', 'Tap / Apple Pay', '$1 / $5', '$10 (auto only)', 'Quarters'],
      },
      {
        code: 'SVC / 02',
        title: 'Vending machines',
        body:
          'Fragrance trees, blue shammy towels & Armor All pads — stocked on-site whenever you need them.',
        chips: ['Fragrance trees', 'Shammy towels', 'Armor All pads'],
      },
      {
        code: 'SVC / 03',
        title: 'Vacuums on the lot',
        body:
          'High-suction vacuums positioned around both lots. Drop a buck and clean out the cabin while your wax cures.',
        theme: 'blue',
      },
      {
        code: 'SVC / 04',
        title: 'Get glossy with **Durashield**.',
        body:
          'A surface gloss enhancer that beads water and leaves a deep shine. Available in **every bay** — automatic and self-serve. Apply before the spot-free rinse for best results.',
        chips: ['All auto bays', 'All self-serve bays', 'Water-beading shine'],
        featured: true,
        theme: 'wide',
      },
      {
        code: 'SVC / 05',
        title: 'Wash hours',
        body: 'Daily — every day of the week.',
      },
    ],
    attendant: {
      code: 'SVC / 06 — Attendants on duty',
      heading: 'Friendly faces, ready to help.',
      body: 'Attendants on the lot to walk you through bays, swap bills, or just keep things tidy.',
      schedule: [
        { label: 'Mon – Fri', hours: '12PM – 5PM' },
        { label: 'Sat / Sun / Holidays', hours: '9AM – 11AM & 12PM – 4PM' },
      ],
    },
    houseRules: {
      kicker: '// please note',
      body: 'Help keep Spotless a clean, quiet & safe place to wash your car.',
    },
  },

  tokens: {
    _id: 'tokens',
    _type: 'tokens',
    eyebrow: 'Wash tokens',
    sectionNumber: '07',
    headlineLine1: 'Buy a stack.',
    headlineLine2: 'Save up to **$50**.',
    valueLine: 'Each token = one Ultimate wash. Never expires. Works at both locations.',
    description:
      'Prepaid Ultimate wash tokens save you up to 20% per wash. Keep them in your glovebox, skip the cash station — and they make a great Forest Park gift.',
    cta: { label: 'Buy tokens · save up to 20%', href: '/buy-tokens' },
    tiers: [
      { qty: 5, price: '$45 · save $5' },
      { qty: 10, price: '$85 · save $15' },
      { qty: 25, price: '$200 · save $50' },
    ],
  },

  emailSection: {
    _id: 'emailSection',
    _type: 'emailSection',
    headlineLine1: 'Get $5 off',
    headlineLine2: 'your first Ultimate wash.',
    body: 'Subscribe for occasional Forest Park car-care tips, token discounts, seasonal promos, and the occasional free wash.',
    placeholder: 'you@example.com',
    submitLabel: 'Send my $5 code',
    successLabel: 'Code on the way ✓',
  },

  faqPage: {
    _id: 'faqPage',
    _type: 'faqPage',
    eyebrow: 'Frequently asked',
    metaTitle: 'Self-Serve & Touchless Car Wash FAQ · Forest Park IL',
    metaDescription:
      'Answers to common questions about Spotless Carwash in Forest Park, IL — how touchless and self-serve bays work, token pricing, hours, and heated winter bays.',
    heading: 'Questions, **answered**.',
    subhead:
      "Everything you might want to know before you pull up — touchless vs. self-serve, hours, heated bays, tokens, and what to do once you're in the bay.",
  },
}

// ---------------------------------------------------------------------------
// Multi-doc types
// ---------------------------------------------------------------------------

const locationDocs = locationsData.map((l) => ({
  _id: `location-${l.slug}`,
  _type: 'location',
  slug: { _type: 'slug', current: l.slug },
  name: l.name,
  street: l.street,
  city: l.city,
  region: l.region,
  postalCode: l.postalCode,
  phone: l.phone,
  phoneHref: l.phoneHref,
  selfServeBays: l.selfServeBays,
  touchlessBays: l.touchlessBays,
  heated: l.heated,
  gradient: l.gradient,
  metaTitle: `Touchless Car Wash on ${l.name}, Forest Park IL`,
  metaDescription: `Spotless Carwash on ${l.name} in Forest Park, IL. ${l.heated ? 'Heated indoor touchless bays' : 'Touchless automatic bays'
    } and self-serve wand bays. Open 7am–10pm, every day since 1995. ${l.street}.`,
}))

const washPackageDocs = packagesData.map((p, i) => ({
  _id: `washPackage-${p.num}`,
  _type: 'washPackage',
  num: p.num,
  name: p.name,
  price: p.price,
  priceNumber: p.priceNumber,
  color: p.color,
  featured: !!p.featured,
  features: p.features.map((f) => ({ text: f.text, included: f.included })),
  order: i,
}))

const dialStepDocs = dialData.map((s) => ({
  _id: `dialStep-${s.n}`,
  _type: 'dialStep',
  n: s.n,
  title: s.title,
  description: s.description,
}))

const faqEntryDocs = faqsData.map((f, i) => ({
  _id: `faqEntry-${i + 1}`,
  _type: 'faqEntry',
  q: f.q,
  a: f.a,
  order: i,
}))

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

// Sanity requires a unique `_key` on every object inside an array. Walk the
// payload and assign deterministic keys so re-runs produce identical output.
function withKeys<T>(value: T, path = ''): T {
  if (Array.isArray(value)) {
    return value.map((item, i) => {
      const next = withKeys(item, `${path}[${i}]`)
      if (next && typeof next === 'object' && !Array.isArray(next)) {
        const obj = next as Record<string, unknown>
        if (!obj._key) obj._key = `${path.replace(/[^a-zA-Z0-9]+/g, '_') || 'k'}_${i}`
      }
      return next
    }) as unknown as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = withKeys(v, `${path}.${k}`)
    }
    return out as unknown as T
  }
  return value
}

async function main() {
  const all = [
    ...Object.values(singletons),
    ...locationDocs,
    ...washPackageDocs,
    ...dialStepDocs,
    ...faqEntryDocs,
  ].map((doc) => withKeys(doc))

  console.log(`Seeding ${all.length} documents → project ${projectId} / dataset production`)

  let tx = client.transaction()
  for (const doc of all) {
    tx = tx.createOrReplace(doc)
  }
  const result = await tx.commit()
  console.log(`✓ Committed transaction ${result.transactionId}`)
  console.log(`  ${result.results.length} document operations`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

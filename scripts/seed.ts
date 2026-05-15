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
import { seoAuditFallback } from '../src/data/reports/seoAudit'
import { marketingAuditFallback } from '../src/data/reports/marketingAudit'
import { competitorReportFallback } from '../src/data/reports/competitorReport'

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
    avgWashTime: '4 min',
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
    headlineLine1: 'Buy a 4-pack.',
    headlineLine2: 'Save **$5** every wash.',
    valueLine: '4 tokens per pack. Never expires. Works at both locations.',
    description:
      'Prepaid wash tokens save you $5 per 4-pack. Keep them in your glovebox, skip the cash station — and they make a great Forest Park gift.',
    cta: { label: 'Buy tokens', href: '/buy-tokens' },
    tiers: [
      { _key: 'tier-12', _type: 'tokenTier', qty: 12, unitLabel: '/ wash · 4-pack', price: '$43 · save $5' },
      { _key: 'tier-10', _type: 'tokenTier', qty: 10, unitLabel: '/ wash · 4-pack', price: '$35 · save $5' },
      { _key: 'tier-9', _type: 'tokenTier', qty: 9, unitLabel: '/ wash · 4-pack', price: '$31 · save $5' },
      { _key: 'tier-8', _type: 'tokenTier', qty: 8, unitLabel: '/ wash · 4-pack', price: '$27 · save $5' },
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

  buyTokensPage: {
    _id: 'buyTokensPage',
    _type: 'buyTokensPage',
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
  },

  buyTokensSuccessPage: {
    _id: 'buyTokensSuccessPage',
    _type: 'buyTokensSuccessPage',
    metaTitle: 'Payment complete',
    metaDescription: 'Your wash tokens are on the way.',
    ribbonText: 'Payment confirmed · Tokens on the way',
    breadcrumbHome: 'Home',
    breadcrumbBuyTokens: 'Buy tokens',
    breadcrumbCurrent: 'Complete',
    headingPrefix: "You're set on",
    headingHighlight: 'tokens',
    headingSuffix: '.',
    subheadWithEmailTemplate:
      'Thanks, {email}. Your token codes will arrive by email within 1 minute. Save the email or print it — bring it to either Forest Park location to swap for physical tokens at the cash station.',
    subheadWithoutEmail:
      'Thanks. Your token codes will arrive by email within 1 minute. Save the email or print it — bring it to either Forest Park location to swap for physical tokens at the cash station.',
    subheadFallback:
      'Your order is confirmed. Token codes will arrive at the email you used at checkout within 1 minute.',
    nextStepsHeading: 'What happens next',
    nextSteps: [
      { n: '01', body: 'Check your inbox for token codes (look for info@spotlessautowash.com).' },
      { n: '02', body: 'Drive up to any automatic bay at either Forest Park location.' },
      {
        n: '03',
        body:
          'Show your code at the cash station for a physical token, or use the code directly if your bay supports keypad entry.',
      },
    ],
    rooseveltKicker: 'Roosevelt Rd',
    rooseveltAddress: '7343 Roosevelt Rd',
    rooseveltHours: 'Open 24h · automatic bay',
    madisonKicker: 'Madison St',
    madisonAddress: '7802 Madison St',
    madisonHours: '7am–10pm daily',
    locationLinkLabel: 'See location →',
    supportPrefix: "Didn't get the email after 5 minutes? Check spam, then call",
    supportPhoneDisplay: '(708) 771-2945',
    supportSuffix: "and we'll get it resent.",
    receiptHeading: 'Receipt',
    receiptPaidBadge: 'Paid',
    packSingular: 'pack',
    packPlural: 'packs',
    totalLabel: 'Total',
    noLineItemsMessage:
      'Your order is on file. Receipt details are available in the confirmation email Stripe sent.',
    backToHomeLabel: 'Back to home',
  },

  privacyPage: {
    _id: 'privacyPage',
    _type: 'privacyPage',
    metaTitle: 'Privacy Policy',
    metaDescription:
      'How Spotless Carwash collects, uses, and protects information from visitors and customers.',
    kickerCategory: 'LEGAL /',
    kickerLabel: 'Privacy',
    heading: 'Privacy Policy',
    lastUpdatedLabel: 'Last updated:',
    lastUpdatedDate: 'May 2026',
    intro:
      'This privacy policy describes how Spotless Carwash (“we,” “us”) collects and uses information when you visit our website at spotlesscarwash.com or our two locations in Forest Park, IL.',
    sections: [
      {
        heading: 'What we collect',
        paragraphs: [
          {
            text:
              '**Email addresses** when you subscribe to our newsletter. We use this only to send the discounts, seasonal promos, and occasional free wash codes described at signup. You can unsubscribe at any time using the link in any email.',
          },
          {
            text:
              '**Token purchase information** when you buy wash tokens online. Payment is processed by our third-party payment provider (currently PayPal). We do not store your full card or payment account details on this site.',
          },
          {
            text:
              '**Standard analytics** like pages visited and approximate location (country/city), gathered from server logs and any analytics tools we run. We use this only to understand how the site is used and improve it.',
          },
        ],
      },
      {
        heading: "What we don't do",
        paragraphs: [
          {
            text:
              'We do not sell your information to third parties. We do not share your email address with anyone outside our newsletter delivery service. We do not track you across other websites.',
          },
        ],
      },
      {
        heading: 'Cookies',
        paragraphs: [
          {
            text:
              'This site uses standard cookies for session handling and any analytics tools we run. You can disable cookies in your browser settings; the site will still work, though some features may be limited.',
          },
        ],
      },
      {
        heading: 'Your rights',
        paragraphs: [
          {
            text:
              "You can ask us to delete the email address and any other information we hold about you at any time. Email [info@spotlessautowash.com](mailto:info@spotlessautowash.com) and we'll take care of it within a reasonable timeframe.",
          },
        ],
      },
      {
        heading: 'Updates',
        paragraphs: [
          {
            text:
              'We may update this policy from time to time. The “last updated” date at the top will reflect any changes.',
          },
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          {
            text:
              'Questions? Email [info@spotlessautowash.com](mailto:info@spotlessautowash.com) or call [(708) 771-2945](tel:7087712945).',
          },
        ],
      },
    ],
  },

  termsPage: {
    _id: 'termsPage',
    _type: 'termsPage',
    metaTitle: 'Terms of Service',
    metaDescription: 'Terms governing use of the Spotless Carwash website and wash tokens.',
    kickerCategory: 'LEGAL /',
    kickerLabel: 'Terms',
    heading: 'Terms of Service',
    lastUpdatedLabel: 'Last updated:',
    lastUpdatedDate: 'May 2026',
    intro:
      'By using the Spotless Carwash website at spotlesscarwash.com, or by buying or redeeming wash tokens, you agree to these terms.',
    sections: [
      {
        heading: 'Wash tokens',
        paragraphs: [
          {
            text:
              'Spotless wash tokens are prepaid passes for one Ultimate touchless automatic wash each. Tokens never expire and work at both Forest Park locations (Roosevelt Rd and Madison St).',
          },
          {
            text:
              'Tokens are non-refundable and have no cash value. Lost or stolen tokens cannot be replaced. We reserve the right to refuse damaged or counterfeit tokens.',
          },
        ],
      },
      {
        heading: 'Use of the bays',
        paragraphs: [
          {
            text:
              'Customers use our automatic and self-serve bays at their own risk. Please follow posted signage, traffic-light signals, and any instructions from on-site attendants. Pull in only on a green light. We are not responsible for damage caused by failure to follow instructions, ignoring stop signals, or driving with loose roof cargo, antennas, or attachments.',
          },
        ],
      },
      {
        heading: 'Damage claims',
        paragraphs: [
          {
            text:
              'If you believe your vehicle was damaged at one of our facilities, please notify the on-duty attendant immediately, before leaving the lot, so we can document the situation. Claims raised after leaving the lot are difficult to verify and may not be honored.',
          },
        ],
      },
      {
        heading: 'Hours and availability',
        paragraphs: [
          {
            text:
              'Bays are open 7am–10pm daily but may close temporarily for maintenance, weather, or repairs. We do our best to post any closures on-site and on social media.',
          },
        ],
      },
      {
        heading: 'Website content',
        paragraphs: [
          {
            text:
              'Pricing, packages, and other website information are subject to change. We try to keep everything current but the on-site posted pricing at the wash is the authoritative source.',
          },
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          {
            text:
              'Questions about these terms? Email [info@spotlessautowash.com](mailto:info@spotlessautowash.com) or call [(708) 771-2945](tel:7087712945).',
          },
        ],
      },
    ],
  },

  seoAuditPage: {
    _id: 'seoAuditPage',
    _type: 'seoAuditPage',
    ...seoAuditFallback,
  },

  marketingAuditPage: {
    _id: 'marketingAuditPage',
    _type: 'marketingAuditPage',
    ...marketingAuditFallback,
  },

  competitorReportPage: {
    _id: 'competitorReportPage',
    _type: 'competitorReportPage',
    ...competitorReportFallback,
  },
}

// ---------------------------------------------------------------------------
// Multi-doc types
// ---------------------------------------------------------------------------

// Per-location copy currently rendered on the location page templates. These
// mirror the hardcoded fallbacks in app/locations/<slug>/page.tsx — keep both
// in sync if you change copy.
const locationPageCopy: Record<
  'roosevelt-rd' | 'madison-st',
  {
    heroSection: Record<string, string>
    findUsSection: {
      eyebrowPrefix: string
      headingPrefix: string
      headingHighlight: string
      headingSuffix: string
      sideParagraph: string
      addressLabel: string
      hoursLabel: string
      hoursPrimary: string
      hoursDetail: string
      gettingHereLabel: string
      gettingHereBullets: string[]
      directionsLabel: string
      callLabel: string
    }
    aboutSection: {
      eyebrowPrefix: string
      headingBefore: string
      headingHighlight: string
      headingAfter: string
      paragraphs: string[]
    }
  }
> = {
  'roosevelt-rd': {
    heroSection: {
      eyebrow: 'Spotless Carwash · Forest Park, IL · Open 7am–10pm',
      headlineSuffix: 'on Roosevelt Rd',
      introParagraph:
        'Touchless automatic bays and self-serve wand bays. Open 7am–10pm, every day.',
      addressLabel: 'Address',
      phoneLabel: 'Phone · Hours',
      hoursLine: 'Open 7am–10pm, every day',
      directionsLabel: 'Get directions',
      washesLabel: 'See wash packages',
      photoBadgeKicker: 'Keep it clean',
      photoBadgeText: 'Touchless automatic wash.',
    },
    findUsSection: {
      eyebrowPrefix: 'FIND US /',
      headingPrefix: 'Right here on',
      headingHighlight: 'Roosevelt Rd',
      headingSuffix: '.',
      sideParagraph:
        'On Roosevelt Road just east of Harlem Avenue. Heated indoor bays - you can wash year-round.',
      addressLabel: 'Address',
      hoursLabel: 'Hours',
      hoursPrimary: '7am–10pm, every day',
      hoursDetail:
        'Bays open all hours. Attendants Mon–Fri, 9am -11am & 12pm–5pm, Sat/Sun 9–11am & 12–4pm.',
      gettingHereLabel: 'Getting here',
      gettingHereBullets: [
        'Just east of Harlem Avenue',
        'Quick from Oak Park, River Forest & Berwyn',
        'Heated indoor bays · vacuums on site',
      ],
      directionsLabel: 'Get directions',
      callLabel: 'Call',
    },
    aboutSection: {
      eyebrowPrefix: 'ABOUT /',
      headingBefore: 'The car wash South Forest Park has trusted',
      headingHighlight: 'since 1995',
      headingAfter: '.',
      paragraphs: [
        'Spotless Carwash on Roosevelt Road has been washing cars in Forest Park for over 30 years. We sit on Roosevelt just east of Harlem Avenue — a quick stop for drivers from Forest Park, Oak Park, River Forest, Berwyn, Cicero, and Maywood.',
        'Roosevelt Rd is our heated location: the touchless automatic bays here are fully enclosed and warmed, so your car gets washed and air-dried indoors even on the worst Chicago winter days. No frozen door handles, no ice on the dryer, no waiting for a thaw to wash off road salt.',
        'The lot has 2 touchless automatic bays and 3 self-serve wand bays — so whether you want to drive in and let the machine do the work, or wash the engine bay and wheels yourself with a wand, we have the right bay open. Pay-stations accept all major cards, tap, Apple Pay, cash, and prepaid Spotless wash tokens. Vacuums and vending are on the lot.',
        'Bays are open 7am–10pm, every day. Attendants are on site Monday through Friday from 9am - 11am and noon to 5pm, and weekends & holidays from 9–11am and noon–4pm — they can help with tokens, change, and any equipment questions. Closer to north Forest Park? See our Madison St location.',
      ],
    },
  },
  'madison-st': {
    heroSection: {
      eyebrow: 'Spotless Carwash · Forest Park, IL · Open 7am–10pm',
      headlineSuffix: 'on Madison St',
      introParagraph:
        'Touchless automatic bays and self-serve wand bays. Open 7am–10pm, every day.',
      addressLabel: 'Address',
      phoneLabel: 'Phone · Hours',
      hoursLine: 'Open 7am–10pm, every day',
      directionsLabel: 'Get directions',
      washesLabel: 'See wash packages',
      photoBadgeKicker: 'Keep it clean',
      photoBadgeText: 'Self-serve & touchless wash.',
    },
    findUsSection: {
      eyebrowPrefix: 'FIND US /',
      headingPrefix: 'Right here on',
      headingHighlight: 'Madison St',
      headingSuffix: '.',
      sideParagraph:
        'On Madison Street just west of Jacksom blvd., Concordia Cemetery and the Forest Park Public Library are right nearby.',
      addressLabel: 'Address',
      hoursLabel: 'Hours',
      hoursPrimary: '7am–10pm, every day',
      hoursDetail:
        'Bays open all hours. Attendants Mon–Fri, 9am -11am & 12pm–5pm, Sat/Sun 9–11am & 12–4pm.',
      gettingHereLabel: 'Getting here',
      gettingHereBullets: [
        'Easy from Oak Park & River Forest',
        'Quick Eisenhower (I-290) access',
        'Surface lot · vacuums on site',
      ],
      directionsLabel: 'Get directions',
      callLabel: 'Call',
    },
    aboutSection: {
      eyebrowPrefix: 'ABOUT /',
      headingBefore: 'The neighborhood car wash on',
      headingHighlight: 'Madison Street',
      headingAfter: '.',
      paragraphs: [
        'Spotless Carwash on Madison Street has been part of Forest Park for over 30 years. We sit on Madison just west of Jackson blvd. easy reach for drivers from Forest Park, Oak Park, River Forest, and Berwyn, with quick Eisenhower (I-290) access just to the north. Concordia Cemetery and the Forest Park Public Library are right around the corner.',
        'Madison St is our open-fronted location — the touchless automatic bays are brushless and scratchless, with high-pressure water, soap, and air cannon dryers handling the wash from start to finish. No spinning brushes, no fabric, no risk to fresh paint, ceramic coatings, or wraps.',
        'The lot has 2 touchless automatic bays and 3 self-serve wand bays with nine wash settings — engine cleaner through spot-free rinse — for $4 every 5 minutes. Pay-stations accept all major cards, tap, Apple Pay, cash, and prepaid Spotless wash tokens. Vacuums and vending are on the lot.',
        'Bays are open 7am–10pm, every day. Attendants are on site Monday through Friday from 9am - 11am and noon to 5pm, and weekends & holidays from 9–11am and noon–4pm — they can help with tokens, change, and any equipment questions. Looking for heated indoor bays for winter? Head to our Roosevelt Rd location.',
      ],
    },
  },
}

const locationDocs = locationsData.map((l) => {
  const copy = locationPageCopy[l.slug]
  return {
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
    heroSection: copy.heroSection,
    findUsSection: copy.findUsSection,
    aboutSection: {
      eyebrowPrefix: copy.aboutSection.eyebrowPrefix,
      headingBefore: copy.aboutSection.headingBefore,
      headingHighlight: copy.aboutSection.headingHighlight,
      headingAfter: copy.aboutSection.headingAfter,
      paragraphs: copy.aboutSection.paragraphs.map((text, i) => ({
        _type: 'paragraph',
        _key: `p-${i}`,
        text,
      })),
    },
  }
})

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

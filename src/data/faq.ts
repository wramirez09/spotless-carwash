export type FAQ = { q: string; a: string }

// Token prices are NOT written here. Answers name them with placeholders
// ({packPrices}, {discount}, …) that are filled from Stripe at render time —
// see lib/pricingCopy.ts — so an admin price change can't leave the FAQ
// quoting last month's numbers.

export const faqs: FAQ[] = [
  {
    q: 'How does a touchless car wash work?',
    a: 'A touchless automatic wash uses high-pressure water and chemical pre-soaks to lift dirt off your car — no brushes, cloth strips, or rotating tracts ever touch the paint. You drive in, line up on the green light, put it in park, and the system pre-soaks, soaps, rinses, and air-dries your car in about 4 minutes 30 seconds.',
  },
  {
    q: 'How do I use a self-serve car wash bay?',
    a: 'Pull in and pay at the meter ($4.00 for 5 minutes — cash, card, tap, or Apple Pay), then dial through the nine settings: tire & wheel cleaner, low-pressure presoak, high-pressure detergent, foaming brush, high-pressure rinse, clear coat sealant, Durashield, and spot-free rinse. Always work top-down, let the presoak dwell 10–20 seconds, and finish on spot-free rinse — never Durashield as the last step.',
  },
  {
    q: 'Are car wash tokens worth it?',
    a: 'Yes. Wash tokens offer added value and convenience for frequent customers. There is a token for each of our washes — {washPrices} — and every pack of four comes with {discount} off. Tokens never expire and can be used at either Forest Park location.',
  },
  {
    q: 'What does a wash token cost?',
    a: 'Wash tokens are sold in packs: {packPrices}. Prices include the {discount} pack discount, applied automatically at checkout. Each token is good for the wash of the same value — {washPrices}.',
  },
  {
    q: 'What are your hours?',
    a: 'Both Spotless Carwash locations in Forest Park are open 7am–10pm, every day. The automatic and self-serve bays are card-and-cash operated at the bay — Visa, Mastercard, Amex, tap, Apple Pay, cash, and wash tokens accepted.',
  },
  {
    q: 'Are your bays heated in winter?',
    a: 'The Roosevelt Road location has heated, enclosed automatic bays for winter washing — your car is washed and air-dried inside the bay so doors and locks don\'t freeze on the way out. The Madison Street location has open-fronted bays.',
  },
  {
    q: 'Where are you located in Forest Park?',
    a: 'Spotless Carwash has two locations in Forest Park, IL: 7343 Roosevelt Road and 7802 Madison Street. Both sites have automatic touchless bays and self-serve wand bays, and both are open 7am–10pm daily.',
  },
  {
    q: 'Do tokens expire?',
    a: 'No. Spotless wash tokens never expire and are not site-restricted — buy them once, use them whenever, at either Forest Park location.',
  },
]

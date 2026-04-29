import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'hero',
  title: 'Hero',
  type: 'document',
  fields: [
    defineField({ name: 'eyebrow', type: 'string', description: 'Pre-headline tag, e.g. "Forest Park, Illinois · Two locations · Since the 90s"' }),
    defineField({ name: 'headlineLine1', type: 'string' }),
    defineField({ name: 'headlineLine2', type: 'string' }),
    defineField({ name: 'headlineTagline', type: 'string', description: 'Italic kicker beneath the wordmark' }),
    defineField({ name: 'subheadYellow', type: 'string', description: 'Yellow primary subhead' }),
    defineField({ name: 'subheadBody', type: 'text', rows: 3 }),
    defineField({ name: 'primaryCta', type: 'ctaLink' }),
    defineField({ name: 'secondaryCta', type: 'ctaLink' }),
    defineField({
      name: 'tickerItems',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'bayCardStatus', type: 'string', description: 'e.g. "Bay 02 ready · Roosevelt Rd"' }),
    defineField({ name: 'bayCardHeading', type: 'string' }),
    defineField({ name: 'bayCardBody', type: 'text', rows: 2 }),
    defineField({ name: 'avgWashTime', type: 'string', description: 'e.g. "4 min 30s"' }),
    defineField({ name: 'paymentLine', type: 'string', description: 'e.g. "Visa · MC · Amex · Apple Pay · Cash · Tokens"' }),
  ],
})

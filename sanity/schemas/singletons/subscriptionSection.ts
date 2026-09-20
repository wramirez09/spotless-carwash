import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'subscriptionSection',
  title: 'Subscription — section',
  type: 'document',
  preview: { prepare: () => ({ title: 'Subscription — section' }) },
  description:
    'The wash-club feature block on the home page. Plan names and prices come from Stripe, not from here.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({
      name: 'sectionNumber',
      type: 'string',
      description: 'Two-digit marker shown before the eyebrow, e.g. "08".',
    }),
    defineField({ name: 'headlineLine1', type: 'string' }),
    defineField({
      name: 'headlineLine2',
      type: 'string',
      description: 'Wrap words in **double asterisks** to accent them.',
    }),
    defineField({ name: 'valueLine', type: 'string' }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
    defineField({ name: 'cta', type: 'ctaLink' }),
    defineField({
      name: 'perMonthSuffix',
      type: 'string',
      description: 'After the monthly price, e.g. "/ mo".',
    }),
    defineField({
      name: 'perWashSuffix',
      type: 'string',
      description: 'After the per-token figure, e.g. "per wash".',
    }),
    defineField({ name: 'tokensSuffix', type: 'string' }),
    defineField({ name: 'mostPopularLabel', type: 'string' }),
    defineField({
      name: 'footnote',
      type: 'text',
      rows: 2,
      description: 'Small print under the plans — which wash tier the prices assume.',
    }),
  ],
})

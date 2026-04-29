import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'locationsSection',
  title: 'Locations — section copy',
  type: 'document',
  preview: { prepare: () => ({ title: 'Locations — section copy' }) },
  fields: [
    defineField({ name: 'eyebrow', type: 'string', initialValue: 'Locations' }),
    defineField({ name: 'sectionNumber', type: 'string', initialValue: '03' }),
    defineField({ name: 'heading', type: 'text', rows: 2 }),
    defineField({ name: 'subhead', type: 'text', rows: 3 }),
    defineField({
      name: 'heatedHeroBlurb',
      type: 'text',
      rows: 3,
      description: 'Lead paragraph on heated location pages when the location has no pageDescription set.',
    }),
    defineField({
      name: 'unheatedHeroBlurb',
      type: 'text',
      rows: 3,
      description: 'Lead paragraph on non-heated location pages when the location has no pageDescription set.',
    }),
    defineField({
      name: 'touchlessBlurb',
      type: 'text',
      rows: 3,
      description: 'Description under the touchless-bay stat on location detail pages.',
    }),
    defineField({
      name: 'selfServeBlurb',
      type: 'text',
      rows: 3,
      description: 'Description under the self-serve-bay stat on location detail pages.',
    }),
    defineField({
      name: 'paymentBlurb',
      type: 'text',
      rows: 3,
      description: 'Description under the daily-hours stat on location detail pages.',
    }),
    defineField({
      name: 'addressIntroTemplate',
      type: 'text',
      rows: 3,
      description: 'Paragraph below the stat cards on location detail pages. Use {address} placeholder for the linked full address.',
    }),
    defineField({
      name: 'winterBlurb',
      type: 'text',
      rows: 3,
      description: 'Trailing winter sentence appended on heated location detail pages.',
    }),
  ],
})

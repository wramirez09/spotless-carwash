import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'instructions',
  title: 'Self-serve instructions',
  type: 'document',
  fields: [
    defineField({ name: 'eyebrow', type: 'string', initialValue: 'Self-serve dial' }),
    defineField({ name: 'sectionNumber', type: 'string', initialValue: '05' }),
    defineField({ name: 'headlineLine1', type: 'string' }),
    defineField({ name: 'headlineLine2', type: 'string' }),
    defineField({ name: 'tip', type: 'text', rows: 4 }),
    defineField({ name: 'priceLabel', type: 'string', description: 'e.g. "$4 / 5 min"' }),
  ],
})

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'faqPage',
  title: 'FAQ page',
  type: 'document',
  preview: { prepare: () => ({ title: 'FAQ page' }) },
  fields: [
    defineField({ name: 'eyebrow', type: 'string', initialValue: 'Frequently asked' }),
    defineField({ name: 'metaTitle', type: 'string' }),
    defineField({ name: 'metaDescription', type: 'text', rows: 3 }),
    defineField({ name: 'heading', type: 'text', rows: 2 }),
    defineField({ name: 'subhead', type: 'text', rows: 4 }),
  ],
})

import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'tokens',
  title: 'Wash tokens',
  type: 'document',
  preview: { prepare: () => ({ title: 'Wash tokens' }) },
  fields: [
    defineField({ name: 'eyebrow', type: 'string', initialValue: 'Wash tokens' }),
    defineField({ name: 'sectionNumber', type: 'string', initialValue: '07' }),
    defineField({ name: 'headlineLine1', type: 'string' }),
    defineField({ name: 'headlineLine2', type: 'string' }),
    defineField({ name: 'valueLine', type: 'text', rows: 2, description: 'Yellow line — e.g. "Each token = one Ultimate wash ($10 value)..."' }),
    defineField({ name: 'description', type: 'text', rows: 4 }),
    defineField({ name: 'cta', type: 'ctaLink' }),
    defineField({
      name: 'tiers',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tokenTier',
          fields: [
            defineField({ name: 'qty', type: 'number', validation: (r) => r.required() }),
            defineField({ name: 'price', type: 'string', description: 'e.g. "$85 · save $5"' }),
          ],
        }),
      ],
    }),
  ],
})

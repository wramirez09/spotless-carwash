import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'howSection',
  title: 'How it works',
  type: 'document',
  preview: { prepare: () => ({ title: 'How it works' }) },
  fields: [
    defineField({ name: 'eyebrow', type: 'string', initialValue: 'How it works' }),
    defineField({ name: 'sectionNumber', type: 'string', initialValue: '02' }),
    defineField({ name: 'headlineLine1', type: 'string' }),
    defineField({ name: 'headlineLine2', type: 'string' }),
    defineField({ name: 'lede', type: 'text', rows: 3 }),
    defineField({
      name: 'steps',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'howStep',
          fields: [
            defineField({ name: 'n', type: 'string', description: 'e.g. "01"' }),
            defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'description', type: 'text', rows: 2 }),
          ],
        }),
      ],
    }),
    defineField({ name: 'bayLabel', type: 'string', initialValue: 'BAY SIGNAL' }),
  ],
})

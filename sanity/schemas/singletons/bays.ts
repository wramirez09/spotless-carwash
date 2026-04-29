import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'bays',
  title: 'Bays section',
  type: 'document',
  fields: [
    defineField({ name: 'eyebrow', type: 'string', initialValue: 'Two ways to wash' }),
    defineField({ name: 'sectionNumber', type: 'string', initialValue: '04' }),
    defineField({ name: 'heading', type: 'text', rows: 2 }),
    defineField({ name: 'subhead', type: 'text', rows: 3 }),
    defineField({
      name: 'bays',
      title: 'Bay cards',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'bayCard',
          fields: [
            defineField({ name: 'titleLine1', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'titleLine2', type: 'string' }),
            defineField({ name: 'desc', type: 'text', rows: 4 }),
            defineField({
              name: 'features',
              type: 'array',
              of: [{ type: 'string' }],
              options: { layout: 'tags' },
            }),
            defineField({ name: 'photo', type: 'imageWithAlt' }),
          ],
        }),
      ],
    }),
  ],
})

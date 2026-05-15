import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'termsPage',
  title: 'Terms page',
  type: 'document',
  preview: { prepare: () => ({ title: 'Terms page' }) },
  fields: [
    defineField({ name: 'metaTitle', type: 'string' }),
    defineField({ name: 'metaDescription', type: 'text', rows: 3 }),
    defineField({ name: 'kickerCategory', type: 'string', initialValue: 'LEGAL /' }),
    defineField({ name: 'kickerLabel', type: 'string', initialValue: 'Terms' }),
    defineField({ name: 'heading', type: 'string', initialValue: 'Terms of Service' }),
    defineField({ name: 'lastUpdatedLabel', type: 'string', initialValue: 'Last updated:' }),
    defineField({ name: 'lastUpdatedDate', type: 'string', initialValue: 'May 2026' }),
    defineField({ name: 'intro', type: 'text', rows: 4 }),
    defineField({
      name: 'sections',
      type: 'array',
      description: 'Each section is a heading + one or more paragraphs.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'section',
          fields: [
            defineField({ name: 'heading', type: 'string', validation: (r) => r.required() }),
            defineField({
              name: 'paragraphs',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'paragraph',
                  fields: [defineField({ name: 'text', type: 'text', rows: 4 })],
                  preview: {
                    select: { title: 'text' },
                    prepare: ({ title }) => ({ title: (title as string | undefined)?.slice(0, 80) ?? 'Paragraph' }),
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
})

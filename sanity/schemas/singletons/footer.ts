import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'footer',
  title: 'Footer',
  type: 'document',
  fields: [
    defineField({ name: 'tagline', type: 'text', rows: 3 }),
    defineField({
      name: 'columns',
      title: 'Link columns',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'footerColumn',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
            defineField({
              name: 'items',
              type: 'array',
              of: [{ type: 'ctaLink' }],
            }),
          ],
        }),
      ],
    }),
    defineField({ name: 'copyrightLine', type: 'string' }),
    defineField({ name: 'kicker', type: 'string', description: 'Right-side mono line, e.g. "Keep it clean."' }),
  ],
})

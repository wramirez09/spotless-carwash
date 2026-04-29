import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'testimonialSection',
  title: 'Testimonials',
  type: 'document',
  fields: [
    defineField({
      name: 'quotes',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'quote',
          fields: [
            defineField({ name: 'text', type: 'text', rows: 4, validation: (r) => r.required() }),
            defineField({ name: 'attribution', type: 'string' }),
            defineField({
              name: 'avatar',
              type: 'imageWithAlt',
              description: 'Optional author headshot.',
            }),
            defineField({
              name: 'rating',
              type: 'number',
              description: 'Star rating (1–5). Defaults to 5 when unset.',
              validation: (r) => r.min(1).max(5),
            }),
          ],
        }),
      ],
    }),
  ],
})

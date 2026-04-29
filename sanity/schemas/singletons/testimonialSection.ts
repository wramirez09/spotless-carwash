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
          ],
        }),
      ],
    }),
  ],
})

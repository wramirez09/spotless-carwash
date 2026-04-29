import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'washPackage',
  title: 'Wash package',
  type: 'document',
  fields: [
    defineField({ name: 'num', type: 'string', title: 'Display number', description: 'e.g. "08", "09", "10", "12"', validation: (r) => r.required() }),
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'price', type: 'string', description: 'Display price, e.g. "$9"' }),
    defineField({ name: 'priceNumber', type: 'number' }),
    defineField({
      name: 'color',
      type: 'string',
      options: { list: ['red', 'green', 'purple', 'blue'], layout: 'radio' },
    }),
    defineField({ name: 'featured', type: 'boolean', initialValue: false }),
    defineField({
      name: 'features',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'featureRow',
          fields: [
            defineField({ name: 'text', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'included', type: 'boolean', initialValue: true }),
          ],
        }),
      ],
    }),
    defineField({ name: 'order', type: 'number', description: 'Sort order on the site (low → high)' }),
  ],
  orderings: [
    { name: 'order', title: 'Manual order', by: [{ field: 'order', direction: 'asc' }] },
  ],
})

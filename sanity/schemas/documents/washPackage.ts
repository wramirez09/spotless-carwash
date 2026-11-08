import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'washPackage',
  title: 'Wash package',
  type: 'document',
  fields: [
    defineField({ name: 'num', type: 'string', title: 'Display number', description: 'e.g. "08", "09", "10", "12"', validation: (r) => r.required() }),
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'price',
      type: 'string',
      description:
        'Display price, e.g. "$14". The site shows the Price (number) below formatted, so keep the two the same.',
    }),
    defineField({
      name: 'priceNumber',
      title: 'Price (number)',
      type: 'number',
      description:
        'The price of this wash in whole dollars, e.g. 14. This is the source of truth for token pricing: it is the value of this wash’s token, a single token costs this much, and a pack of N lists at N × this. Publishing a change updates the token prices in Stripe automatically.',
      validation: (r) => r.required().integer().min(1).max(100),
    }),
    defineField({
      name: 'color',
      type: 'string',
      options: { list: ['red', 'green', 'purple', 'blue'], layout: 'radio' },
    }),
    defineField({
      name: 'featured',
      title: 'Most popular (fallback)',
      type: 'boolean',
      initialValue: false,
      description:
        'The home page shows ONE "Most Popular" badge: on the wash whose token pack is marked Most Popular at /admin/pricing. This flag is only used when no pack is marked there.',
    }),
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

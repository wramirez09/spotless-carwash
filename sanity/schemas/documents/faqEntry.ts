import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'faqEntry',
  title: 'FAQ entry',
  type: 'document',
  fields: [
    defineField({ name: 'q', title: 'Question', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'a',
      title: 'Answer',
      type: 'text',
      rows: 5,
      description: "Token prices live in Stripe (set them at /admin/pricing). Don't type a price here — use {discount}, {saleDiscount}, {packPrices}, {singlePrices}, {lowestPackPerWash}, {pack:12}, {pack:12x10} or {single:12}.",
      validation: (r) => r.required(),
    }),
    defineField({ name: 'order', type: 'number', description: 'Sort order (low → high)' }),
  ],
  orderings: [
    { name: 'order', title: 'Manual order', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: { select: { title: 'q' } },
})

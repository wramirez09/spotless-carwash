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
    defineField({
      name: 'headlineLine2',
      type: 'string',
      description:
        'e.g. "Save **{discount}** every pack." Any dollar amount is replaced with the live pack discount from Stripe.',
    }),
    defineField({ name: 'valueLine', type: 'text', rows: 2, description: "Token prices live in Stripe (set them at /admin/pricing). Don't type a price here — use {discount}, {saleDiscount}, {packPrices}, {singlePrices}, {lowestPackPerWash}, {pack:12}, {pack:12x10} or {single:12}." }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 4,
      description:
        'Any dollar amount is replaced with the live pack discount from Stripe. Prefer {discount}.',
    }),
    defineField({ name: 'cta', type: 'ctaLink' }),
    defineField({
      name: 'tiers',
      title: 'Tiers (unused)',
      description:
        'No longer shown on the site — the token pack cards are built from Stripe. Manage packs at /admin/pricing.',
      hidden: true,
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tokenTier',
          fields: [
            defineField({
              name: 'qty',
              type: 'number',
              title: 'Big number',
              description: 'Number shown big on the pill (e.g. 12 → renders as "$12").',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'unitLabel',
              type: 'string',
              description: 'Small label next to the big number, e.g. "/ wash · 4-pack".',
            }),
            defineField({
              name: 'price',
              type: 'string',
              description: 'Pill text on the right, e.g. "$43 · save $5".',
            }),
          ],
        }),
      ],
    }),
  ],
})

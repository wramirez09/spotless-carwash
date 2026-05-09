import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'testimonialSection',
  title: 'Testimonials',
  type: 'document',
  preview: { prepare: () => ({ title: 'Testimonials' }) },
  fields: [
    defineField({
      name: 'eyebrow',
      type: 'string',
      description: 'Small label above the headline (e.g. "Reviews from Google").',
    }),
    defineField({
      name: 'heading',
      type: 'string',
      description: 'Section headline.',
    }),
    defineField({
      name: 'aggregateRating',
      type: 'number',
      description:
        'Real Google star average (e.g. 4.6). Used in AggregateRating schema. Leave blank to hide the rating badge.',
      validation: (r) => r.min(0).max(5),
    }),
    defineField({
      name: 'totalReviews',
      type: 'number',
      description:
        'Total number of Google reviews across both locations. Used in AggregateRating schema.',
      validation: (r) => r.min(0).integer(),
    }),
    defineField({
      name: 'googleProfileUrl',
      type: 'url',
      description:
        '"View all reviews on Google" link target — your live Google Business Profile reviews URL (or a search.google.com/local/reviews?placeid=... URL).',
    }),
    defineField({
      name: 'quotes',
      title: 'Reviews',
      description:
        'Paste high-star (≥4) reviews from your Google Business Profile here. Reviews under 4 stars are filtered out automatically. Reviews with source="google" get the verified Google badge and emit Review schema.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'quote',
          fields: [
            defineField({ name: 'text', type: 'text', rows: 4, validation: (r) => r.required() }),
            defineField({
              name: 'attribution',
              type: 'string',
              description: 'Reviewer name (e.g. "Mike R.")',
            }),
            defineField({
              name: 'date',
              type: 'date',
              description: 'Review date (YYYY-MM-DD). Used in Review schema.',
            }),
            defineField({
              name: 'source',
              type: 'string',
              description:
                'Where this review came from. Use "google" to show the verified Google badge and emit Review schema.',
              options: { list: ['google', 'yelp', 'facebook', 'other'] },
            }),
            defineField({
              name: 'avatar',
              type: 'imageWithAlt',
              description: 'Optional reviewer avatar.',
            }),
            defineField({
              name: 'rating',
              type: 'number',
              description: 'Star rating (1–5). Defaults to 5 when unset. Reviews under 4 are filtered out.',
              validation: (r) => r.min(1).max(5),
            }),
          ],
        }),
      ],
    }),
  ],
})

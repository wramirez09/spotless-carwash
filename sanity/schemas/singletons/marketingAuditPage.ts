import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'marketingAuditPage',
  title: 'Marketing Audit page',
  type: 'document',
  preview: { prepare: () => ({ title: 'Marketing Audit page' }) },
  groups: [
    { name: 'meta', title: 'Meta' },
    { name: 'header', title: 'Header' },
    { name: 'body', title: 'Body' },
    { name: 'footer', title: 'Footer' },
  ],
  fields: [
    defineField({ name: 'metaTitle', type: 'string', group: 'meta' }),
    defineField({
      name: 'metaDescription',
      type: 'text',
      rows: 3,
      group: 'meta',
    }),

    defineField({ name: 'kicker', type: 'string', group: 'header' }),
    defineField({ name: 'headline', type: 'string', group: 'header' }),
    defineField({
      name: 'headerFacts',
      type: 'array',
      group: 'header',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'fact',
          fields: [
            defineField({ name: 'label', type: 'string' }),
            defineField({ name: 'value', type: 'string' }),
          ],
          preview: {
            select: { label: 'label', value: 'value' },
            prepare: ({ label, value }) => ({
              title: label ? `${label} ${value ?? ''}` : value || 'Fact',
            }),
          },
        }),
      ],
      description: 'Key-value rows under the headline (URL, Date, etc.).',
    }),
    defineField({ name: 'scoreLabel', type: 'string', group: 'header' }),

    defineField({
      name: 'sections',
      type: 'array',
      group: 'body',
      of: [defineArrayMember({ type: 'reportSection' })],
    }),

    defineField({ name: 'footerLine', type: 'string', group: 'footer' }),
  ],
})

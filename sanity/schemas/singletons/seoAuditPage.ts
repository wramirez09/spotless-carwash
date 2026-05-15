import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'seoAuditPage',
  title: 'SEO Audit page',
  type: 'document',
  preview: { prepare: () => ({ title: 'SEO Audit page' }) },
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
    defineField({ name: 'siteUrl', type: 'string', group: 'header' }),
    defineField({ name: 'dateLabel', type: 'string', group: 'header' }),
    defineField({ name: 'scoreLabel', type: 'string', group: 'header' }),
    defineField({
      name: 'gradeSummary',
      type: 'reportBlockContent',
      group: 'header',
      description: 'Summary paragraph(s) shown directly under the score.',
    }),
    defineField({
      name: 'headerNote',
      type: 'reportQuote',
      group: 'header',
      description: 'Optional pull-quote / note block under the header.',
    }),

    defineField({
      name: 'sections',
      type: 'array',
      group: 'body',
      of: [defineArrayMember({ type: 'reportSection' })],
    }),

    defineField({ name: 'footerLine', type: 'string', group: 'footer' }),
  ],
})

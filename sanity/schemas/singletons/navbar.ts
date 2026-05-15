import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'navbar',
  title: 'Nav bar',
  type: 'document',
  preview: { prepare: () => ({ title: 'Nav bar' }) },
  fields: [
    defineField({
      name: 'logo',
      type: 'imageWithAlt',
      description: 'Optional logo image. Replaces the typographic wordmark when set.',
    }),
    defineField({
      name: 'sectionLinks',
      title: 'Section links (in-page anchors)',
      type: 'array',
      of: [{ type: 'ctaLink' }],
    }),
    defineField({
      name: 'pageLinks',
      title: 'Page links',
      type: 'array',
      of: [{ type: 'ctaLink' }],
    }),
    defineField({ name: 'paypalUrl', type: 'string', title: 'PayPal token-buy URL' }),
    defineField({ name: 'buyTokensLabel', type: 'string', initialValue: 'Buy tokens →' }),
    defineField({ name: 'phone', type: 'string' }),
    defineField({ name: 'phoneHref', type: 'string' }),
    defineField({ name: 'email', type: 'string' }),
    defineField({ name: 'hoursLine', type: 'string' }),
    defineField({
      name: 'ribbonText',
      title: 'Ribbon text',
      type: 'string',
      description: 'Yellow ribbon text shown directly under the nav bar.',
    }),
  ],
})

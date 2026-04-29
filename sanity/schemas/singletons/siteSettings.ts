import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'titleDefault', type: 'string', title: 'Default <title>' }),
    defineField({ name: 'titleTemplate', type: 'string', title: 'Title template (e.g. "%s · Spotless Carwash")' }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
    defineField({
      name: 'keywords',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({ name: 'ogTitle', type: 'string', title: 'OpenGraph title' }),
    defineField({ name: 'ogDescription', type: 'text', rows: 3, title: 'OpenGraph description' }),
    defineField({ name: 'twitterTitle', type: 'string' }),
    defineField({ name: 'twitterDescription', type: 'text', rows: 3 }),
    defineField({
      name: 'hoursLine',
      type: 'string',
      title: 'Hours line (long)',
      description: 'Long-form hours, e.g. "Open 7am–10pm, every day". Used in nav, footer, location pages.',
    }),
    defineField({
      name: 'hoursShort',
      type: 'string',
      title: 'Hours line (short)',
      description: 'Short-form hours, e.g. "7–10". Used in compact stat cards.',
    }),
  ],
})

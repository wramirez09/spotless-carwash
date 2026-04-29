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
  ],
})

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'location',
  title: 'Location',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'street', type: 'string' }),
    defineField({ name: 'city', type: 'string', initialValue: 'Forest Park' }),
    defineField({ name: 'region', type: 'string', initialValue: 'IL' }),
    defineField({ name: 'postalCode', type: 'string' }),
    defineField({ name: 'phone', type: 'string' }),
    defineField({ name: 'phoneHref', type: 'string' }),
    defineField({ name: 'selfServeBays', type: 'number' }),
    defineField({ name: 'touchlessBays', type: 'number' }),
    defineField({ name: 'heated', type: 'boolean', initialValue: false }),
    defineField({ name: 'gradient', type: 'string', description: 'CSS gradient string used as the page header background' }),
    defineField({ name: 'photo', type: 'imageWithAlt' }),
    defineField({ name: 'metaTitle', type: 'string', description: 'Per-page <title> override' }),
    defineField({ name: 'metaDescription', type: 'text', rows: 3 }),
    defineField({
      name: 'pageDescription',
      type: 'text',
      rows: 4,
      description: 'Lead paragraph in the location page header. Heated locations may use a different paragraph than non-heated.',
    }),
    defineField({ name: 'winterAddon', type: 'text', rows: 3, description: 'Optional winter addendum (heated locations)' }),
  ],
})

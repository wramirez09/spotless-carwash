import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'otherServices',
  title: 'Other services',
  type: 'document',
  fields: [
    defineField({ name: 'eyebrow', type: 'string', initialValue: 'Other services' }),
    defineField({ name: 'sectionNumber', type: 'string', initialValue: '06' }),
    defineField({ name: 'heading', type: 'text', rows: 2 }),
    defineField({ name: 'subhead', type: 'text', rows: 3 }),
    defineField({
      name: 'services',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'serviceCard',
          fields: [
            defineField({ name: 'code', type: 'string', description: 'e.g. "SVC / 01"' }),
            defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'body', type: 'text', rows: 4 }),
            defineField({
              name: 'chips',
              type: 'array',
              of: [{ type: 'string' }],
              options: { layout: 'tags' },
            }),
            defineField({ name: 'featured', type: 'boolean', initialValue: false }),
            defineField({
              name: 'theme',
              type: 'string',
              options: { list: ['default', 'blue', 'wide'], layout: 'radio' },
              initialValue: 'default',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'attendant',
      type: 'object',
      fields: [
        defineField({ name: 'code', type: 'string', initialValue: 'SVC / 06 — Attendants on duty' }),
        defineField({ name: 'heading', type: 'string' }),
        defineField({ name: 'body', type: 'text', rows: 3 }),
        defineField({
          name: 'schedule',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'scheduleRow',
              fields: [
                defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
                defineField({ name: 'hours', type: 'string', validation: (r) => r.required() }),
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'houseRules',
      type: 'object',
      fields: [
        defineField({ name: 'kicker', type: 'string', initialValue: '// please note' }),
        defineField({ name: 'body', type: 'text', rows: 3 }),
      ],
    }),
  ],
})

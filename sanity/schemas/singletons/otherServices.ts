import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'otherServices',
  title: 'Other services',
  type: 'document',
  preview: { prepare: () => ({ title: 'Other services' }) },
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
            defineField({
              name: 'icon',
              type: 'string',
              options: { list: ['payment', 'vending', 'vacuum', 'clock', 'shield'], layout: 'radio' },
              description: 'Icon shown in the top-right of the card.',
            }),
            defineField({
              name: 'priceAmount',
              type: 'string',
              description: 'e.g. "$1". Renders alongside priceUnit on blue-theme cards.',
            }),
            defineField({
              name: 'priceUnit',
              type: 'string',
              description: 'e.g. "/ 4 minutes".',
            }),
            defineField({
              name: 'hoursStart',
              type: 'string',
              description: 'e.g. "7AM". When both hoursStart and hoursEnd are set, the card renders a big start–end display.',
            }),
            defineField({ name: 'hoursEnd', type: 'string', description: 'e.g. "10PM".' }),
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
                defineField({
                  name: 'label',
                  type: 'string',
                  description: 'Day(s) the row covers, e.g. "Mon – Fri" or "Sat / Sun / Holidays".',
                  validation: (r) => r.required(),
                }),
                defineField({
                  name: 'hours',
                  type: 'string',
                  description: 'Times for those day(s), e.g. "12PM – 5PM" or "9AM – 11AM & 12PM – 4PM".',
                  validation: (r) => r.required(),
                }),
              ],
              preview: {
                select: { label: 'label', hours: 'hours' },
                prepare: ({ label, hours }) => ({
                  title: label || '(no label)',
                  subtitle: hours || '(no hours)',
                }),
              },
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

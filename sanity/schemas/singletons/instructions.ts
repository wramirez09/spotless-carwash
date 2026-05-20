import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'instructions',
  title: 'Self-serve instructions',
  type: 'document',
  fields: [
    defineField({ name: 'eyebrow', type: 'string', initialValue: 'Self-serve dial' }),
    defineField({ name: 'sectionNumber', type: 'string', initialValue: '05' }),
    defineField({ name: 'headlineLine1', type: 'string' }),
    defineField({ name: 'headlineLine2', type: 'string' }),
    defineField({ name: 'tip', type: 'text', rows: 4 }),
    defineField({ name: 'priceLabel', type: 'string', description: 'e.g. "$4 / 5 min"' }),
    defineField({
      name: 'dialRows',
      title: 'Dial chart rows',
      description:
        'The 10 colored arrow-rows shown to the right of the headline. Drag to reorder. Leave empty to keep the built-in default.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'dialRow',
          fields: [
            defineField({
              name: 'label',
              type: 'string',
              description: 'Setting name, e.g. "Tire & Wheel Cleaner".',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'spectrumPrefix',
              type: 'boolean',
              description: 'Prepend the "Spectrum®" mark in front of the label.',
              initialValue: false,
            }),
            defineField({
              name: 'instructionLine1',
              type: 'string',
              description: 'First line of the instruction, e.g. "Apply to entire vehicle".',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'instructionLine2',
              type: 'string',
              description: 'Optional second line. Rendered bold — used for "Spot free rinse." callouts.',
            }),
            defineField({
              name: 'bgColor',
              type: 'string',
              description: 'Arrow background color (hex, e.g. "#e6157a"). Ignored when variant is set.',
              initialValue: '#1B4FD9',
            }),
            defineField({
              name: 'fgColor',
              type: 'string',
              description: 'Arrow text color (hex, e.g. "#ffffff"). Ignored when variant is set.',
              initialValue: '#ffffff',
            }),
            defineField({
              name: 'variant',
              type: 'string',
              description:
                'Special styling. "lustra" renders the script LustraShield label on a purple gradient. "stop" renders the red STOP badge.',
              options: { list: ['default', 'lustra', 'stop'], layout: 'radio' },
              initialValue: 'default',
            }),
          ],
          preview: {
            select: { label: 'label', line1: 'instructionLine1', variant: 'variant' },
            prepare: ({ label, line1, variant }) => ({
              title: label || '(no label)',
              subtitle: [variant && variant !== 'default' ? `[${variant}]` : null, line1]
                .filter(Boolean)
                .join(' '),
            }),
          },
        }),
      ],
    }),
  ],
})

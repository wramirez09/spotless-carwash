import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * Polymorphic widgets used inside report sections. Each is its own
 * named object type so editors get a labeled "Add item" picker.
 *
 * All inline string fields support the same `**bold**` + `[label](url)`
 * markdown handled by the inline renderer on the page.
 */

export const reportTableRow = defineType({
  name: 'reportTableRow',
  title: 'Table row',
  type: 'object',
  fields: [
    defineField({
      name: 'cells',
      type: 'array',
      of: [{ type: 'string' }],
      description:
        'Cells, left to right. Supports **bold** and [label](url) markdown.',
    }),
  ],
  preview: {
    select: { cells: 'cells' },
    prepare: ({ cells }) => ({
      title: Array.isArray(cells) ? cells.slice(0, 3).join(' · ') : 'Row',
    }),
  },
})

export const reportTable = defineType({
  name: 'reportTable',
  title: 'Table',
  type: 'object',
  fields: [
    defineField({
      name: 'caption',
      type: 'string',
      description: 'Optional caption shown above the table.',
    }),
    defineField({
      name: 'headers',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Column header labels.',
    }),
    defineField({
      name: 'rows',
      type: 'array',
      of: [defineArrayMember({ type: 'reportTableRow' })],
    }),
    defineField({
      name: 'totalRow',
      type: 'array',
      of: [{ type: 'string' }],
      description:
        'Optional bold/total row at the bottom (e.g. summary totals). Leave empty to omit.',
    }),
  ],
  preview: {
    select: { caption: 'caption', headers: 'headers' },
    prepare: ({ caption, headers }) => ({
      title: caption || (Array.isArray(headers) ? headers.join(' · ') : 'Table'),
    }),
  },
})

export const reportList = defineType({
  name: 'reportList',
  title: 'List',
  type: 'object',
  fields: [
    defineField({
      name: 'style',
      type: 'string',
      options: {
        list: [
          { title: 'Bulleted', value: 'bullet' },
          { title: 'Numbered', value: 'number' },
          { title: 'Checklist (unchecked boxes)', value: 'checklist' },
        ],
        layout: 'radio',
      },
      initialValue: 'bullet',
    }),
    defineField({
      name: 'start',
      type: 'number',
      description: 'For numbered lists: starting number (default 1).',
    }),
    defineField({
      name: 'items',
      type: 'array',
      of: [{ type: 'text', rows: 2 }],
      description: 'Each entry supports **bold** and [label](url) markdown.',
    }),
  ],
  preview: {
    select: { style: 'style', items: 'items' },
    prepare: ({ style, items }) => ({
      title: `${style ?? 'bullet'} list (${Array.isArray(items) ? items.length : 0})`,
    }),
  },
})

export const reportCode = defineType({
  name: 'reportCode',
  title: 'Code block',
  type: 'object',
  fields: [
    defineField({ name: 'code', type: 'text', rows: 8 }),
  ],
  preview: {
    select: { code: 'code' },
    prepare: ({ code }) => ({
      title: typeof code === 'string' ? code.split('\n')[0].slice(0, 60) : 'Code',
    }),
  },
})

export const reportQuote = defineType({
  name: 'reportQuote',
  title: 'Block quote',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      type: 'text',
      rows: 4,
      description: 'Supports **bold** and [label](url) markdown.',
    }),
    defineField({
      name: 'emphasis',
      type: 'string',
      options: {
        list: [
          { title: 'Italic', value: 'italic' },
          { title: 'Plain', value: 'plain' },
          { title: 'Bold italic', value: 'boldItalic' },
        ],
        layout: 'radio',
      },
      initialValue: 'italic',
    }),
  ],
})

export const reportProse = defineType({
  name: 'reportProse',
  title: 'Prose paragraph(s)',
  type: 'object',
  fields: [
    defineField({
      name: 'body',
      type: 'reportBlockContent',
    }),
  ],
})

/**
 * A section in a report page: optional kicker + heading, plus an ordered
 * sequence of widgets (prose, tables, lists, code blocks, quotes).
 */
export const reportSection = defineType({
  name: 'reportSection',
  title: 'Section',
  type: 'object',
  fields: [
    defineField({
      name: 'id',
      type: 'string',
      description: 'Optional anchor / dev label. Not rendered.',
    }),
    defineField({ name: 'kicker', type: 'string' }),
    defineField({
      name: 'heading',
      type: 'string',
      description: 'Section heading (renders as h2).',
    }),
    defineField({
      name: 'intro',
      type: 'reportBlockContent',
      description: 'Optional intro paragraph(s) above the widgets.',
    }),
    defineField({
      name: 'widgets',
      title: 'Content blocks',
      type: 'array',
      of: [
        defineArrayMember({ type: 'reportProse' }),
        defineArrayMember({ type: 'reportSubsection' }),
        defineArrayMember({ type: 'reportTable' }),
        defineArrayMember({ type: 'reportList' }),
        defineArrayMember({ type: 'reportCode' }),
        defineArrayMember({ type: 'reportQuote' }),
      ],
    }),
  ],
  preview: {
    select: { heading: 'heading', kicker: 'kicker' },
    prepare: ({ heading, kicker }) => ({
      title: heading || kicker || 'Section',
      subtitle: kicker && heading ? kicker : undefined,
    }),
  },
})

/**
 * A subsection (h3) inside a section, with its own intro + widgets.
 * Lets editors model nested headings without nesting arrays too deeply.
 */
export const reportSubsection = defineType({
  name: 'reportSubsection',
  title: 'Subsection (h3)',
  type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'intro',
      type: 'reportBlockContent',
    }),
    defineField({
      name: 'widgets',
      title: 'Content blocks',
      type: 'array',
      of: [
        defineArrayMember({ type: 'reportProse' }),
        defineArrayMember({ type: 'reportTable' }),
        defineArrayMember({ type: 'reportList' }),
        defineArrayMember({ type: 'reportCode' }),
        defineArrayMember({ type: 'reportQuote' }),
      ],
    }),
  ],
  preview: {
    select: { heading: 'heading' },
    prepare: ({ heading }) => ({ title: heading || 'Subsection' }),
  },
})

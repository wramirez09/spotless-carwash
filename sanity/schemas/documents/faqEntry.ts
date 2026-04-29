import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'faqEntry',
  title: 'FAQ entry',
  type: 'document',
  fields: [
    defineField({ name: 'q', title: 'Question', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'a', title: 'Answer', type: 'text', rows: 5, validation: (r) => r.required() }),
    defineField({ name: 'order', type: 'number', description: 'Sort order (low → high)' }),
  ],
  orderings: [
    { name: 'order', title: 'Manual order', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: { select: { title: 'q' } },
})

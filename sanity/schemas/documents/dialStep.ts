import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'dialStep',
  title: 'Dial step',
  type: 'document',
  fields: [
    defineField({ name: 'n', type: 'number', validation: (r) => r.required().min(1).max(20) }),
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
  ],
  orderings: [
    { name: 'n', title: 'Step number', by: [{ field: 'n', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', subtitle: 'n' },
    prepare: ({ title, subtitle }) => ({ title, subtitle: `Step ${subtitle}` }),
  },
})

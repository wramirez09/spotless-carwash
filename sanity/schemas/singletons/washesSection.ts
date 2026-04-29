import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'washesSection',
  title: 'Washes — section copy',
  type: 'document',
  fields: [
    defineField({ name: 'eyebrow', type: 'string', description: 'e.g. "Wash packages"' }),
    defineField({ name: 'sectionNumber', type: 'string', initialValue: '01' }),
    defineField({ name: 'heading', type: 'text', rows: 2, description: 'May contain emphasis on a single word — kept as plain text and styled in code' }),
    defineField({ name: 'subhead', type: 'text', rows: 3 }),
  ],
})

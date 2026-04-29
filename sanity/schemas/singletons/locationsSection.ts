import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'locationsSection',
  title: 'Locations — section copy',
  type: 'document',
  fields: [
    defineField({ name: 'eyebrow', type: 'string', initialValue: 'Locations' }),
    defineField({ name: 'sectionNumber', type: 'string', initialValue: '03' }),
    defineField({ name: 'heading', type: 'text', rows: 2 }),
    defineField({ name: 'subhead', type: 'text', rows: 3 }),
  ],
})

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'emailSection',
  title: 'Email signup',
  type: 'document',
  preview: { prepare: () => ({ title: 'Email signup' }) },
  fields: [
    defineField({ name: 'headlineLine1', type: 'string' }),
    defineField({ name: 'headlineLine2', type: 'string' }),
    defineField({ name: 'body', type: 'text', rows: 2 }),
    defineField({ name: 'placeholder', type: 'string', initialValue: 'you@example.com' }),
    defineField({ name: 'submitLabel', type: 'string', initialValue: 'Subscribe' }),
    defineField({ name: 'successLabel', type: 'string', initialValue: 'Subscribed ✓' }),
  ],
})

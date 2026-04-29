import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'heroLights',
  title: 'Hero Lights labels',
  type: 'document',
  fields: [
    defineField({ name: 'redLabel', type: 'string', initialValue: 'Stop' }),
    defineField({ name: 'yellowLabel', type: 'string', initialValue: 'Back up' }),
    defineField({ name: 'greenLabel', type: 'string', initialValue: 'Go' }),
  ],
})

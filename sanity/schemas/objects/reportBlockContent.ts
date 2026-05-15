import { defineArrayMember, defineType } from 'sanity'

/**
 * Portable Text block content used by the internal report pages
 * (seo-audit, marketing-audit, competitor-report).
 *
 * Renders normal paragraphs, optional inline-code, bold/italic, links,
 * and bulleted / numbered lists. No images — these pages are text-only.
 */
export default defineType({
  name: 'reportBlockContent',
  title: 'Report body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Quote', value: 'blockquote' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          { title: 'Code', value: 'code' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              { name: 'href', type: 'url', title: 'URL' },
            ],
          },
        ],
      },
    }),
  ],
})

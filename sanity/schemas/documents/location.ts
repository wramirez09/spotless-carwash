import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'location',
  title: 'Location',
  type: 'document',
  groups: [
    { name: 'core', title: 'Core' },
    { name: 'media', title: 'Media' },
    { name: 'seo', title: 'SEO' },
    { name: 'hero', title: 'Page · Hero' },
    { name: 'findUs', title: 'Page · Find Us' },
    { name: 'about', title: 'Page · About' },
  ],
  fields: [
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (r) => r.required(),
      group: 'core',
    }),
    defineField({ name: 'name', type: 'string', validation: (r) => r.required(), group: 'core' }),
    defineField({ name: 'street', type: 'string', group: 'core' }),
    defineField({ name: 'city', type: 'string', initialValue: 'Forest Park', group: 'core' }),
    defineField({ name: 'region', type: 'string', initialValue: 'IL', group: 'core' }),
    defineField({ name: 'postalCode', type: 'string', group: 'core' }),
    defineField({ name: 'phone', type: 'string', group: 'core' }),
    defineField({ name: 'phoneHref', type: 'string', group: 'core' }),
    defineField({ name: 'selfServeBays', type: 'number', group: 'core' }),
    defineField({ name: 'touchlessBays', type: 'number', group: 'core' }),
    defineField({ name: 'heated', type: 'boolean', initialValue: false, group: 'core' }),
    defineField({ name: 'gradient', type: 'string', description: 'CSS gradient string used as the page header background', group: 'core' }),

    defineField({
      name: 'photo',
      type: 'imageWithAlt',
      description: 'Card background in the homepage Locations section.',
      group: 'media',
    }),
    defineField({
      name: 'heroImage',
      type: 'imageWithAlt',
      description: 'Square photo shown in the right column of the location page hero.',
      group: 'media',
    }),
    defineField({
      name: 'touchlessBayPhoto',
      type: 'imageWithAlt',
      description:
        'Override for the touchless bay card on this location page. Defaults to the bays section photo.',
      group: 'media',
    }),
    defineField({
      name: 'selfServeBayPhoto',
      type: 'imageWithAlt',
      description:
        'Override for the self-serve bay card on this location page. Defaults to the bays section photo.',
      group: 'media',
    }),

    defineField({ name: 'metaTitle', type: 'string', description: 'Per-page <title> override', group: 'seo' }),
    defineField({ name: 'metaDescription', type: 'text', rows: 3, group: 'seo' }),
    defineField({
      name: 'pageDescription',
      type: 'text',
      rows: 4,
      description: 'Lead paragraph in the location page header. Heated locations may use a different paragraph than non-heated.',
      group: 'seo',
    }),
    defineField({ name: 'winterAddon', type: 'text', rows: 3, description: 'Optional winter addendum (heated locations)', group: 'seo' }),

    // ----- Hero section copy -----
    defineField({
      name: 'heroSection',
      title: 'Hero section',
      type: 'object',
      group: 'hero',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: 'eyebrow', type: 'string', description: 'Top-of-hero eyebrow line, e.g. "Spotless Carwash · Forest Park, IL · Open 7am–10pm"' }),
        defineField({ name: 'headlineSuffix', type: 'string', description: 'Smaller line under the SPOTLESS CARWASH wordmark, e.g. "on Roosevelt Rd"' }),
        defineField({ name: 'introParagraph', type: 'text', rows: 3, description: 'Paragraph under the headline.' }),
        defineField({ name: 'addressLabel', type: 'string', description: 'Label above the address card. Default: "Address"' }),
        defineField({ name: 'phoneLabel', type: 'string', description: 'Label above the phone card. Default: "Phone · Hours"' }),
        defineField({ name: 'hoursLine', type: 'string', description: 'Hours line in the phone card. Default: "Open 7am–10pm, every day"' }),
        defineField({ name: 'directionsLabel', type: 'string', description: 'Yellow CTA button label. Default: "Get directions"' }),
        defineField({ name: 'washesLabel', type: 'string', description: 'Outlined CTA button label. Default: "See wash packages"' }),
        defineField({ name: 'photoBadgeKicker', type: 'string', description: 'Small uppercase line in the floating photo badge. Default: "Keep it clean"' }),
        defineField({ name: 'photoBadgeText', type: 'string', description: 'Italic line in the floating photo badge.' }),
      ],
    }),

    // ----- Find Us / Map section copy -----
    defineField({
      name: 'findUsSection',
      title: 'Find Us section',
      type: 'object',
      group: 'findUs',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: 'eyebrowPrefix', type: 'string', description: 'Mono prefix in the eyebrow. Default: "FIND US /"' }),
        defineField({ name: 'headingPrefix', type: 'string', description: 'Heading text before the highlighted location name. Default: "Right here on"' }),
        defineField({ name: 'headingHighlight', type: 'string', description: 'Highlighted (yellow) portion of the heading, e.g. "Roosevelt Rd".' }),
        defineField({ name: 'headingSuffix', type: 'string', description: 'Trailing text after the highlight. Default: "."' }),
        defineField({ name: 'sideParagraph', type: 'text', rows: 3, description: 'Short paragraph to the right of the heading.' }),
        defineField({ name: 'addressLabel', type: 'string', description: 'Default: "Address"' }),
        defineField({ name: 'hoursLabel', type: 'string', description: 'Default: "Hours"' }),
        defineField({ name: 'hoursPrimary', type: 'string', description: 'Bold hours line. Default: "7am–10pm, every day"' }),
        defineField({ name: 'hoursDetail', type: 'text', rows: 2, description: 'Attendant hours / additional hours info.' }),
        defineField({ name: 'gettingHereLabel', type: 'string', description: 'Default: "Getting here"' }),
        defineField({
          name: 'gettingHereBullets',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'Three short bullets under "Getting here".',
        }),
        defineField({ name: 'directionsLabel', type: 'string', description: 'Default: "Get directions"' }),
        defineField({ name: 'callLabel', type: 'string', description: 'Default: "Call"' }),
      ],
    }),

    // ----- About section copy -----
    defineField({
      name: 'aboutSection',
      title: 'About section',
      type: 'object',
      group: 'about',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: 'eyebrowPrefix', type: 'string', description: 'Mono prefix. Default: "ABOUT /"' }),
        defineField({ name: 'headingBefore', type: 'string', description: 'Heading text before the highlighted phrase.' }),
        defineField({ name: 'headingHighlight', type: 'string', description: 'Highlighted phrase in the heading, e.g. "since 1995" or "Madison Street".' }),
        defineField({ name: 'headingAfter', type: 'string', description: 'Trailing text after the highlighted phrase. Default: "."' }),
        defineField({
          name: 'paragraphs',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'paragraph',
              fields: [
                defineField({ name: 'text', type: 'text', rows: 4 }),
              ],
              preview: {
                select: { text: 'text' },
                prepare: ({ text }) => ({ title: typeof text === 'string' ? text.slice(0, 80) : 'Paragraph' }),
              },
            },
          ],
          description: 'Body paragraphs. Plain text — no rich formatting. Cross-links to the other location are baked into the page.',
        }),
      ],
    }),
  ],
})

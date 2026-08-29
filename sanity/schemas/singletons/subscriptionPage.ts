import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'subscriptionPage',
  title: 'Token subscription page',
  type: 'document',
  preview: { prepare: () => ({ title: 'Token subscription page' }) },
  groups: [
    { name: 'meta', title: 'Meta' },
    { name: 'header', title: 'Header' },
    { name: 'plans', title: 'Plans' },
    { name: 'details', title: 'Your details' },
    { name: 'how', title: 'How it works' },
    { name: 'summary', title: 'Summary' },
    { name: 'trust', title: 'Trust strip' },
    { name: 'contact', title: 'Contact' },
  ],
  fields: [
    // META
    defineField({ name: 'metaTitle', type: 'string', group: 'meta' }),
    defineField({ name: 'metaDescription', type: 'text', rows: 3, group: 'meta' }),

    // HEADER
    defineField({
      name: 'ribbonText',
      type: 'string',
      group: 'header',
      description: 'Top ribbon, e.g. "Cancel anytime · Powered by Stripe".',
    }),
    defineField({ name: 'breadcrumbHome', type: 'string', group: 'header' }),
    defineField({ name: 'breadcrumbTokens', type: 'string', group: 'header' }),
    defineField({ name: 'breadcrumbCurrent', type: 'string', group: 'header' }),
    defineField({ name: 'headingPrefix', type: 'string', group: 'header' }),
    defineField({
      name: 'headingHighlight',
      type: 'string',
      group: 'header',
      description: 'Rendered in the accent colour.',
    }),
    defineField({ name: 'headingSuffix', type: 'string', group: 'header' }),
    defineField({ name: 'subhead', type: 'text', rows: 3, group: 'header' }),

    // PLANS
    defineField({ name: 'step1Number', type: 'string', group: 'plans' }),
    defineField({ name: 'step1Kicker', type: 'string', group: 'plans' }),
    defineField({ name: 'step1Title', type: 'string', group: 'plans' }),
    defineField({
      name: 'mostPopularLabel',
      type: 'string',
      group: 'plans',
      description: 'Badge on the featured plan.',
    }),
    defineField({
      name: 'perMonthSuffix',
      type: 'string',
      group: 'plans',
      description: 'Shown after the monthly price, e.g. "/ mo".',
    }),
    defineField({
      name: 'perTokenSuffix',
      type: 'string',
      group: 'plans',
      description: 'Shown under the per-token figure, e.g. "per wash".',
    }),
    defineField({ name: 'tokensSuffix', type: 'string', group: 'plans' }),
    defineField({ name: 'washPickerKicker', type: 'string', group: 'plans' }),
    defineField({ name: 'washPickerTitle', type: 'string', group: 'plans' }),
    defineField({
      name: 'washPickerHelp',
      type: 'text',
      rows: 2,
      group: 'plans',
      description: 'Explains that the token is good for one wash at the chosen tier.',
    }),

    // DETAILS
    defineField({ name: 'step2Number', type: 'string', group: 'details' }),
    defineField({ name: 'step2Kicker', type: 'string', group: 'details' }),
    defineField({ name: 'step2Title', type: 'string', group: 'details' }),
    defineField({ name: 'emailLabel', type: 'string', group: 'details' }),
    defineField({ name: 'emailPlaceholder', type: 'string', group: 'details' }),
    defineField({ name: 'emailHelper', type: 'string', group: 'details' }),
    defineField({ name: 'nameLabel', type: 'string', group: 'details' }),
    defineField({ name: 'namePlaceholder', type: 'string', group: 'details' }),
    defineField({ name: 'phoneLabel', type: 'string', group: 'details' }),
    defineField({ name: 'phoneOptionalLabel', type: 'string', group: 'details' }),
    defineField({ name: 'phonePlaceholder', type: 'string', group: 'details' }),
    defineField({ name: 'requiredMark', type: 'string', group: 'details' }),
    defineField({ name: 'mailingListLabel', type: 'string', group: 'details' }),
    defineField({ name: 'addressHeading', type: 'string', group: 'details' }),
    defineField({ name: 'addressLine1Label', type: 'string', group: 'details' }),
    defineField({ name: 'addressLine1Placeholder', type: 'string', group: 'details' }),
    defineField({ name: 'addressLine2Label', type: 'string', group: 'details' }),
    defineField({ name: 'addressLine2Placeholder', type: 'string', group: 'details' }),
    defineField({ name: 'cityLabel', type: 'string', group: 'details' }),
    defineField({ name: 'stateLabel', type: 'string', group: 'details' }),
    defineField({ name: 'postalCodeLabel', type: 'string', group: 'details' }),

    // HOW IT WORKS
    defineField({ name: 'step3Number', type: 'string', group: 'how' }),
    defineField({ name: 'step3Kicker', type: 'string', group: 'how' }),
    defineField({ name: 'step3Title', type: 'string', group: 'how' }),
    defineField({ name: 'deliveryHeading', type: 'string', group: 'how' }),
    defineField({ name: 'deliveryBody', type: 'text', rows: 3, group: 'how' }),
    defineField({
      name: 'deliveryChips',
      type: 'array',
      group: 'how',
      of: [defineArrayMember({ type: 'string' })],
    }),

    // SUMMARY
    defineField({ name: 'summaryHeading', type: 'string', group: 'summary' }),
    defineField({ name: 'summaryBadge', type: 'string', group: 'summary' }),
    defineField({ name: 'billedLabel', type: 'string', group: 'summary' }),
    defineField({ name: 'billedValue', type: 'string', group: 'summary' }),
    defineField({ name: 'totalLabel', type: 'string', group: 'summary' }),
    defineField({ name: 'submitLabel', type: 'string', group: 'summary' }),
    defineField({ name: 'submittingLabel', type: 'string', group: 'summary' }),
    defineField({ name: 'erroredLabel', type: 'string', group: 'summary' }),
    defineField({ name: 'submitDisclaimer', type: 'text', rows: 3, group: 'summary' }),
    defineField({ name: 'checkoutErrorMessage', type: 'string', group: 'summary' }),

    // TRUST
    defineField({
      name: 'trustItems',
      type: 'array',
      group: 'trust',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'line1', type: 'string' }),
            defineField({ name: 'line2', type: 'string' }),
          ],
          preview: {
            select: { title: 'line1', subtitle: 'line2' },
          },
        }),
      ],
    }),

    // CONTACT
    defineField({ name: 'contactPrefix', type: 'string', group: 'contact' }),
    defineField({ name: 'contactConnector', type: 'string', group: 'contact' }),
    defineField({ name: 'contactPhoneDisplay', type: 'string', group: 'contact' }),
    defineField({ name: 'contactEmail', type: 'string', group: 'contact' }),
  ],
})

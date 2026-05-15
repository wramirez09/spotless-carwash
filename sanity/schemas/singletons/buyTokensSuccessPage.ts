import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'buyTokensSuccessPage',
  title: 'Buy tokens — success page',
  type: 'document',
  preview: { prepare: () => ({ title: 'Buy tokens success page' }) },
  groups: [
    { name: 'meta', title: 'Meta' },
    { name: 'header', title: 'Header' },
    { name: 'next', title: 'What happens next' },
    { name: 'locations', title: 'Locations card' },
    { name: 'support', title: 'Support note' },
    { name: 'receipt', title: 'Receipt card' },
  ],
  fields: [
    // META
    defineField({ name: 'metaTitle', type: 'string', group: 'meta' }),
    defineField({ name: 'metaDescription', type: 'text', rows: 2, group: 'meta' }),

    // RIBBON
    defineField({ name: 'ribbonText', type: 'string', group: 'header' }),

    // BREADCRUMB
    defineField({ name: 'breadcrumbHome', type: 'string', group: 'header', initialValue: 'Home' }),
    defineField({ name: 'breadcrumbBuyTokens', type: 'string', group: 'header', initialValue: 'Buy tokens' }),
    defineField({ name: 'breadcrumbCurrent', type: 'string', group: 'header', initialValue: 'Complete' }),

    // HEADING
    defineField({ name: 'headingPrefix', type: 'string', group: 'header' }),
    defineField({ name: 'headingHighlight', type: 'string', group: 'header' }),
    defineField({ name: 'headingSuffix', type: 'string', group: 'header' }),

    // SUBHEAD VARIANTS
    defineField({
      name: 'subheadWithEmailTemplate',
      type: 'text',
      rows: 4,
      group: 'header',
      description:
        'Used when Stripe returns a customer email. Use {email} as the placeholder, e.g. "Thanks, {email}. Your token codes will arrive...".',
    }),
    defineField({
      name: 'subheadWithoutEmail',
      type: 'text',
      rows: 4,
      group: 'header',
      description: 'Used when Stripe returns no email (still success).',
    }),
    defineField({
      name: 'subheadFallback',
      type: 'text',
      rows: 4,
      group: 'header',
      description: 'Used when session is missing or fetch errored.',
    }),

    // NEXT STEPS
    defineField({ name: 'nextStepsHeading', type: 'string', group: 'next' }),
    defineField({
      name: 'nextSteps',
      type: 'array',
      group: 'next',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'nextStep',
          fields: [
            defineField({ name: 'n', type: 'string', description: 'e.g. "01"' }),
            defineField({ name: 'body', type: 'text', rows: 3 }),
          ],
        }),
      ],
    }),

    // LOCATIONS CARD
    defineField({ name: 'rooseveltKicker', type: 'string', group: 'locations', initialValue: 'Roosevelt Rd' }),
    defineField({ name: 'rooseveltAddress', type: 'string', group: 'locations' }),
    defineField({ name: 'rooseveltHours', type: 'string', group: 'locations' }),
    defineField({ name: 'madisonKicker', type: 'string', group: 'locations', initialValue: 'Madison St' }),
    defineField({ name: 'madisonAddress', type: 'string', group: 'locations' }),
    defineField({ name: 'madisonHours', type: 'string', group: 'locations' }),
    defineField({ name: 'locationLinkLabel', type: 'string', group: 'locations', initialValue: 'See location →' }),

    // SUPPORT
    defineField({ name: 'supportPrefix', type: 'string', group: 'support' }),
    defineField({ name: 'supportPhoneDisplay', type: 'string', group: 'support' }),
    defineField({ name: 'supportSuffix', type: 'string', group: 'support' }),

    // RECEIPT
    defineField({ name: 'receiptHeading', type: 'string', group: 'receipt', initialValue: 'Receipt' }),
    defineField({ name: 'receiptPaidBadge', type: 'string', group: 'receipt', initialValue: 'Paid' }),
    defineField({ name: 'packSingular', type: 'string', group: 'receipt', initialValue: 'pack' }),
    defineField({ name: 'packPlural', type: 'string', group: 'receipt', initialValue: 'packs' }),
    defineField({ name: 'totalLabel', type: 'string', group: 'receipt', initialValue: 'Total' }),
    defineField({ name: 'noLineItemsMessage', type: 'text', rows: 3, group: 'receipt' }),
    defineField({ name: 'backToHomeLabel', type: 'string', group: 'receipt', initialValue: 'Back to home' }),
  ],
})

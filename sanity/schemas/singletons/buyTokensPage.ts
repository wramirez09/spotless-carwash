import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'buyTokensPage',
  title: 'Buy tokens page',
  type: 'document',
  preview: { prepare: () => ({ title: 'Buy tokens page' }) },
  groups: [
    { name: 'meta', title: 'Meta' },
    { name: 'header', title: 'Header' },
    { name: 'step1', title: 'Step 1 — packages' },
    { name: 'step2', title: 'Step 2 — details' },
    { name: 'step3', title: 'Step 3 — delivery' },
    { name: 'summary', title: 'Order summary' },
    { name: 'trust', title: 'Trust strip' },
    { name: 'contact', title: 'Contact' },
    { name: 'errors', title: 'Errors' },
  ],
  fields: [
    // META
    defineField({ name: 'metaTitle', type: 'string', group: 'meta' }),
    defineField({ name: 'metaDescription', type: 'text', rows: 3, group: 'meta' }),

    // RIBBON
    defineField({
      name: 'ribbonText',
      type: 'string',
      group: 'header',
      description: 'Yellow top ribbon, e.g. "Secure checkout · Encrypted · Powered by Stripe".',
    }),

    // HEADER
    defineField({ name: 'breadcrumbHome', type: 'string', group: 'header', initialValue: 'Home' }),
    defineField({ name: 'breadcrumbCurrent', type: 'string', group: 'header', initialValue: 'Buy tokens' }),
    defineField({
      name: 'headingPrefix',
      type: 'string',
      group: 'header',
      description: 'Text before the highlighted word, e.g. "Buy wash".',
    }),
    defineField({
      name: 'headingHighlight',
      type: 'string',
      group: 'header',
      description: 'Highlighted (yellow) word, e.g. "tokens".',
    }),
    defineField({
      name: 'headingSuffix',
      type: 'string',
      group: 'header',
      description: 'Text after the highlighted word, e.g. ".".',
    }),
    defineField({ name: 'subhead', type: 'text', rows: 3, group: 'header' }),

    // STEP 1
    defineField({ name: 'step1Number', type: 'string', initialValue: '01', group: 'step1' }),
    defineField({ name: 'step1Kicker', type: 'string', initialValue: 'Step one', group: 'step1' }),
    defineField({ name: 'step1Title', type: 'string', group: 'step1' }),
    defineField({ name: 'mostPopularLabel', type: 'string', initialValue: 'Most Popular', group: 'step1' }),
    defineField({
      name: 'packCodePrefix',
      type: 'string',
      group: 'step1',
      description: 'e.g. "Pack" — rendered as "Pack / 01".',
    }),
    defineField({
      name: 'packTokensSuffix',
      type: 'string',
      group: 'step1',
      description: 'e.g. "wash · 4-pack" (the line under the dollar amount).',
    }),
    defineField({ name: 'savePrefix', type: 'string', group: 'step1', initialValue: 'SAVE' }),
    defineField({ name: 'eachSuffix', type: 'string', group: 'step1', initialValue: 'ea.' }),
    defineField({ name: 'quantityHeading', type: 'string', group: 'step1' }),
    defineField({ name: 'quantitySubtext', type: 'string', group: 'step1' }),
    defineField({ name: 'quantityDecreaseLabel', type: 'string', group: 'step1', initialValue: 'Decrease quantity' }),
    defineField({ name: 'quantityIncreaseLabel', type: 'string', group: 'step1', initialValue: 'Increase quantity' }),
    defineField({ name: 'quantityInputLabel', type: 'string', group: 'step1', initialValue: 'Number of packs' }),

    // STEP 2
    defineField({ name: 'step2Number', type: 'string', initialValue: '02', group: 'step2' }),
    defineField({ name: 'step2Kicker', type: 'string', initialValue: 'Step two', group: 'step2' }),
    defineField({ name: 'step2Title', type: 'string', group: 'step2' }),
    defineField({ name: 'emailLabel', type: 'string', group: 'step2' }),
    defineField({ name: 'emailPlaceholder', type: 'string', group: 'step2' }),
    defineField({ name: 'emailHelper', type: 'string', group: 'step2' }),
    defineField({ name: 'nameLabel', type: 'string', group: 'step2' }),
    defineField({ name: 'namePlaceholder', type: 'string', group: 'step2' }),
    defineField({ name: 'phoneLabel', type: 'string', group: 'step2' }),
    defineField({ name: 'phoneOptionalLabel', type: 'string', group: 'step2', initialValue: '(optional)' }),
    defineField({ name: 'phonePlaceholder', type: 'string', group: 'step2' }),
    defineField({ name: 'requiredMark', type: 'string', group: 'step2', initialValue: '*' }),

    // STEP 3
    defineField({ name: 'step3Number', type: 'string', initialValue: '03', group: 'step3' }),
    defineField({ name: 'step3Kicker', type: 'string', initialValue: 'Step three', group: 'step3' }),
    defineField({ name: 'step3Title', type: 'string', group: 'step3' }),
    defineField({ name: 'deliveryHeading', type: 'string', group: 'step3' }),
    defineField({ name: 'deliveryBody', type: 'text', rows: 3, group: 'step3' }),
    defineField({
      name: 'deliveryChips',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'step3',
      options: { layout: 'tags' },
    }),

    // ORDER SUMMARY
    defineField({ name: 'summaryHeading', type: 'string', initialValue: 'Order summary', group: 'summary' }),
    defineField({ name: 'summaryBadge', type: 'string', initialValue: 'Order', group: 'summary' }),
    defineField({
      name: 'perTokenSuffix',
      type: 'string',
      group: 'summary',
      description: 'e.g. "per token" — used between price and "× N packs".',
    }),
    defineField({ name: 'packSingular', type: 'string', initialValue: 'pack', group: 'summary' }),
    defineField({ name: 'packPlural', type: 'string', initialValue: 'packs', group: 'summary' }),
    defineField({ name: 'savingsLabel', type: 'string', initialValue: 'You save', group: 'summary' }),
    defineField({ name: 'taxLabel', type: 'string', initialValue: 'Tax', group: 'summary' }),
    defineField({ name: 'taxValue', type: 'string', initialValue: 'Calculated at checkout', group: 'summary' }),
    defineField({ name: 'totalLabel', type: 'string', initialValue: 'Total', group: 'summary' }),
    defineField({ name: 'submitLabel', type: 'string', initialValue: 'Pay with Stripe', group: 'summary' }),
    defineField({ name: 'submittingLabel', type: 'string', initialValue: 'Redirecting to Stripe…', group: 'summary' }),
    defineField({ name: 'erroredLabel', type: 'string', initialValue: 'Try again', group: 'summary' }),
    defineField({ name: 'submitDisclaimer', type: 'text', rows: 2, group: 'summary' }),

    // TRUST
    defineField({
      name: 'trustItems',
      type: 'array',
      group: 'trust',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'trustItem',
          fields: [
            defineField({ name: 'line1', type: 'string' }),
            defineField({ name: 'line2', type: 'string' }),
          ],
        }),
      ],
      validation: (r) => r.max(3),
    }),

    // CONTACT
    defineField({ name: 'contactPrefix', type: 'string', group: 'contact', initialValue: 'Questions? Call' }),
    defineField({ name: 'contactConnector', type: 'string', group: 'contact', initialValue: 'or email' }),
    defineField({
      name: 'contactPhoneDisplay',
      type: 'string',
      group: 'contact',
      description: 'Phone number shown as text. Leave the href to locations data.',
    }),
    defineField({ name: 'contactEmail', type: 'string', group: 'contact' }),

    // ERRORS
    defineField({ name: 'checkoutErrorMessage', type: 'text', rows: 2, group: 'errors' }),
  ],
})

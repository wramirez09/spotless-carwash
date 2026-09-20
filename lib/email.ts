import 'server-only'
import { Resend } from 'resend'
import { SPOTLESS_LOGO_BASE64 } from './spotlessLogo'

const LOGO_CID = 'spotless-logo'

// Default owner recipient when OWNER_NOTIFICATION_EMAIL is unset.
const DEFAULT_OWNER_EMAIL = 'joe@spotlessautowash.com'

// Brand palette — mirrors tailwind.config.js so the email matches the site.
const BRAND = {
  navy: '#0A2A6B',
  blue: '#2E6BFF',
  yellow: '#FFD93D',
  ink: '#08183F',
  paper: '#F4F7FB',
  line: '#D7E1F2',
  muted: '#5B6B8C',
  white: '#FFFFFF',
} as const

const TAGLINE = 'Touchless! Brushless! Scratchless! Spotless!'

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://spotlessautowash.com').replace(
    /\/$/,
    '',
  )
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

function getFromAddress(): string {
  // Must be a Resend-verified sender domain in production.
  return process.env.EMAIL_FROM || 'Spotless Car Wash <onboarding@resend.dev>'
}

function getOwnerEmail(): string {
  // Outside Vercel Production (preview + local dev), route notifications to
  // DEV_OWNER_NOTIFICATION_EMAIL so test purchases don't email the real owner.
  // Falls back to the prod recipient, then the hardcoded default.
  if (process.env.VERCEL_ENV !== 'production' && process.env.DEV_OWNER_NOTIFICATION_EMAIL) {
    return process.env.DEV_OWNER_NOTIFICATION_EMAIL
  }
  return process.env.OWNER_NOTIFICATION_EMAIL || DEFAULT_OWNER_EMAIL
}

export type MailingAddress = {
  line1?: string | null
  line2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
}

export type SaleNotification = {
  customerName: string
  customerEmail: string
  customerPhone: string
  address: MailingAddress | null
  mode: string
  washValue: string
  quantity: number
  totalTokens: number
  amountTotal: number | null
  currency: string | null
  codes: string[]
  sessionId: string
}

function formatAddressLines(address: MailingAddress | null): string[] {
  if (!address) return []
  const cityLine = [address.city, address.state].filter(Boolean).join(', ')
  const cityState = [cityLine, address.postalCode].filter(Boolean).join(' ')
  return [address.line1, address.line2, cityState, address.country]
    .map((l) => (l || '').trim())
    .filter(Boolean)
}

function formatAmount(amount: number | null, currency: string | null): string {
  if (amount == null) return '—'
  const code = (currency || 'usd').toUpperCase()
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(
    amount / 100,
  )
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Notify the business owner that a token purchase completed. Best-effort: if
 * Resend is not configured we log and return without throwing so the webhook
 * still returns 200 and Stripe does not retry.
 */
export async function sendOwnerSaleNotification(sale: SaleNotification): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping owner notification', {
      sessionId: sale.sessionId,
    })
    return
  }

  const amount = formatAmount(sale.amountTotal, sale.currency)
  const product =
    sale.mode === 'single'
      ? `$${sale.washValue} single wash token`
      : `$${sale.washValue} wash 4-pack`

  const subject = `New token sale — ${amount} · ${sale.customerName || sale.customerEmail}`

  const addressLines = formatAddressLines(sale.address)
  const addressHtml = addressLines.length
    ? addressLines.map((l) => escapeHtml(l)).join('<br>')
    : '—'

  const siteUrl = getSiteUrl()
  const emailLink = sale.customerEmail
    ? `<a href="mailto:${escapeHtml(sale.customerEmail)}" style="color:${BRAND.blue};text-decoration:none;">${escapeHtml(sale.customerEmail)}</a>`
    : '—'
  const phoneLink = sale.customerPhone
    ? `<a href="tel:${escapeHtml(sale.customerPhone.replace(/[^0-9+]/g, ''))}" style="color:${BRAND.blue};text-decoration:none;">${escapeHtml(sale.customerPhone)}</a>`
    : '—'

  const detailRow = (label: string, valueHtml: string, alt: boolean): string => `
    <tr>
      <td style="padding:11px 16px;background:${alt ? BRAND.paper : BRAND.white};border-bottom:1px solid ${BRAND.line};font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${BRAND.muted};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:11px 16px;background:${alt ? BRAND.paper : BRAND.white};border-bottom:1px solid ${BRAND.line};font-size:15px;color:${BRAND.ink};">${valueHtml}</td>
    </tr>`

  const detailRows = [
    ['Customer', escapeHtml(sale.customerName || '—')],
    ['Email', emailLink],
    ['Phone', phoneLink],
    ['Address', addressHtml],
    ['Product', escapeHtml(product)],
    ['Quantity', String(sale.quantity)],
    ['Tokens issued', `<strong>${sale.totalTokens}</strong>`],
    ['Amount paid', `<strong>${escapeHtml(amount)}</strong>`],
    ['Stripe session', `<span style="font-family:'Courier New',monospace;font-size:13px;color:${BRAND.muted};">${escapeHtml(sale.sessionId)}</span>`],
  ]
    .map(([label, value], i) => detailRow(label, value, i % 2 === 1))
    .join('')

  const codeChips = sale.codes.length
    ? sale.codes
        .map(
          (c) =>
            `<span style="display:inline-block;margin:0 8px 8px 0;padding:9px 14px;background:${BRAND.paper};border:1px solid ${BRAND.line};border-radius:8px;font-family:'Courier New',monospace;font-size:15px;font-weight:700;letter-spacing:.08em;color:${BRAND.navy};">${escapeHtml(c)}</span>`,
        )
        .join('')
    : `<span style="color:${BRAND.muted};">No codes generated.</span>`

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
  <body style="margin:0;padding:0;background:${BRAND.paper};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">New token sale — ${escapeHtml(amount)} from ${escapeHtml(sale.customerName || sale.customerEmail)}.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND.white};border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(8,24,63,.08);">

          <tr><td style="background:${BRAND.navy};padding:30px 32px;text-align:center;">
            <img src="cid:${LOGO_CID}" width="112" height="126" alt="Spotless Car Wash" style="display:inline-block;width:112px;height:auto;border:0;outline:none;text-decoration:none;">
            <div style="font-family:'Trebuchet MS',Arial,sans-serif;font-size:42px;font-weight:800;letter-spacing:.14em;color:${BRAND.white};text-transform:uppercase;margin-top:14px;">SPOTLESS<span style="color:${BRAND.yellow};">.</span></div>
            <div style="font-family:'Trebuchet MS',Arial,sans-serif;font-size:18px;font-weight:700;letter-spacing:.34em;color:${BRAND.yellow};text-transform:uppercase;margin-top:5px;">Car Wash</div>
            <div style="font-size:14px;letter-spacing:.05em;color:#9fb6e8;margin-top:16px;">${escapeHtml(TAGLINE)}</div>
          </td></tr>
          <tr><td style="height:4px;background:${BRAND.yellow};font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr><td style="padding:32px 32px 8px;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${BRAND.blue};">New token sale</div>
            <div style="font-size:26px;font-weight:800;color:${BRAND.ink};margin:6px 0 4px;">${escapeHtml(amount)}</div>
            <div style="font-size:15px;color:${BRAND.muted};">A token purchase just completed${sale.customerName ? ` for <strong style="color:${BRAND.ink};">${escapeHtml(sale.customerName)}</strong>` : ''}. Order details below.</div>
          </td></tr>

          <tr><td style="padding:20px 32px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.line};border-radius:10px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;border-collapse:separate;">
              ${detailRows}
            </table>
          </td></tr>

          <tr><td style="padding:20px 32px 32px;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${BRAND.blue};margin-bottom:12px;">Token codes (${sale.codes.length})</div>
            ${codeChips}
          </td></tr>

          <tr><td style="background:${BRAND.paper};border-top:1px solid ${BRAND.line};padding:24px 32px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:14px;font-weight:700;color:${BRAND.navy};">Spotless Car Wash · Since 1995</div>
            <div style="font-size:13px;color:${BRAND.muted};margin-top:6px;line-height:1.6;">
              7802 Madison St &amp; 7343 Roosevelt Rd, Forest Park, IL<br>
              Open 7am–10pm daily · <a href="tel:7087712945" style="color:${BRAND.blue};text-decoration:none;">(708) 771-2945</a>
            </div>
            <div style="margin-top:12px;"><a href="${escapeHtml(siteUrl)}" style="font-size:13px;font-weight:700;color:${BRAND.blue};text-decoration:none;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ''))}</a></div>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>`

  const text = [
    'New Spotless token purchase',
    '',
    `Customer: ${sale.customerName || '—'}`,
    `Email: ${sale.customerEmail}`,
    `Phone: ${sale.customerPhone || '—'}`,
    `Address: ${addressLines.length ? addressLines.join(', ') : '—'}`,
    `Product: ${product}`,
    `Quantity: ${sale.quantity}`,
    `Tokens issued: ${sale.totalTokens}`,
    `Amount paid: ${amount}`,
    `Stripe session: ${sale.sessionId}`,
    '',
    'Token codes:',
    ...(sale.codes.length ? sale.codes.map((c) => `  ${c}`) : ['  (none)']),
  ].join('\n')

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: getOwnerEmail(),
    replyTo: sale.customerEmail || undefined,
    subject,
    html,
    text,
    attachments: [
      {
        filename: 'spotless-logo.png',
        content: SPOTLESS_LOGO_BASE64,
        contentType: 'image/png',
        contentId: LOGO_CID,
      },
    ],
  })

  if (error) {
    console.error('[email] owner notification failed', {
      sessionId: sale.sessionId,
      error,
    })
  }
}

export type SubscriptionNotification = {
  /** 'new' = signup, 'renewal' = a monthly invoice cleared. */
  kind: 'new' | 'renewal'
  customerEmail: string
  customerName?: string
  plan?: string
  tokensCount: number
  amountTotal: number | null
  currency: string | null
  /** Checkout Session id for a signup, Invoice id for a renewal. */
  reference: string
  address?: MailingAddress | null
}

/**
 * Tell Joe a Wash Token Subscription needs fulfilling — either a brand-new
 * subscriber or a monthly renewal that just cleared. Same best-effort contract
 * as sendOwnerSaleNotification: a missing RESEND_API_KEY logs and returns so
 * the webhook still 200s.
 *
 * Deliberately plainer than the sale notification: this one is a work order.
 * The queue at /admin/fulfillments is the system of record; the email exists so
 * a shipment can't sit unnoticed.
 */
export async function sendOwnerSubscriptionNotification(
  sub: SubscriptionNotification,
): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping subscription notification', {
      reference: sub.reference,
    })
    return
  }

  const amount = formatAmount(sub.amountTotal, sub.currency)
  const isNew = sub.kind === 'new'
  const who = sub.customerName || sub.customerEmail
  const subject = isNew
    ? `New wash club subscriber — ${who}`
    : `Wash club renewal — ship ${sub.tokensCount} tokens to ${who}`

  const addressLines = formatAddressLines(sub.address ?? null)
  const addressHtml = addressLines.length
    ? addressLines.map((l) => escapeHtml(l)).join('<br>')
    : '—'

  const siteUrl = getSiteUrl()
  const queueUrl = `${siteUrl}/admin/fulfillments`
  const emailLink = sub.customerEmail
    ? `<a href="mailto:${escapeHtml(sub.customerEmail)}" style="color:${BRAND.blue};text-decoration:none;">${escapeHtml(sub.customerEmail)}</a>`
    : '—'

  const detailRow = (label: string, valueHtml: string, alt: boolean): string => `
    <tr>
      <td style="padding:11px 16px;background:${alt ? BRAND.paper : BRAND.white};border-bottom:1px solid ${BRAND.line};font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${BRAND.muted};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:11px 16px;background:${alt ? BRAND.paper : BRAND.white};border-bottom:1px solid ${BRAND.line};font-size:15px;color:${BRAND.ink};">${valueHtml}</td>
    </tr>`

  const rows: [string, string][] = [
    ['Customer', escapeHtml(sub.customerName || '—')],
    ['Email', emailLink],
    ['Ship to', addressHtml],
    ['Tokens to mail', `<strong>${sub.tokensCount}</strong>`],
  ]
  if (sub.plan) rows.push(['Plan', escapeHtml(sub.plan)])
  rows.push(['Amount', `<strong>${escapeHtml(amount)}</strong>`])
  rows.push([
    isNew ? 'Stripe session' : 'Stripe invoice',
    `<span style="font-family:'Courier New',monospace;font-size:13px;color:${BRAND.muted};">${escapeHtml(sub.reference)}</span>`,
  ])

  const detailRows = rows
    .map(([label, value], i) => detailRow(label, value, i % 2 === 1))
    .join('')

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
  <body style="margin:0;padding:0;background:${BRAND.paper};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(String(sub.tokensCount))} tokens to mail for ${escapeHtml(who)}.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND.white};border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(8,24,63,.08);">

          <tr><td style="background:${BRAND.navy};padding:30px 32px;text-align:center;">
            <img src="cid:${LOGO_CID}" width="112" height="126" alt="Spotless Car Wash" style="display:inline-block;width:112px;height:auto;border:0;outline:none;text-decoration:none;">
            <div style="font-family:'Trebuchet MS',Arial,sans-serif;font-size:42px;font-weight:800;letter-spacing:.14em;color:${BRAND.white};text-transform:uppercase;margin-top:14px;">SPOTLESS<span style="color:${BRAND.yellow};">.</span></div>
            <div style="font-family:'Trebuchet MS',Arial,sans-serif;font-size:18px;font-weight:700;letter-spacing:.34em;color:${BRAND.yellow};text-transform:uppercase;margin-top:5px;">Car Wash</div>
          </td></tr>
          <tr><td style="height:4px;background:${BRAND.yellow};font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr><td style="padding:32px 32px 8px;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${BRAND.blue};">${isNew ? 'New subscriber' : 'Monthly renewal'}</div>
            <div style="font-size:26px;font-weight:800;color:${BRAND.ink};margin:6px 0 4px;">Mail ${sub.tokensCount} tokens</div>
            <div style="font-size:15px;color:${BRAND.muted};">${isNew ? 'Someone just joined the wash club. Their first shipment is due now.' : 'A monthly payment cleared. This subscriber is due their tokens.'}</div>
          </td></tr>

          <tr><td style="padding:20px 32px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.line};border-radius:10px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;border-collapse:separate;">
              ${detailRows}
            </table>
          </td></tr>

          <tr><td style="padding:8px 32px 32px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
            <a href="${escapeHtml(queueUrl)}" style="display:inline-block;padding:14px 28px;background:${BRAND.blue};color:${BRAND.white};font-size:15px;font-weight:700;text-decoration:none;border-radius:999px;">Open the shipping queue</a>
          </td></tr>

          <tr><td style="background:${BRAND.paper};border-top:1px solid ${BRAND.line};padding:24px 32px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:13px;color:${BRAND.muted};line-height:1.6;">
              7802 Madison St &amp; 7343 Roosevelt Rd, Forest Park, IL<br>
              Open 7am–10pm daily
            </div>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>`

  const text = [
    isNew ? 'New Spotless wash club subscriber' : 'Spotless wash club renewal',
    '',
    `Customer: ${sub.customerName || '—'}`,
    `Email: ${sub.customerEmail}`,
    `Ship to: ${addressLines.length ? addressLines.join(', ') : '—'}`,
    `Tokens to mail: ${sub.tokensCount}`,
    ...(sub.plan ? [`Plan: ${sub.plan}`] : []),
    `Amount: ${amount}`,
    `${isNew ? 'Stripe session' : 'Stripe invoice'}: ${sub.reference}`,
    '',
    `Shipping queue: ${queueUrl}`,
  ].join('\n')

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: getOwnerEmail(),
    replyTo: sub.customerEmail || undefined,
    subject,
    html,
    text,
    attachments: [
      {
        filename: 'spotless-logo.png',
        content: SPOTLESS_LOGO_BASE64,
        contentType: 'image/png',
        contentId: LOGO_CID,
      },
    ],
  })

  if (error) {
    console.error('[email] subscription notification failed', {
      reference: sub.reference,
      error,
    })
  }
}

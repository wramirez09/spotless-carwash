import {
  addressLines,
  fetchAllFulfillments,
  parseFulfillmentQuery,
  type Fulfillment,
} from '@/lib/fulfillments'

export const runtime = 'nodejs'
// Always reflect the live table, never a cached snapshot.
export const dynamic = 'force-dynamic'

// A pick-and-pack list, not a data dump: the columns are what Joe needs in
// front of him to fill envelopes, in the order he needs them.
const COLUMNS: Array<{ header: string; value: (r: Fulfillment) => unknown }> = [
  { header: 'Name', value: (r) => r.subscriptions?.name ?? '' },
  { header: 'Tokens', value: (r) => r.tokens_count },
  { header: 'Token value', value: (r) => `$${r.wash_value}` },
  { header: 'Address', value: (r) => addressLines(r.subscriptions).join(' · ') },
  { header: 'Email', value: (r) => r.subscriptions?.email ?? '' },
  { header: 'Plan', value: (r) => r.subscriptions?.plan ?? '' },
  { header: 'Status', value: (r) => r.status },
  { header: 'Due', value: (r) => r.created_at },
  { header: 'Shipped', value: (r) => r.shipped_at ?? '' },
  { header: 'Tracking', value: (r) => r.tracking_number ?? '' },
  { header: 'Stripe invoice', value: (r) => r.stripe_invoice_id },
]

// RFC-4180 quoting. A leading =/+/-/@ is prefixed with a quote+apostrophe so
// spreadsheets don't execute it as a formula (CSV-injection guard).
function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value)
  if (typeof value === 'boolean') s = value ? 'yes' : 'no'
  if (/^[=+\-@]/.test(s)) s = `'${s}`
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

function toCsv(rows: Fulfillment[]): string {
  const header = COLUMNS.map((c) => c.header).join(',')
  const body = rows
    .map((r) => COLUMNS.map((c) => csvCell(c.value(r))).join(','))
    .join('\r\n')
  // Leading BOM so Excel reads UTF-8 (accented names) correctly.
  return `﻿${header}\r\n${body}\r\n`
}

export async function GET(request: Request) {
  const query = parseFulfillmentQuery(new URL(request.url).searchParams)
  const rows = await fetchAllFulfillments(query)
  const csv = toCsv(rows)

  const stamp = new Date().toISOString().slice(0, 10)
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="spotless-shipments-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}

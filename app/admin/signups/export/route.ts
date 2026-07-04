import { fetchAllSignups, parseSignupQuery, type Signup } from '@/lib/signups'

export const runtime = 'nodejs'
// Always reflect the live table, never a cached snapshot.
export const dynamic = 'force-dynamic'

const COLUMNS: Array<{ key: keyof Signup; header: string }> = [
  { key: 'email', header: 'Email' },
  { key: 'name', header: 'Name' },
  { key: 'phone', header: 'Phone' },
  { key: 'source', header: 'Source' },
  { key: 'status', header: 'Status' },
  { key: 'marketing_consent', header: 'Marketing consent' },
  { key: 'created_at', header: 'Signed up' },
  { key: 'unsubscribed_at', header: 'Unsubscribed' },
  { key: 'customer_id', header: 'Customer ID' },
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

function toCsv(rows: Signup[]): string {
  const header = COLUMNS.map((c) => c.header).join(',')
  const body = rows.map((r) => COLUMNS.map((c) => csvCell(r[c.key])).join(',')).join('\r\n')
  // Leading BOM so Excel reads UTF-8 (accented names) correctly.
  return `﻿${header}\r\n${body}\r\n`
}

export async function GET(request: Request) {
  const query = parseSignupQuery(new URL(request.url).searchParams)
  const rows = await fetchAllSignups(query)
  const csv = toCsv(rows)

  // Date only (YYYY-MM-DD) is enough to distinguish exports and avoids odd chars.
  const stamp = new Date().toISOString().slice(0, 10)
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="spotless-signups-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}

'use client'

import { useState, useTransition } from 'react'
import {
  effectivePriceCents,
  formatCents,
  parseDollarsToCents,
  priceSaveState,
  type PendingSave,
  type PriceKind,
  type WashValue,
} from '@/lib/pricing/model'
import { adoptSkuFromStripe, setPrice } from './actions'

export type PriceRowView = {
  kind: PriceKind
  washValue: WashValue
  cents: number | null
  stripePriceId: string
  /**
   * 'stripe' — the price is read from this SKU's Stripe Product (authoritative).
   * 'db'     — priced here before, but the Product isn't keyed yet.
   * 'env'    — still resolving from the deploy-time env var.
   */
  source: 'stripe' | 'db' | 'env'
}

type Props = { rows: PriceRowView[] }

function Row({ row }: { row: PriceRowView }) {
  const [value, setValue] = useState(
    row.cents != null ? (row.cents / 100).toFixed(2) : '',
  )
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)
  // What this browser last saved, held until the server data catches up.
  const [savedHere, setSavedHere] = useState<PendingSave>(null)
  const [pending, startTransition] = useTransition()

  // Behave as if the row holds the value we just saved, even when the
  // re-render lands on an instance whose cache still reports the old one.
  const cents = effectivePriceCents(row.cents, savedHere)
  const current = cents != null ? formatCents(cents) : 'Not set'
  // Compare in cents, not text: "32" and "32.00" are the same price, and a
  // string comparison would leave Save enabled on an unchanged row.
  const typedCents = parseDollarsToCents(value)
  const { canSave, reason: blockedReason } = priceSaveState({
    rawValue: value,
    typedCents,
    effectiveCents: cents,
    pending,
  })

  const asInput = (c: number | null) => (c != null ? (c / 100).toFixed(2) : '')
  const edited = value.trim() !== asInput(cents)
  const perToken =
    row.kind === 'pack' && cents != null ? formatCents(Math.round(cents / 4)) : null

  return (
    <tr className="border-t border-line align-middle">
      <td className="py-3 pr-4">
        <p className="font-bold text-ink">
          ${row.washValue} wash {row.kind === 'pack' ? '· 4-pack' : '· single'}
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
          {row.source === 'stripe' ? `Stripe · ${row.stripePriceId}` : 'From deploy config'}
        </p>
        {row.source !== 'stripe' && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setFeedback(null)
                setFeedback(await adoptSkuFromStripe(row.kind, row.washValue))
              })
            }
            className="mt-1 text-[11px] font-bold text-blue-500 underline underline-offset-2 disabled:opacity-40"
          >
            Read this price from Stripe
          </button>
        )}
      </td>
      <td className="py-3 pr-4">
        <p className="display text-[22px] leading-none text-blue-700">{current}</p>
        {perToken && (
          <p className="text-xs font-semibold text-slate-400">{perToken} / wash</p>
        )}
      </td>
      <td className="py-3 pr-4">
        <form
          className="flex items-center gap-2"
          action={(formData) =>
            startTransition(async () => {
              setFeedback(null)
              const res = await setPrice(formData)
              setFeedback(res)
              // Remember what we saved. Without this the row keeps comparing
              // against the pre-save amount and leaves Save enabled, which
              // invites a duplicate save — and every save mints a new Price.
              if (res.ok && typedCents != null) {
                setSavedHere({ from: row.cents, to: typedCents })
              }
              // The server action revalidates, so a success leaves the input
              // matching what was just saved; only clear it on failure to let
              // the admin correct the value they typed.
            })
          }
        >
          <input type="hidden" name="kind" value={row.kind} />
          <input type="hidden" name="washValue" value={row.washValue} />
          <span className="font-bold text-slate-400">$</span>
          <input
            name="amount"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={`New price for the $${row.washValue} ${row.kind}`}
            className="w-24 rounded-lg border border-line px-3 py-2 text-sm font-bold text-ink focus:border-blue-500 focus:outline-none"
            placeholder="0.00"
          />
          <button
            type="submit"
            disabled={!canSave}
            className="rounded-full bg-blue-700 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-blue-500 disabled:opacity-40"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
          {edited && !pending && (
            <button
              type="button"
              onClick={() => {
                setFeedback(null)
                setValue(asInput(cents))
              }}
              className="text-xs font-bold text-slate-500 underline underline-offset-2 hover:text-blue-700"
            >
              Reset
            </button>
          )}
        </form>
        {blockedReason && (
          <p className="mt-1 text-[11px] font-semibold text-slate-400">{blockedReason}</p>
        )}
        {feedback && (
          <p
            role="status"
            className={`mt-1 text-xs font-semibold ${
              feedback.ok ? 'text-green-700' : 'text-red-600'
            }`}
          >
            {feedback.message}
          </p>
        )}
      </td>
    </tr>
  )
}

export default function PriceGrid({ rows }: Props) {
  const packs = rows.filter((r) => r.kind === 'pack')
  const singles = rows.filter((r) => r.kind === 'single')

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <h2 className="display text-[26px] leading-none text-blue-700">List prices</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">
        Saving a price creates a new price in Stripe and points the store at it
        immediately. Orders already placed keep the price they were bought at.
      </p>

      {[
        { title: '4-packs', rows: packs },
        { title: 'Single tokens', rows: singles },
      ].map((group) => (
        <div key={group.title} className="mt-6">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-500">
            {group.title}
          </h3>
          <table className="mt-2 w-full text-sm">
            <thead className="sr-only">
              <tr>
                <th>Product</th>
                <th>Current price</th>
                <th>New price</th>
              </tr>
            </thead>
            <tbody>
              {group.rows.map((row) => (
                <Row key={`${row.kind}-${row.washValue}`} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

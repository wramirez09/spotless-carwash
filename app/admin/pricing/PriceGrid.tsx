'use client'

import { useState, useTransition } from 'react'
import {
  effectivePriceCents,
  formatCents,
  parseDollarsToCents,
  priceSaveState,
  type PendingSave,
  type PriceKind,
} from '@/lib/pricing/model'
import {
  adoptAllSkusFromStripe,
  adoptSkuFromStripe,
  createSku,
  deleteSku,
  featureSku,
  setPrice,
} from './actions'

export type PriceRowView = {
  /** SKU id — the Stripe Product's lookup key. */
  sku: string
  kind: PriceKind
  washValue: string
  tokens: number
  cents: number | null
  stripePriceId: string
  featured: boolean
  /**
   * 'stripe' — the price is read from this SKU's Stripe Product (authoritative).
   * 'db'     — priced here before, but the Product isn't keyed yet.
   * 'env'    — still resolving from the deploy-time env var.
   */
  source: 'stripe' | 'db' | 'env'
}

type Props = { rows: PriceRowView[] }

type Feedback = { ok: boolean; message: string } | null

function rowTitle(row: Pick<PriceRowView, 'kind' | 'washValue' | 'tokens'>): string {
  return row.kind === 'pack'
    ? `$${row.washValue} wash · ${row.tokens}-pack`
    : `$${row.washValue} wash · single`
}

function Row({ row }: { row: PriceRowView }) {
  const [value, setValue] = useState(
    row.cents != null ? (row.cents / 100).toFixed(2) : '',
  )
  const [feedback, setFeedback] = useState<Feedback>(null)
  // What this browser last saved, held until the server data catches up.
  const [savedHere, setSavedHere] = useState<PendingSave>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
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
    row.kind === 'pack' && cents != null
      ? formatCents(Math.round(cents / row.tokens))
      : null
  const title = rowTitle(row)

  return (
    <tr className="border-t border-line align-middle">
      <td className="py-3 pr-4">
        <p className="font-bold text-ink">
          {title}
          {row.featured && (
            <span className="ml-2 rounded-full bg-yellow-400 px-2 py-0.5 align-middle text-[10px] font-extrabold uppercase tracking-[0.12em] text-blue-700">
              Most popular
            </span>
          )}
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
          {row.source === 'stripe' ? `Stripe · ${row.stripePriceId}` : 'From deploy config'}
        </p>
        <div className="mt-1 flex flex-wrap gap-3">
          {row.source !== 'stripe' && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setFeedback(null)
                  setFeedback(await adoptSkuFromStripe(row.sku))
                })
              }
              className="text-[11px] font-bold text-blue-500 underline underline-offset-2 disabled:opacity-40"
            >
              Read this price from Stripe
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setFeedback(null)
                setFeedback(await featureSku(row.sku, !row.featured))
              })
            }
            className="text-[11px] font-bold text-blue-500 underline underline-offset-2 disabled:opacity-40"
          >
            {row.featured ? 'Unmark most popular' : 'Mark most popular'}
          </button>
          {confirmingDelete ? (
            <span className="inline-flex items-center gap-2 text-[11px] font-bold">
              <span className="text-red-600">Remove from the store?</span>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    setFeedback(null)
                    setConfirmingDelete(false)
                    setFeedback(await deleteSku(row.sku))
                  })
                }
                className="rounded-full bg-red-600 px-2.5 py-0.5 text-white disabled:opacity-40"
              >
                Yes, remove
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="text-slate-500 underline underline-offset-2"
              >
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmingDelete(true)}
              aria-label={`Remove the ${title}`}
              className="text-[11px] font-bold text-red-600 underline underline-offset-2 disabled:opacity-40"
            >
              Remove
            </button>
          )}
        </div>
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
            })
          }
        >
          <input type="hidden" name="sku" value={row.sku} />
          <span className="font-bold text-slate-400">$</span>
          <input
            name="amount"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={`New price for the ${title}`}
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

/** "Add a pack or single token" form. */
export function AddSkuForm() {
  const [kind, setKind] = useState<PriceKind>('pack')
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [pending, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)

  return (
    <form
      key={formKey}
      aria-label="Add a product"
      className="mt-6 rounded-xl border border-dashed border-line p-4"
      action={(formData) =>
        startTransition(async () => {
          setFeedback(null)
          const res = await createSku(formData)
          setFeedback(res)
          if (res.ok) {
            setKind('pack')
            setFormKey((k) => k + 1)
          }
        })
      }
    >
      <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-500">
        Add a product
      </h3>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-xs font-bold text-slate-500">
          Type
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as PriceKind)}
            className="mt-1 block rounded-lg border border-line px-3 py-2 text-sm font-bold text-ink"
          >
            <option value="pack">Token pack</option>
            <option value="single">Single token</option>
          </select>
        </label>
        <label className="text-xs font-bold text-slate-500">
          Wash value ($)
          <input
            name="washValue"
            inputMode="numeric"
            placeholder="12"
            required
            className="mt-1 block w-20 rounded-lg border border-line px-3 py-2 text-sm font-bold text-ink"
          />
        </label>
        {kind === 'pack' && (
          <label className="text-xs font-bold text-slate-500">
            Tokens per pack
            <input
              name="tokens"
              inputMode="numeric"
              defaultValue="4"
              required
              className="mt-1 block w-20 rounded-lg border border-line px-3 py-2 text-sm font-bold text-ink"
            />
          </label>
        )}
        <label className="text-xs font-bold text-slate-500">
          Price ($)
          <input
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            required
            className="mt-1 block w-24 rounded-lg border border-line px-3 py-2 text-sm font-bold text-ink"
          />
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs font-bold text-slate-500">
          <input type="checkbox" name="featured" />
          Most popular
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-blue-700 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-blue-500 disabled:opacity-40"
        >
          {pending ? 'Adding…' : 'Add to store'}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Creates the product and its price in Stripe; it appears on the site straight away.
      </p>
      {feedback && (
        <p
          role="status"
          className={`mt-2 text-xs font-semibold ${
            feedback.ok ? 'text-green-700' : 'text-red-600'
          }`}
        >
          {feedback.message}
        </p>
      )}
    </form>
  )
}

function AdoptAllButton({ count }: { count: number }) {
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [pending, startTransition] = useTransition()
  return (
    <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-800">
      {count} {count === 1 ? 'item is' : 'items are'} still priced from the deploy
      config, so edits made in the Stripe dashboard won&apos;t show on the site.{' '}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setFeedback(null)
            setFeedback(await adoptAllSkusFromStripe())
          })
        }
        className="font-extrabold underline underline-offset-2 disabled:opacity-40"
      >
        {pending ? 'Linking…' : 'Link all to Stripe'}
      </button>
      {feedback && (
        <span role="status" className={feedback.ok ? 'ml-2 text-green-700' : 'ml-2 text-red-600'}>
          {feedback.message}
        </span>
      )}
    </div>
  )
}

export default function PriceGrid({ rows }: Props) {
  const packs = rows.filter((r) => r.kind === 'pack')
  const singles = rows.filter((r) => r.kind === 'single')
  const unlinked = rows.filter((r) => r.source !== 'stripe').length

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <h2 className="display text-[26px] leading-none text-blue-700">Token packs &amp; prices</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">
        Everything here lives in Stripe, and the site lists exactly what&apos;s in
        this table. Saving a price creates a new price in Stripe and points the
        store at it immediately; removing an item archives it in Stripe. Orders
        already placed keep the price they were bought at.
      </p>
      {unlinked > 0 && <AdoptAllButton count={unlinked} />}

      {[
        { title: 'Token packs', rows: packs, empty: 'No packs on sale.' },
        { title: 'Single tokens', rows: singles, empty: 'No single tokens on sale.' },
      ].map((group) => (
        <div key={group.title} className="mt-6">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-500">
            {group.title}
          </h3>
          {group.rows.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">{group.empty}</p>
          ) : (
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
                  <Row key={row.sku} row={row} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      <AddSkuForm />
    </div>
  )
}

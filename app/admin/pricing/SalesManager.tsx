'use client'

import { useState, useTransition } from 'react'
import { formatCents, type SaleState } from '@/lib/pricing/model'
import { cancelSale, publishSale, reprovisionSale, saveSale } from './actions'

/** Serializable view of a sale row, prepared by the page. */
export type SaleView = {
  id: string
  slug: string
  label: string
  badge: string
  emoji: string
  endLabel: string
  /** `datetime-local` values, already converted to Chicago wall time. */
  startInput: string
  endInput: string
  /** Human-readable window for the summary line. */
  startText: string
  endText: string
  extraDiscountCents: number
  state: SaleState
  provisioned: boolean
  /** Set when the coupon no longer matches the current bundle discount. */
  drift: { expected: number; actual: number } | null
}

type Feedback = { ok: boolean; message: string } | null

const STATE_STYLE: Record<SaleState, { label: string; className: string }> = {
  live: { label: 'Live now', className: 'bg-green-700 text-white' },
  upcoming: { label: 'Scheduled', className: 'bg-blue-700 text-white' },
  draft: { label: 'Draft', className: 'bg-slate-200 text-slate-700' },
  ended: { label: 'Ended', className: 'bg-slate-100 text-slate-500' },
  canceled: { label: 'Canceled', className: 'bg-red-100 text-red-700' },
}

function StateBadge({ state }: { state: SaleState }) {
  const s = STATE_STYLE[state]
  return (
    <span
      className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${s.className}`}
    >
      {s.label}
    </span>
  )
}

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null
  return (
    <p
      role="status"
      className={`mt-2 text-xs font-semibold ${
        feedback.ok ? 'text-green-700' : 'text-red-600'
      }`}
    >
      {feedback.message}
    </p>
  )
}

const field =
  'w-full rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink focus:border-blue-500 focus:outline-none'
const fieldLabel =
  'block font-mono text-[10px] uppercase tracking-[0.16em] text-blue-500'

function SaleForm({
  sale,
  baseDiscountCents,
  onDone,
}: {
  sale: SaleView | null
  baseDiscountCents: number
  onDone: () => void
}) {
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [pending, startTransition] = useTransition()
  const [extra, setExtra] = useState(
    sale ? (sale.extraDiscountCents / 100).toFixed(2) : '5.00',
  )

  const extraCents = Math.round(Number(extra.replace(/[^0-9.]/g, '')) * 100)
  const total = Number.isFinite(extraCents) ? baseDiscountCents + extraCents : null

  return (
    <form
      className="mt-4 rounded-xl border border-line bg-paper p-5"
      action={(formData) =>
        startTransition(async () => {
          setFeedback(null)
          const res = await saveSale(formData)
          setFeedback(res)
          if (res.ok) onDone()
        })
      }
    >
      {sale && <input type="hidden" name="id" value={sale.id} />}
      {sale && <input type="hidden" name="slug" value={sale.slug} />}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={fieldLabel} htmlFor="label">
            Sale name
          </label>
          <input
            id="label"
            name="label"
            required
            defaultValue={sale?.label ?? ''}
            placeholder="Labor Day"
            className={`${field} mt-1`}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Shown on the discount chip at checkout.
          </p>
        </div>

        <div>
          <label className={fieldLabel} htmlFor="badge">
            Banner badge
          </label>
          <input
            id="badge"
            name="badge"
            defaultValue={sale?.badge ?? ''}
            placeholder="LABOR DAY"
            className={`${field} mt-1`}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Blank uses the sale name in capitals.
          </p>
        </div>

        <div>
          <label className={fieldLabel} htmlFor="startsAt">
            Starts (Forest Park time)
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={sale?.startInput ?? ''}
            className={`${field} mt-1`}
          />
        </div>

        <div>
          <label className={fieldLabel} htmlFor="endsAt">
            Ends (Forest Park time)
          </label>
          <input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            required
            defaultValue={sale?.endInput ?? ''}
            className={`${field} mt-1`}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Use 11:59 PM on the last day so the sale runs all day.
          </p>
        </div>

        <div>
          <label className={fieldLabel} htmlFor="extraDiscount">
            Extra off each 4-pack
          </label>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-bold text-slate-400">$</span>
            <input
              id="extraDiscount"
              name="extraDiscount"
              inputMode="decimal"
              required
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              className={field}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            On top of the {formatCents(baseDiscountCents)} bundle discount
            {total != null && Number.isFinite(total) ? (
              <>
                {' '}
                — customers save <b>{formatCents(total)}</b> per pack.
              </>
            ) : null}
          </p>
        </div>

        <div>
          <label className={fieldLabel} htmlFor="emoji">
            Banner emoji
          </label>
          <input
            id="emoji"
            name="emoji"
            defaultValue={sale?.emoji ?? ''}
            placeholder="🛠️"
            className={`${field} mt-1`}
          />
        </div>

        <div className="md:col-span-2">
          <label className={fieldLabel} htmlFor="endLabel">
            &quot;Now through…&quot; text
          </label>
          <input
            id="endLabel"
            name="endLabel"
            defaultValue={sale?.endLabel ?? ''}
            placeholder="Mon, Sep 7"
            className={`${field} mt-1`}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Blank fills in the end date automatically.
          </p>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          name="publish"
          defaultChecked={sale ? sale.state !== 'draft' : true}
          className="h-4 w-4"
        />
        Publish — set up the discount in Stripe and run it on schedule
      </label>
      <p className="ml-6 text-[11px] text-slate-400">
        Leave unchecked to save a draft that customers never see.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-blue-500 disabled:opacity-40"
        >
          {pending ? 'Saving…' : sale ? 'Save changes' : 'Create sale'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-sm font-bold text-slate-500 underline underline-offset-2"
        >
          Cancel
        </button>
      </div>

      <FeedbackLine feedback={feedback} />
    </form>
  )
}

function SaleCard({
  sale,
  baseDiscountCents,
}: {
  sale: SaleView
  baseDiscountCents: number
}) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [pending, startTransition] = useTransition()

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      setFeedback(null)
      setFeedback(await fn())
      setConfirming(false)
    })

  const total = baseDiscountCents + sale.extraDiscountCents
  const closed = sale.state === 'ended' || sale.state === 'canceled'

  return (
    <li className="rounded-xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span aria-hidden>{sale.emoji}</span>
            <p className="display text-[22px] leading-none text-blue-700">{sale.label}</p>
            <StateBadge state={sale.state} />
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {sale.startText} → {sale.endText}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {formatCents(total)} off every 4-pack
            <span className="font-normal text-slate-400">
              {' '}
              ({formatCents(baseDiscountCents)} bundle + {formatCents(sale.extraDiscountCents)}{' '}
              sale)
            </span>
          </p>
        </div>

        {!closed && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="rounded-full border border-line px-4 py-2 text-xs font-bold text-blue-700 transition hover:border-blue-500"
            >
              {editing ? 'Close' : 'Edit'}
            </button>

            {sale.state === 'draft' && (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => publishSale(sale.id))}
                className="rounded-full bg-blue-700 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-blue-500 disabled:opacity-40"
              >
                Publish
              </button>
            )}

            {confirming ? (
              <span className="flex items-center gap-2 text-xs font-semibold text-red-700">
                {sale.state === 'live' ? 'Stop this sale now?' : 'Cancel this sale?'}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => cancelSale(sale.id))}
                  className="rounded-full bg-red-600 px-3 py-1.5 font-extrabold text-white disabled:opacity-40"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="underline underline-offset-2"
                >
                  No
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-700 transition hover:border-red-500"
              >
                {sale.state === 'live' ? 'Stop now' : 'Cancel'}
              </button>
            )}
          </div>
        )}
      </div>

      {sale.drift && !closed && (
        <div className="mt-3 rounded-lg bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-800">
            This sale&apos;s Stripe discount is {formatCents(sale.drift.actual)}, but the
            current bundle discount makes it {formatCents(sale.drift.expected)}. Re-issue it
            so customers get the right total.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => reprovisionSale(sale.id))}
            className="mt-2 rounded-full bg-amber-700 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-40"
          >
            Re-issue discount
          </button>
        </div>
      )}

      {!sale.provisioned && sale.state !== 'draft' && !closed && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-800">
          No Stripe discount is attached to this sale yet, so packs would sell at the
          everyday bundle price. Publish it again to set one up.
        </p>
      )}

      <FeedbackLine feedback={feedback} />

      {editing && (
        <SaleForm
          sale={sale}
          baseDiscountCents={baseDiscountCents}
          onDone={() => setEditing(false)}
        />
      )}
    </li>
  )
}

export default function SalesManager({
  sales,
  baseDiscountCents,
}: {
  sales: SaleView[]
  baseDiscountCents: number
}) {
  const [creating, setCreating] = useState(false)

  const open = sales.filter((s) => s.state !== 'ended' && s.state !== 'canceled')
  const closed = sales.filter((s) => s.state === 'ended' || s.state === 'canceled')

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="display text-[26px] leading-none text-blue-700">Sales</h2>
          <p className="mt-2 text-sm text-slate-500">
            Schedule a sale once and it turns itself on and off on the dates you set.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-blue-500"
        >
          {creating ? 'Close' : 'Schedule a sale'}
        </button>
      </div>

      {creating && (
        <SaleForm
          sale={null}
          baseDiscountCents={baseDiscountCents}
          onDone={() => setCreating(false)}
        />
      )}

      {open.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {open.map((sale) => (
            <SaleCard key={sale.id} sale={sale} baseDiscountCents={baseDiscountCents} />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-center text-sm text-slate-500">
          No sales scheduled. Packs are selling at the everyday{' '}
          {formatCents(baseDiscountCents)} bundle discount.
        </p>
      )}

      {closed.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.18em] text-blue-500">
            Past sales ({closed.length})
          </summary>
          <ul className="mt-4 space-y-4">
            {closed.map((sale) => (
              <SaleCard key={sale.id} sale={sale} baseDiscountCents={baseDiscountCents} />
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { formatCents } from '@/lib/pricing/model'
import { setBaseDiscount } from './actions'

type Props = { currentCents: number; driftCount: number }

/**
 * The always-on 4-pack bundle discount — the one every pack gets outside a
 * sale window, and the floor a sale's discount stacks on top of.
 */
export default function BundleDiscountCard({ currentCents, driftCount }: Props) {
  const [value, setValue] = useState((currentCents / 100).toFixed(2))
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <h2 className="display text-[26px] leading-none text-blue-700">Bundle discount</h2>
      <p className="mt-2 text-sm text-slate-500">
        Taken off every 4-pack, all year round. Currently{' '}
        <b className="text-ink">{formatCents(currentCents)}</b>.
      </p>

      <form
        className="mt-4 flex items-center gap-2"
        action={(formData) =>
          startTransition(async () => {
            setFeedback(null)
            setFeedback(await setBaseDiscount(formData))
          })
        }
      >
        <span className="font-bold text-slate-400">$</span>
        <input
          name="amount"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Bundle discount amount"
          className="w-24 rounded-lg border border-line px-3 py-2 text-sm font-bold text-ink focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-blue-700 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-blue-500 disabled:opacity-40"
        >
          {pending ? 'Saving…' : 'Update'}
        </button>
      </form>

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

      {driftCount > 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-800">
          {driftCount} scheduled {driftCount === 1 ? 'sale is' : 'sales are'} still
          using a coupon built on the old bundle discount. Re-issue{' '}
          {driftCount === 1 ? 'it' : 'them'} below so customers get the right
          total.
        </p>
      )}
    </div>
  )
}

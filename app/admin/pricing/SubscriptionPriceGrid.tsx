'use client'

import { useState, useTransition } from 'react'
import {
  effectivePriceCents,
  formatCents,
  parseDollarsToCents,
  priceSaveState,
  type PendingSave,
} from '@/lib/pricing/model'
import { setSubscriptionPrice } from './actions'

export type SubscriptionPriceView = {
  plan: string
  planName: string
  tokensPerCycle: number
  washValue: string
  /** What the site shows: Stripe's amount, or the computed default when unset. */
  cents: number
  /**
   * 'stripe' — keyed Price set from this screen.
   * 'env'    — the Price ID from the deploy config.
   * 'unset'  — no Price exists yet; the site shows the computed amount and
   *            checkout for this variant is unavailable until one is saved.
   */
  source: 'stripe' | 'env' | 'unset'
}

function Cell({ v }: { v: SubscriptionPriceView }) {
  const [value, setValue] = useState((v.cents / 100).toFixed(2))
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)
  const [savedHere, setSavedHere] = useState<PendingSave>(null)
  const [pending, startTransition] = useTransition()

  // An unset variant has no real price yet, so saving its computed amount
  // as-is is allowed — that is how it gets created.
  const rowCents = v.source === 'unset' ? null : v.cents
  const cents = effectivePriceCents(rowCents, savedHere)
  const typedCents = parseDollarsToCents(value)
  const { canSave, reason } = priceSaveState({
    rawValue: value,
    typedCents,
    effectiveCents: cents,
    pending,
  })

  return (
    <td className="py-2 pr-3 align-top">
      <form
        className="flex items-center gap-1.5"
        action={(formData) =>
          startTransition(async () => {
            setFeedback(null)
            const res = await setSubscriptionPrice(formData)
            setFeedback(res)
            if (res.ok && typedCents != null) setSavedHere({ from: rowCents, to: typedCents })
          })
        }
      >
        <input type="hidden" name="plan" value={v.plan} />
        <input type="hidden" name="washValue" value={v.washValue} />
        <span className="text-xs font-bold text-slate-400">$</span>
        <input
          name="amount"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label={`Monthly price for ${v.planName} with $${v.washValue} tokens`}
          className="w-20 rounded-lg border border-line px-2 py-1.5 text-sm font-bold text-ink focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!canSave}
          className="rounded-full bg-blue-700 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-blue-500 disabled:opacity-40"
        >
          {pending ? '…' : 'Save'}
        </button>
      </form>
      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
        {v.source === 'unset' && !savedHere
          ? 'Not in Stripe yet — save to enable'
          : reason ?? `${formatCents(Math.round((cents ?? v.cents) / v.tokensPerCycle))} / token`}
      </p>
      {feedback && (
        <p
          role="status"
          className={`mt-0.5 max-w-[180px] text-[11px] font-semibold ${
            feedback.ok ? 'text-green-700' : 'text-red-600'
          }`}
        >
          {feedback.message}
        </p>
      )}
    </td>
  )
}

export default function SubscriptionPriceGrid({
  rows,
  washValues,
}: {
  rows: SubscriptionPriceView[]
  washValues: readonly string[]
}) {
  const plans = [...new Map(rows.map((r) => [r.plan, r])).values()]
  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <h2 className="display text-[26px] leading-none text-blue-700">Subscription prices</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">
        Monthly price per plan, by the token the subscriber chooses. Saving creates
        a new recurring price in Stripe for new sign-ups; existing subscribers stay
        on the price they signed up at.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-mono text-[11px] uppercase tracking-[0.14em] text-blue-500">
              <th className="py-2 pr-3">Plan</th>
              {washValues.map((w) => (
                <th key={w} className="py-2 pr-3">
                  ${w} tokens
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.plan} className="border-t border-line">
                <td className="py-2 pr-3 align-top">
                  <p className="font-bold text-ink">{p.planName}</p>
                  <p className="text-xs text-slate-400">{p.tokensPerCycle} tokens / mo</p>
                </td>
                {washValues.map((w) => {
                  const v = rows.find((r) => r.plan === p.plan && r.washValue === w)
                  return v ? <Cell key={w} v={v} /> : <td key={w} />
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

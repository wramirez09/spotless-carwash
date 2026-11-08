'use client'

import { useState, useTransition } from 'react'
import {
  effectivePriceCents,
  formatCents,
  parseDollarsToCents,
  priceSaveState,
  type PendingSave,
} from '@/lib/pricing/model'
import { createPlan, deletePlan, removePlanPrice, setPlanPrice, updatePlan } from './actions'

export type PlanVariantView = {
  washValue: string
  cents: number
  /**
   * 'stripe'   — a monthly Price managed here.
   * 'env'      — the Price from the deploy config (original plans only).
   * 'computed' — no Price exists; shown on the site but not purchasable.
   */
  source: 'stripe' | 'env' | 'computed'
}

export type PlanView = {
  id: string
  name: string
  tokensPerCycle: number
  blurb: string
  featured: boolean
  /** 'legacy' — one of the original plans, still defined in code. */
  source: 'stripe' | 'legacy'
  variants: PlanVariantView[]
}

type Feedback = { ok: boolean; message: string } | null

function Status({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null
  return (
    <p
      role="status"
      className={`mt-1 text-xs font-semibold ${feedback.ok ? 'text-green-700' : 'text-red-600'}`}
    >
      {feedback.message}
    </p>
  )
}

const inputCls =
  'rounded-lg border border-line px-3 py-2 text-sm font-bold text-ink focus:border-blue-500 focus:outline-none'
const buttonCls =
  'rounded-full bg-blue-700 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-blue-500 disabled:opacity-40'

function VariantRow({ plan, v }: { plan: PlanView; v: PlanVariantView }) {
  const [value, setValue] = useState((v.cents / 100).toFixed(2))
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [savedHere, setSavedHere] = useState<PendingSave>(null)
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()

  // A computed value has no Price yet, so saving its shown amount as-is is
  // allowed — that is how it becomes purchasable.
  const rowCents = v.source === 'computed' ? null : v.cents
  const cents = effectivePriceCents(rowCents, savedHere)
  const typedCents = parseDollarsToCents(value)
  const { canSave, reason } = priceSaveState({
    rawValue: value,
    typedCents,
    effectiveCents: cents,
    pending,
  })
  const label = `${plan.name} with $${v.washValue} tokens`

  return (
    <tr className="border-t border-line align-top">
      <td className="py-2 pr-3">
        <p className="font-bold text-ink">${v.washValue} tokens</p>
        <p className="text-[11px] font-semibold text-slate-400">
          {v.source === 'computed' && !savedHere
            ? 'Not in Stripe — save to make it purchasable'
            : `${formatCents(Math.round((cents ?? v.cents) / plan.tokensPerCycle))} / token`}
        </p>
      </td>
      <td className="py-2 pr-3">
        <form
          className="flex items-center gap-2"
          action={(formData) =>
            startTransition(async () => {
              setFeedback(null)
              const res = await setPlanPrice(formData)
              setFeedback(res)
              if (res.ok && typedCents != null) setSavedHere({ from: rowCents, to: typedCents })
            })
          }
        >
          <input type="hidden" name="planId" value={plan.id} />
          <input type="hidden" name="washValue" value={v.washValue} />
          <span className="text-xs font-bold text-slate-400">$</span>
          <input
            name="amount"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={`Monthly price for ${label}`}
            className={`w-24 ${inputCls}`}
          />
          <span className="text-xs font-semibold text-slate-400">/ mo</span>
          <button type="submit" disabled={!canSave} className={buttonCls}>
            {pending ? 'Saving…' : 'Save'}
          </button>
        </form>
        {reason && v.source !== 'computed' && (
          <p className="mt-1 text-[11px] font-semibold text-slate-400">{reason}</p>
        )}
        <Status feedback={feedback} />
      </td>
      <td className="py-2 text-right">
        {confirming ? (
          <span className="inline-flex items-center gap-2 text-[11px] font-bold">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setConfirming(false)
                  setFeedback(await removePlanPrice(plan.id, v.washValue))
                })
              }
              className="rounded-full bg-red-600 px-2.5 py-0.5 text-white disabled:opacity-40"
            >
              Yes, remove
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-slate-500 underline underline-offset-2"
            >
              Keep
            </button>
          </span>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming(true)}
            aria-label={`Remove ${label}`}
            className="text-[11px] font-bold text-red-600 underline underline-offset-2 disabled:opacity-40"
          >
            Remove
          </button>
        )}
      </td>
    </tr>
  )
}

function AddValueForm({ plan }: { plan: PlanView }) {
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [pending, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)
  return (
    <form
      key={formKey}
      aria-label={`Add a token value to ${plan.name}`}
      className="mt-3 flex flex-wrap items-end gap-2"
      action={(formData) =>
        startTransition(async () => {
          setFeedback(null)
          const res = await setPlanPrice(formData)
          setFeedback(res)
          if (res.ok) setFormKey((k) => k + 1)
        })
      }
    >
      <input type="hidden" name="planId" value={plan.id} />
      <label className="text-xs font-bold text-slate-500">
        Token value ($)
        <input name="washValue" inputMode="numeric" placeholder="15" required className={`mt-1 block w-20 ${inputCls}`} />
      </label>
      <label className="text-xs font-bold text-slate-500">
        Monthly price ($)
        <input name="amount" inputMode="decimal" placeholder="0.00" required className={`mt-1 block w-24 ${inputCls}`} />
      </label>
      <button type="submit" disabled={pending} className={buttonCls}>
        {pending ? 'Adding…' : 'Add token value'}
      </button>
      <div className="basis-full">
        <Status feedback={feedback} />
      </div>
    </form>
  )
}

/** Name / tokens / description / Most Popular fields, shared by edit and create. */
function PlanFields({ plan }: { plan?: PlanView }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-xs font-bold text-slate-500">
        Plan name
        <input
          name="name"
          defaultValue={plan?.name}
          required
          maxLength={40}
          className={`mt-1 block w-44 ${inputCls}`}
        />
      </label>
      <label className="text-xs font-bold text-slate-500">
        Tokens / month
        <input
          name="tokensPerCycle"
          inputMode="numeric"
          defaultValue={plan?.tokensPerCycle ?? 4}
          required
          className={`mt-1 block w-20 ${inputCls}`}
        />
      </label>
      <label className="min-w-[220px] flex-1 text-xs font-bold text-slate-500">
        Description
        <input
          name="blurb"
          defaultValue={plan?.blurb}
          maxLength={200}
          className={`mt-1 block w-full ${inputCls}`}
        />
      </label>
      <label className="flex items-center gap-2 pb-2 text-xs font-bold text-slate-500">
        <input type="checkbox" name="featured" defaultChecked={plan?.featured} />
        Most popular
      </label>
    </div>
  )
}

function PlanCard({ plan }: { plan: PlanView }) {
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <section
      aria-label={`${plan.name} plan`}
      className="rounded-xl border border-line p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
          Plan id · {plan.id}
          {plan.source === 'legacy' && ' · from deploy config — saving moves it into Stripe'}
        </p>
        {confirmingDelete ? (
          <span className="inline-flex items-center gap-2 text-[11px] font-bold">
            <span className="text-red-600">Stop offering {plan.name}?</span>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setConfirmingDelete(false)
                  setFeedback(await deletePlan(plan.id))
                })
              }
              className="rounded-full bg-red-600 px-2.5 py-0.5 text-white disabled:opacity-40"
            >
              Yes, delete plan
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
            aria-label={`Delete the ${plan.name} plan`}
            className="text-[11px] font-bold text-red-600 underline underline-offset-2 disabled:opacity-40"
          >
            Delete plan
          </button>
        )}
      </div>

      <form
        aria-label={`Edit the ${plan.name} plan`}
        className="mt-2"
        action={(formData) =>
          startTransition(async () => {
            setFeedback(null)
            setFeedback(await updatePlan(formData))
          })
        }
      >
        <input type="hidden" name="planId" value={plan.id} />
        <PlanFields plan={plan} />
        <button type="submit" disabled={pending} className={`mt-3 ${buttonCls}`}>
          {pending ? 'Saving…' : 'Save plan'}
        </button>
        <Status feedback={feedback} />
      </form>

      {plan.variants.length === 0 ? (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-800">
          No token values — this plan is hidden from the site until you add one.
        </p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead className="sr-only">
            <tr>
              <th>Token value</th>
              <th>Monthly price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plan.variants.map((v) => (
              <VariantRow key={v.washValue} plan={plan} v={v} />
            ))}
          </tbody>
        </table>
      )}
      <AddValueForm plan={plan} />
    </section>
  )
}

function AddPlanForm() {
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [pending, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)
  return (
    <form
      key={formKey}
      aria-label="Add a subscription plan"
      className="rounded-xl border border-dashed border-line p-4"
      action={(formData) =>
        startTransition(async () => {
          setFeedback(null)
          const res = await createPlan(formData)
          setFeedback(res)
          if (res.ok) setFormKey((k) => k + 1)
        })
      }
    >
      <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-500">
        Add a plan
      </h3>
      <div className="mt-3">
        <PlanFields />
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-xs font-bold text-slate-500">
          First token value ($)
          <input name="washValue" inputMode="numeric" defaultValue="12" required className={`mt-1 block w-20 ${inputCls}`} />
        </label>
        <label className="text-xs font-bold text-slate-500">
          Monthly price ($)
          <input name="amount" inputMode="decimal" placeholder="0.00" required className={`mt-1 block w-24 ${inputCls}`} />
        </label>
        <button type="submit" disabled={pending} className={buttonCls}>
          {pending ? 'Adding…' : 'Add plan'}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Creates the plan and its monthly price in Stripe; add more token values once it exists.
      </p>
      <Status feedback={feedback} />
    </form>
  )
}

export default function SubscriptionPlansManager({
  plans,
  live,
  enabled,
}: {
  plans: PlanView[]
  /** False when Stripe couldn't be reached and the original plans are shown. */
  live: boolean
  /** Whether customers can see the subscription pages at all. */
  enabled: boolean
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <h2 className="display text-[26px] leading-none text-blue-700">Subscription plans</h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-500">
        Every plan and monthly price lives in Stripe, and the subscribe page lists
        exactly what&apos;s here. Changes apply to new sign-ups; existing subscribers
        keep the plan, price and token count they signed up with.
      </p>
      {!enabled && (
        <p className="mt-3 rounded-lg bg-slate-100 p-3 text-xs font-semibold text-slate-600">
          Subscriptions are switched off for customers on this deployment
          (SUBSCRIPTIONS_ENABLED). You can set plans up here before turning them on.
        </p>
      )}
      {!live && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-800">
          Stripe couldn&apos;t be reached, so these are the built-in plans. Changes
          can&apos;t be saved until Stripe is back.
        </p>
      )}
      <div className="mt-5 space-y-4">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
        <AddPlanForm />
      </div>
    </div>
  )
}

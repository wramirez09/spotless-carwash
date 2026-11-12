'use client'

import Link from 'next/link'
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
  syncWithWashPackages,
  addWashPackage,
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
  /** The wash package this token value belongs to, or null if none. */
  tierName?: string | null
  /** tokens × the wash package price — what this SKU should list at. */
  expectedCents?: number | null
}

export type WashTierView = { name: string; washValue: string; priceCents: number }

type Props = {
  rows: PriceRowView[]
  /** The wash packages from the CMS — the source of truth for token prices. */
  tiers?: WashTierView[]
  /** False when the CMS didn't answer and the built-in lineup is shown. */
  lineupFromCms?: boolean
  /** What "Sync" would change, one line each. */
  syncPlan?: string[]
  /** Whether this deployment can write wash packages to the CMS. */
  canAddPackages?: boolean
}

type Feedback = { ok: boolean; message: string } | null

function rowTitle(row: Pick<PriceRowView, 'kind' | 'washValue' | 'tokens'>): string {
  return row.kind === 'pack'
    ? `$${row.washValue} wash · ${row.tokens}-pack`
    : `$${row.washValue} wash · single`
}

function Row({
  row,
  onRemoved,
}: {
  row: PriceRowView
  /** Called with the success message: the row unmounts once it's gone. */
  onRemoved: (message: string) => void
}) {
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
                    const res = await deleteSku(row.sku)
                    // On success the row disappears with the next render, and
                    // its own status line with it — so report up a level.
                    if (res.ok) onRemoved(res.message)
                    else setFeedback(res)
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
        {row.expectedCents === null ? (
          <p className="mt-1 max-w-[200px] text-[11px] font-semibold text-red-600">
            No ${row.washValue} wash package — hidden from the store. Sync removes it.
          </p>
        ) : row.expectedCents !== undefined && cents !== row.expectedCents ? (
          <p className="mt-1 max-w-[200px] text-[11px] font-semibold text-amber-700">
            {row.tierName} wash price makes this {formatCents(row.expectedCents)}. Sync
            resets it.
          </p>
        ) : null}
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
export function AddSkuForm({ tiers = [] }: { tiers?: WashTierView[] }) {
  const [kind, setKind] = useState<PriceKind>('pack')
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [pending, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)
  // Token values come from the wash packages, and the price is filled in from
  // the wash price (tokens × price) — editable, but the sensible default.
  const [washValue, setWashValue] = useState(tiers[0]?.washValue ?? '')
  const [tokens, setTokens] = useState('4')
  const [amount, setAmount] = useState<string | null>(null)
  const tier = tiers.find((t) => t.washValue === washValue)
  const count = kind === 'single' ? 1 : Number(tokens)
  const suggested =
    tier && Number.isInteger(count) && count > 0 ? ((tier.priceCents * count) / 100).toFixed(2) : ''

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
            setTokens('4')
            setAmount(null)
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
        {tiers.length > 0 ? (
          <label className="text-xs font-bold text-slate-500">
            Wash package
            <select
              name="washValue"
              value={washValue}
              onChange={(e) => setWashValue(e.target.value)}
              className="mt-1 block rounded-lg border border-line px-3 py-2 text-sm font-bold text-ink"
            >
              {tiers.map((t) => (
                <option key={t.washValue} value={t.washValue}>
                  {t.name} · ${t.washValue}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="text-xs font-bold text-slate-500">
            Wash value ($)
            <input
              name="washValue"
              inputMode="numeric"
              placeholder="12"
              required
              value={washValue}
              onChange={(e) => setWashValue(e.target.value)}
              className="mt-1 block w-20 rounded-lg border border-line px-3 py-2 text-sm font-bold text-ink"
            />
          </label>
        )}
        {kind === 'pack' && (
          <label className="text-xs font-bold text-slate-500">
            Tokens per pack
            <input
              name="tokens"
              inputMode="numeric"
              value={tokens}
              onChange={(e) => setTokens(e.target.value)}
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
            value={amount ?? suggested}
            onChange={(e) => setAmount(e.target.value)}
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
        {tier && ' The price is filled in from the wash package (tokens × wash price).'}
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

/**
 * The wash packages (CMS) and whether the token prices in Stripe match them.
 * Wash packages are the source of truth: every token value and price follows
 * them, and "Sync" applies the difference. Publishing a change in the CMS runs
 * the same sync automatically; this is for checking, and for catching up.
 */
function WashPackagesPanel({
  tiers,
  fromCms,
  plan,
  canAddPackages,
}: {
  tiers: WashTierView[]
  fromCms: boolean
  plan: string[]
  canAddPackages: boolean
}) {
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [pending, startTransition] = useTransition()

  return (
    <section
      aria-label="Wash packages"
      className={`mt-4 rounded-xl border p-4 ${
        plan.length ? 'border-amber-300 bg-amber-50' : 'border-line bg-paper'
      }`}
    >
      <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-500">
        Wash packages · source of truth
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Token values and prices follow the wash packages on the home page: a single
        token is the wash price, and an N-pack lists at N × the wash price before
        the pack discount.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {tiers.map((t) => (
          <span
            key={t.washValue}
            className="rounded-full border border-line bg-white px-3 py-1 text-xs font-bold text-ink"
          >
            {t.name} · {formatCents(t.priceCents)}
          </span>
        ))}
      </div>

      {!fromCms ? (
        <p className="mt-3 text-xs font-semibold text-amber-800">
          The CMS couldn&apos;t be reached, so these are the built-in packages and
          syncing is off until it&apos;s back.
        </p>
      ) : plan.length === 0 ? (
        <p className="mt-3 text-xs font-semibold text-green-700">
          ✓ Every token price matches the wash packages.
        </p>
      ) : (
        <div className="mt-3">
          <p className="text-xs font-bold text-amber-900">
            {plan.length} {plan.length === 1 ? 'change' : 'changes'} needed to match the
            wash packages:
          </p>
          <ul className="mt-1 list-disc pl-5 text-xs text-amber-900">
            {plan.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setFeedback(null)
                setFeedback(await syncWithWashPackages())
              })
            }
            className="mt-3 rounded-full bg-blue-700 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-blue-500 disabled:opacity-40"
          >
            {pending ? 'Syncing…' : 'Sync to wash packages'}
          </button>
        </div>
      )}
      {feedback && (
        <p
          role="status"
          className={`mt-2 text-xs font-semibold ${feedback.ok ? 'text-green-700' : 'text-red-600'}`}
        >
          {feedback.message}
        </p>
      )}

      {canAddPackages ? (
        <AddWashPackageForm />
      ) : (
        <p className="mt-3 text-xs text-slate-500">
          To add a wash package,{' '}
          <Link
            href="/studio/structure/washPackage"
            className="font-bold text-blue-600 underline underline-offset-2"
          >
            create it in the CMS
          </Link>
          ; its tokens go on sale when you publish.
        </p>
      )}
    </section>
  )
}

const WASH_COLOR_OPTIONS = [
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
  { value: 'blue', label: 'Blue' },
  { value: 'red', label: 'Red' },
]

/**
 * Add a wash package. It goes on the home page and its token pack goes on
 * sale in one step: the package is written to the CMS, then the token catalog
 * is synced to it (see lib/washPackagesAdmin.ts).
 */
function AddWashPackageForm() {
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [pending, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)
  const field = 'mt-1 block rounded-lg border border-line bg-white px-3 py-2 text-sm font-bold text-ink'

  if (!open) {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-blue-700 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-blue-700 transition hover:bg-blue-700 hover:text-white"
        >
          + Add a wash package
        </button>
        {feedback && (
          <p role="status" className={`mt-2 text-xs font-semibold ${feedback.ok ? 'text-green-700' : 'text-red-600'}`}>
            {feedback.message}
          </p>
        )}
      </div>
    )
  }

  return (
    <form
      key={formKey}
      aria-label="Add a wash package"
      className="mt-4 rounded-xl border border-dashed border-line bg-white p-4"
      action={(formData) =>
        startTransition(async () => {
          setFeedback(null)
          const res = await addWashPackage(formData)
          setFeedback(res)
          if (res.ok) {
            setFormKey((k) => k + 1)
            setOpen(false)
          }
        })
      }
    >
      <h4 className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-500">
        Add a wash package
      </h4>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-xs font-bold text-slate-500">
          Name
          <input name="name" required maxLength={30} placeholder="Platinum" className={`${field} w-40`} />
        </label>
        <label className="text-xs font-bold text-slate-500">
          Price per wash ($)
          <input name="price" inputMode="numeric" required placeholder="16" className={`${field} w-24`} />
        </label>
        <label className="text-xs font-bold text-slate-500">
          Colour
          <select name="color" defaultValue="green" className={field}>
            {WASH_COLOR_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-3 block text-xs font-bold text-slate-500">
        What&apos;s included — one per line
        <textarea
          name="features"
          required
          rows={5}
          placeholder={'Undercarriage spray\nDouble presoak\nSpot-free rinse\nAir cannon dryer'}
          className={`${field} w-full max-w-md font-semibold`}
        />
      </label>
      <p className="mt-2 text-[11px] text-slate-400">
        Adds the package to the home page and puts its token pack on sale (4 × the price,
        less the pack discount) — the price is the token value, so each package needs its
        own price.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-blue-700 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-blue-500 disabled:opacity-40"
        >
          {pending ? 'Adding…' : 'Add package'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setFeedback(null)
            setOpen(false)
          }}
          className="text-xs font-bold text-slate-500 underline underline-offset-2"
        >
          Cancel
        </button>
      </div>
      {feedback && (
        <p role="status" className={`mt-2 text-xs font-semibold ${feedback.ok ? 'text-green-700' : 'text-red-600'}`}>
          {feedback.message}
        </p>
      )}
    </form>
  )
}

export default function PriceGrid({
  rows,
  tiers = [],
  lineupFromCms = false,
  syncPlan = [],
  canAddPackages = false,
}: Props) {
  const packs = rows.filter((r) => r.kind === 'pack')
  const singles = rows.filter((r) => r.kind === 'single')
  const unlinked = rows.filter((r) => r.source !== 'stripe').length
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <h2 className="display text-[26px] leading-none text-blue-700">Token packs &amp; prices</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">
        Everything here lives in Stripe. The site sells the items that match a wash
        package; saving a price creates a new price in Stripe and points the store
        at it immediately, and removing an item archives it in Stripe. Orders
        already placed keep the price they were bought at.
      </p>
      {tiers.length > 0 && (
        <WashPackagesPanel
          tiers={tiers}
          fromCms={lineupFromCms}
          plan={syncPlan}
          canAddPackages={canAddPackages && lineupFromCms}
        />
      )}
      {unlinked > 0 && <AdoptAllButton count={unlinked} />}
      {notice && (
        <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-700">
          {notice}
        </p>
      )}

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
                  <Row key={row.sku} row={row} onRemoved={setNotice} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      <AddSkuForm tiers={tiers} />
    </div>
  )
}

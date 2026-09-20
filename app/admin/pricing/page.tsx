import type { Metadata } from 'next'
import { getSessionUser } from '@/lib/supabase/authServer'
import {
  getPricingSnapshot,
  listAllSales,
  listCatalogPrices,
} from '@/lib/pricingStore'
import {
  PRICE_KINDS,
  WASH_VALUES,
  couponDrift,
  formatCents,
  isProvisioned,
  pickActiveSale,
  saleEndLabel,
  saleState,
  type PriceKind,
  type WashValue,
} from '@/lib/pricing/model'
import { formatChicagoAdmin, toChicagoLocalInput } from '@/lib/pricing/time'
import { getCheckoutPricing } from '@/lib/stripePricing'
import { signOut } from '../login/actions'
import PriceGrid, { type PriceRowView } from './PriceGrid'
import BundleDiscountCard from './BundleDiscountCard'
import SalesManager, { type SaleView } from './SalesManager'

export const runtime = 'nodejs'
// Pricing is the one screen that must never be served stale — it is the
// source of truth an admin is about to make decisions from.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pricing & sales · Spotless Admin',
  robots: { index: false, follow: false },
}

export default async function PricingAdminPage() {
  // `getCheckoutPricing` is what the storefront itself renders from, so
  // reading it here means this screen shows the prices customers are actually
  // being charged — including SKUs still priced from the deploy config, whose
  // amounts live only in Stripe.
  const [snapshot, sales, catalog, pricing, user] = await Promise.all([
    getPricingSnapshot(),
    listAllSales(),
    listCatalogPrices(),
    getCheckoutPricing(),
    getSessionUser(),
  ])

  const livePackCents = new Map(pricing.packs.map((p) => [p.id, p.price]))
  const liveSingleCents = new Map(pricing.singles.map((p) => [p.id, p.price]))

  const now = Date.now()
  const live = pickActiveSale(snapshot.sales, now)

  // A SKU priced through this screen has a catalog row; one that still comes
  // from the deploy config doesn't. The distinction is worth showing — it is
  // the difference between "I can change this here" and "this is whatever was
  // deployed".
  const catalogBySku = new Map(catalog.map((c) => [`${c.kind}-${c.washValue}`, c]))
  const priceRows: PriceRowView[] = PRICE_KINDS.flatMap((kind: PriceKind) =>
    WASH_VALUES.map((washValue: WashValue): PriceRowView => {
      const row = catalogBySku.get(`${kind}-${washValue}`)
      const resolved = snapshot.prices[kind][washValue]
      const liveCents =
        kind === 'pack' ? livePackCents.get(washValue) : liveSingleCents.get(washValue)
      // Prefer the resolved amount over the catalog row's stored copy: when
      // Stripe is authoritative for this SKU it is the live number, and the
      // stored copy is only a record of what it was set to here.
      return {
        kind,
        washValue,
        cents: resolved.cents ?? liveCents ?? row?.unitAmountCents ?? null,
        stripePriceId: resolved.stripePriceId || (row?.stripePriceId ?? ''),
        source: resolved.source,
      }
    }),
  )

  const saleViews: SaleView[] = sales.map((sale) => ({
    id: sale.id,
    slug: sale.slug,
    label: sale.label,
    badge: sale.badge,
    emoji: sale.emoji,
    endLabel: saleEndLabel(sale),
    startInput: toChicagoLocalInput(sale.startMs),
    endInput: toChicagoLocalInput(sale.endMs),
    startText: formatChicagoAdmin(sale.startMs),
    endText: formatChicagoAdmin(sale.endMs),
    extraDiscountCents: sale.extraDiscountCents,
    state: saleState(sale, now),
    provisioned: isProvisioned(sale),
    drift: couponDrift(sale, snapshot.settings),
  }))

  const driftCount = saleViews.filter(
    (s) => s.drift && s.state !== 'ended' && s.state !== 'canceled',
  ).length

  const liveTotal = live
    ? snapshot.settings.baseDiscountCents + live.extraDiscountCents
    : snapshot.settings.baseDiscountCents

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-6 md:px-7">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-blue-500">
              Spotless Admin
            </p>
            <h1 className="display text-[32px] leading-none text-blue-700 md:text-[40px]">
              Pricing &amp; sales
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/signups"
              className="rounded-full border border-line px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-500"
            >
              Sign-ups
            </a>
            <a
              href="/admin/fulfillments"
              className="rounded-full border border-line px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-500"
            >
              Shipping queue
            </a>
            {user?.email && (
              <div className="flex items-center gap-2 border-l border-line pl-3">
                <span
                  className="hidden text-xs font-semibold text-slate-500 sm:inline"
                  title={user.email}
                >
                  {user.email}
                </span>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="rounded-full border border-line px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-500"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] space-y-6 px-5 py-8 md:px-7">
        <section
          aria-label="What customers see right now"
          className={`rounded-2xl border p-6 ${
            live ? 'border-blue-700 bg-blue-700 text-white' : 'border-line bg-white'
          }`}
        >
          <p
            className={`font-mono text-[11px] uppercase tracking-[0.18em] ${
              live ? 'text-sky-400' : 'text-blue-500'
            }`}
          >
            Right now on the site
          </p>
          <p className="mt-2 display text-[32px] leading-none">
            {live ? (
              <>
                {live.emoji} {live.label} — {formatCents(liveTotal)} off every 4-pack
              </>
            ) : (
              <>{formatCents(liveTotal)} off every 4-pack</>
            )}
          </p>
          <p className={`mt-2 text-sm ${live ? 'text-white/70' : 'text-slate-500'}`}>
            {live
              ? `Sale ends ${formatChicagoAdmin(live.endMs)}. The banner and checkout are already showing it.`
              : 'No sale is running — packs are at the everyday bundle discount.'}
          </p>
        </section>

        {snapshot.source === 'fallback' && (
          <p className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm font-semibold text-amber-900">
            The pricing database isn&apos;t reachable for this deployment, so the site is
            running on the prices and sales set at deploy time. Changes made here
            won&apos;t stick until that&apos;s fixed — send this message to Will.
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <PriceGrid rows={priceRows} />
          <BundleDiscountCard
            currentCents={snapshot.settings.baseDiscountCents}
            driftCount={driftCount}
          />
        </div>

        <SalesManager
          sales={saleViews}
          baseDiscountCents={snapshot.settings.baseDiscountCents}
        />
      </main>
    </div>
  )
}

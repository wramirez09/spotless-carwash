import type { SignupStats } from '@/lib/signups'

function pct(part: number, whole: number): string {
  if (!whole) return '0%'
  return `${Math.round((part / whole) * 100)}%`
}

function Card({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent ? 'border-blue-700 bg-blue-700 text-white' : 'border-line bg-white text-ink'
      }`}
    >
      <p
        className={`font-mono text-[11px] uppercase tracking-[0.18em] ${
          accent ? 'text-sky-400' : 'text-blue-500'
        }`}
      >
        {label}
      </p>
      <p className="mt-2 display text-[40px] leading-none">{value}</p>
      {hint && (
        <p className={`mt-1 text-xs font-semibold ${accent ? 'text-white/70' : 'text-slate-400'}`}>
          {hint}
        </p>
      )}
    </div>
  )
}

export default function StatCards({ stats }: { stats: SignupStats }) {
  const topSource = stats.sources[0]

  return (
    <section aria-label="Summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card label="Total sign-ups" value={stats.total.toLocaleString()} accent />
      <Card
        label="Active subscribers"
        value={stats.subscribed.toLocaleString()}
        hint={`${pct(stats.subscribed, stats.total)} of total`}
      />
      <Card
        label="Unsubscribed"
        value={stats.unsubscribed.toLocaleString()}
        hint={`${pct(stats.unsubscribed, stats.total)} of total`}
      />
      <Card
        label="New this week"
        value={stats.newThisWeek.toLocaleString()}
        hint="Last 7 days"
      />

      {stats.sources.length > 0 && (
        <div className="col-span-2 rounded-2xl border border-line bg-white p-5 lg:col-span-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-500">
            By source
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.sources.map((s) => (
              <span
                key={s.source}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-semibold"
              >
                {s.source}
                <span className="rounded-full bg-blue-700 px-2 py-0.5 text-xs font-extrabold text-white">
                  {s.count.toLocaleString()}
                </span>
              </span>
            ))}
          </div>
          {topSource && (
            <p className="mt-3 text-xs font-semibold text-slate-400">
              Top source: <span className="text-blue-700">{topSource.source}</span> (
              {pct(topSource.count, stats.total)})
            </p>
          )}
        </div>
      )}
    </section>
  )
}

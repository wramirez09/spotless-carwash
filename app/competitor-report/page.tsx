import type { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanityFetch'
import { renderInline, Section } from '@/lib/reportRender'
import {
  competitorReportFallback,
  type CompetitorReportCopy,
} from '@/src/data/reports/competitorReport'

const QUERY = `*[_type == "competitorReportPage"][0]{
  metaTitle, metaDescription,
  kicker, headline,
  headerFacts[]{ label, value },
  positionLine,
  sections[]{
    _key, id, kicker, heading, intro,
    widgets[]{
      ...,
      rows[]{ _key, cells },
      widgets[]{
        ...,
        rows[]{ _key, cells }
      }
    }
  },
  footerLine
}`

async function loadCopy(): Promise<CompetitorReportCopy> {
  const data = await sanityFetch<Partial<CompetitorReportCopy> | null>(QUERY)
  if (!data) return competitorReportFallback
  const merged: CompetitorReportCopy = { ...competitorReportFallback }
  for (const [k, v] of Object.entries(data) as [
    keyof CompetitorReportCopy,
    unknown,
  ][]) {
    if (v === null || v === undefined) continue
    if (Array.isArray(v) && v.length === 0) continue
    // @ts-expect-error -- per-field merge with fallback
    merged[k] = v
  }
  return merged
}

export async function generateMetadata(): Promise<Metadata> {
  const copy = await loadCopy()
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    robots: { index: false, follow: false, nocache: true },
  }
}

export default async function CompetitorReportPage() {
  const copy = await loadCopy()
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 text-ink">
      <header className="border-b border-ink/20 pb-8 mb-10">
        {copy.kicker ? (
          <p className="text-xs uppercase tracking-widest text-ink/60 mb-2">
            {copy.kicker}
          </p>
        ) : null}
        {copy.headline ? (
          <h1 className="text-4xl font-black mb-4">{copy.headline}</h1>
        ) : null}
        {copy.headerFacts && copy.headerFacts.length ? (
          <dl className="text-sm space-y-1 text-ink/80">
            {copy.headerFacts.map((fact, i) => (
              <div key={i}>
                {fact.label ? (
                  <dt className="inline font-semibold">{fact.label} </dt>
                ) : null}
                {fact.value ? <dd className="inline">{fact.value}</dd> : null}
              </div>
            ))}
          </dl>
        ) : null}
        {copy.positionLine ? (
          <p className="mt-4 text-xl font-bold">{copy.positionLine}</p>
        ) : null}
      </header>

      {(copy.sections ?? []).map((section, i) => (
        <Section key={section._key ?? i} section={section} />
      ))}

      {copy.footerLine ? (
        <footer className="border-t border-ink/20 pt-6 mt-12 text-sm text-ink/60 italic">
          {renderInline(copy.footerLine)}
        </footer>
      ) : null}
    </article>
  )
}

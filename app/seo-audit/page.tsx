import type { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanityFetch'
import { renderInline, Section, Widget, ptComponents } from '@/lib/reportRender'
import type { ReportQuote } from '@/lib/reportRender'
import { PortableText } from '@portabletext/react'
import { seoAuditFallback, type SeoAuditCopy } from '@/src/data/reports/seoAudit'

const QUERY = `*[_type == "seoAuditPage"][0]{
  metaTitle, metaDescription,
  kicker, headline, siteUrl, dateLabel, scoreLabel,
  gradeSummary,
  headerNote,
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

async function loadCopy(): Promise<SeoAuditCopy> {
  const data = await sanityFetch<Partial<SeoAuditCopy> | null>(QUERY)
  if (!data) return seoAuditFallback
  const merged: SeoAuditCopy = { ...seoAuditFallback }
  for (const [k, v] of Object.entries(data) as [keyof SeoAuditCopy, unknown][]) {
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

export default async function SeoAuditPage() {
  const copy = await loadCopy()
  const note = copy.headerNote as ReportQuote | undefined
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 text-ink">
      <header className="border-b border-ink/20 pb-8 mb-10">
        {copy.kicker ? (
          <p className="text-xs uppercase tracking-widest text-ink/60 mb-2">
            {copy.kicker}
          </p>
        ) : null}
        {copy.headline ? (
          <h1 className="text-4xl font-black mb-2">{copy.headline}</h1>
        ) : null}
        {copy.siteUrl ? (
          <p className="text-base text-ink/80 mb-1">{copy.siteUrl}</p>
        ) : null}
        {copy.dateLabel ? (
          <p className="text-sm text-ink/70">{copy.dateLabel}</p>
        ) : null}
        {copy.scoreLabel ? (
          <p className="mt-4 text-xl font-bold">{copy.scoreLabel}</p>
        ) : null}
        {copy.gradeSummary && copy.gradeSummary.length ? (
          <div className="mt-2">
            <PortableText
              value={copy.gradeSummary as never}
              components={ptComponents}
            />
          </div>
        ) : null}
        {note && note.text ? (
          <div className="mt-4">
            <Widget widget={{ ...note, _type: 'reportQuote' }} />
          </div>
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

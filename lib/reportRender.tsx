import type { ReactNode } from 'react'
import { PortableText, type PortableTextComponents } from '@portabletext/react'

// ---------------------------------------------------------------------------
// Inline markdown renderer — used on plain string fields like list items,
// quote text, table cells, and "fact" values. Supports:
//   **bold**, *italic*, `code`, [label](url)
// ---------------------------------------------------------------------------

export function renderInline(text: string | undefined): ReactNode[] {
  if (!text) return []
  const out: ReactNode[] = []
  const re =
    /\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) out.push(text.slice(lastIndex, m.index))
    if (m[1] !== undefined) {
      out.push(<strong key={`b-${key++}`}>{m[1]}</strong>)
    } else if (m[2] !== undefined) {
      out.push(<em key={`i-${key++}`}>{m[2]}</em>)
    } else if (m[3] !== undefined) {
      out.push(<code key={`c-${key++}`}>{m[3]}</code>)
    } else if (m[4] !== undefined && m[5] !== undefined) {
      out.push(
        <a
          key={`a-${key++}`}
          href={m[5]}
          className="underline"
        >
          {m[4]}
        </a>,
      )
    }
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < text.length) out.push(text.slice(lastIndex))
  return out
}

// ---------------------------------------------------------------------------
// Types — mirror the Sanity schemas in /sanity/schemas/objects/reportWidgets.ts
// ---------------------------------------------------------------------------

export type PTBlock = unknown // Portable Text array contents

export type ReportTable = {
  _type: 'reportTable'
  _key?: string
  caption?: string
  headers?: string[]
  rows?: { _key?: string; cells?: string[] }[]
  totalRow?: string[]
}

export type ReportList = {
  _type: 'reportList'
  _key?: string
  style?: 'bullet' | 'number' | 'checklist'
  start?: number
  items?: string[]
}

export type ReportCode = {
  _type: 'reportCode'
  _key?: string
  code?: string
}

export type ReportQuote = {
  _type: 'reportQuote'
  _key?: string
  text?: string
  emphasis?: 'italic' | 'plain' | 'boldItalic'
}

export type ReportProse = {
  _type: 'reportProse'
  _key?: string
  body?: PTBlock[]
}

export type ReportSubsection = {
  _type: 'reportSubsection'
  _key?: string
  heading?: string
  intro?: PTBlock[]
  widgets?: ReportWidget[]
}

export type ReportWidget =
  | ReportProse
  | ReportTable
  | ReportList
  | ReportCode
  | ReportQuote
  | ReportSubsection

export type ReportSection = {
  _key?: string
  id?: string
  kicker?: string
  heading?: string
  intro?: PTBlock[]
  widgets?: ReportWidget[]
}

// ---------------------------------------------------------------------------
// Portable Text components, styled to match the existing report aesthetic.
// ---------------------------------------------------------------------------

export const ptComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mb-4">{children}</p>,
    h3: ({ children }) => (
      <h3 className="text-xl font-bold mb-3 mt-6">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-bold mt-4 mb-2">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-ink/30 pl-4 italic text-ink/80 mb-4">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-6 space-y-1 mb-4">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal pl-6 space-y-1 mb-4">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    code: ({ children }) => <code>{children}</code>,
    link: ({ value, children }) => (
      <a href={(value as { href?: string })?.href ?? '#'} className="underline">
        {children}
      </a>
    ),
  },
}

// ---------------------------------------------------------------------------
// Widget renderers
// ---------------------------------------------------------------------------

function Table({ widget }: { widget: ReportTable }) {
  const headers = widget.headers ?? []
  const rows = widget.rows ?? []
  const totalRow = widget.totalRow ?? []
  return (
    <div className="overflow-x-auto mb-4">
      {widget.caption ? (
        <p className="text-sm text-ink/70 mb-2">{widget.caption}</p>
      ) : null}
      <table className="w-full text-sm border-collapse">
        {headers.length ? (
          <thead>
            <tr className="border-b-2 border-ink">
              {headers.map((h, i) => (
                <th key={i} className="text-left py-2 pr-4">
                  {renderInline(h)}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody className="align-top">
          {rows.map((row, i) => (
            <tr key={row._key ?? i} className="border-b border-ink/10">
              {(row.cells ?? []).map((cell, j) => (
                <td key={j} className="py-2 pr-4">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
          {totalRow.length ? (
            <tr className="border-t-2 border-ink font-bold">
              {totalRow.map((cell, i) => (
                <td key={i} className="py-2 pr-4">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

function List({ widget }: { widget: ReportList }) {
  const items = widget.items ?? []
  if (items.length === 0) return null
  const style = widget.style ?? 'bullet'
  if (style === 'number') {
    return (
      <ol
        start={widget.start ?? undefined}
        className="list-decimal pl-6 space-y-2 mb-6"
      >
        {items.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </ol>
    )
  }
  if (style === 'checklist') {
    return (
      <ul className="list-none pl-0 space-y-1 mb-6">
        {items.map((it, i) => (
          <li key={i}>{'☐ '}{renderInline(it)}</li>
        ))}
      </ul>
    )
  }
  return (
    <ul className="list-disc pl-6 space-y-1 mb-4">
      {items.map((it, i) => (
        <li key={i}>{renderInline(it)}</li>
      ))}
    </ul>
  )
}

function Code({ widget }: { widget: ReportCode }) {
  if (!widget.code) return null
  return (
    <pre className="bg-ink/5 border border-ink/10 p-4 rounded text-xs overflow-x-auto mb-4 whitespace-pre">
      <code>{widget.code}</code>
    </pre>
  )
}

function Quote({ widget }: { widget: ReportQuote }) {
  if (!widget.text) return null
  const emphasis = widget.emphasis ?? 'italic'
  const cls =
    emphasis === 'boldItalic'
      ? 'border-l-4 border-ink/30 pl-4 italic font-semibold text-ink mb-4'
      : emphasis === 'plain'
        ? 'border-l-4 border-ink/30 pl-4 text-ink/90 mb-4'
        : 'border-l-4 border-ink/30 pl-4 italic text-ink/90 mb-4'
  return <blockquote className={cls}>{renderInline(widget.text)}</blockquote>
}

function Prose({ widget }: { widget: ReportProse }) {
  if (!widget.body || !Array.isArray(widget.body) || widget.body.length === 0)
    return null
  return <PortableText value={widget.body as never} components={ptComponents} />
}

function Subsection({ widget }: { widget: ReportSubsection }) {
  return (
    <div className="mb-8">
      {widget.heading ? (
        <h3 className="text-xl font-bold mb-3">{widget.heading}</h3>
      ) : null}
      {widget.intro && widget.intro.length ? (
        <PortableText value={widget.intro as never} components={ptComponents} />
      ) : null}
      {(widget.widgets ?? []).map((w, i) => (
        <Widget key={(w as { _key?: string })._key ?? i} widget={w} />
      ))}
    </div>
  )
}

export function Widget({ widget }: { widget: ReportWidget }) {
  switch (widget._type) {
    case 'reportTable':
      return <Table widget={widget} />
    case 'reportList':
      return <List widget={widget} />
    case 'reportCode':
      return <Code widget={widget} />
    case 'reportQuote':
      return <Quote widget={widget} />
    case 'reportProse':
      return <Prose widget={widget} />
    case 'reportSubsection':
      return <Subsection widget={widget} />
    default:
      return null
  }
}

export function Section({ section }: { section: ReportSection }) {
  return (
    <section className="mb-12">
      {section.kicker ? (
        <p className="text-xs uppercase tracking-widest text-ink/60 mb-2">
          {section.kicker}
        </p>
      ) : null}
      {section.heading ? (
        <h2 className="text-2xl font-bold mb-4">{section.heading}</h2>
      ) : null}
      {section.intro && section.intro.length ? (
        <PortableText value={section.intro as never} components={ptComponents} />
      ) : null}
      {(section.widgets ?? []).map((w, i) => (
        <Widget key={(w as { _key?: string })._key ?? i} widget={w} />
      ))}
    </section>
  )
}

/**
 * Helper to build a Portable Text "normal" paragraph block from a string.
 * Used in fallback data so the in-code defaults render through the same
 * PortableText pipeline as Sanity content.
 */
export function pt(text: string, key: string): Record<string, unknown> {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `${key}s`, text, marks: [] }],
  }
}

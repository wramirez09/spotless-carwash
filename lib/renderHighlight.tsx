import { Fragment, type ReactNode } from 'react'

/**
 * Renders a string with `**...**` markers as JSX, wrapping the marked spans
 * in <em className={hlClass}>. Lets editors mark a yellow-highlight phrase
 * inline without splitting fields in the schema.
 */
export function renderHighlight(text: string | undefined, hlClass: string): ReactNode {
  if (!text) return null
  const parts = text.split(/\*\*(.+?)\*\*/)
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <em key={i} className={hlClass}>
        {p}
      </em>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    ),
  )
}

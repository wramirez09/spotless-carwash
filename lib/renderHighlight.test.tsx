// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { renderHighlight } from './renderHighlight'

// Editors mark a highlighted phrase inline with **...**; this is what turns
// that into markup. Getting the odd/even split wrong would either swallow copy
// or highlight the wrong half of a sentence.

const html = (text: string | undefined) =>
  renderToStaticMarkup(<p>{renderHighlight(text, 'hl')}</p>)

const textOf = (markup: string) => markup.replace(/<[^>]+>/g, '')

describe('renderHighlight', () => {
  it('wraps a marked span in <em> with the given class', () => {
    expect(html('Save **$5** every wash.')).toContain('<em class="hl">$5</em>')
  })

  it('keeps the surrounding text intact', () => {
    expect(textOf(html('Save **$5** every wash.'))).toBe('Save $5 every wash.')
  })

  it('handles several marked spans', () => {
    const markup = html('**A** middle **B**')
    expect(markup.match(/<em/g)).toHaveLength(2)
    expect(textOf(markup)).toBe('A middle B')
  })

  it('renders plain text untouched when nothing is marked', () => {
    const markup = html('No markers here')
    expect(markup).not.toContain('<em')
    expect(textOf(markup)).toBe('No markers here')
  })

  it('leaves an unclosed marker as literal text rather than eating the rest', () => {
    const markup = html('Save **$5 every wash')
    expect(markup).not.toContain('<em')
    expect(textOf(markup)).toBe('Save **$5 every wash')
  })

  it('returns null for empty or missing copy', () => {
    expect(renderHighlight('', 'hl')).toBeNull()
    expect(renderHighlight(undefined, 'hl')).toBeNull()
  })
})

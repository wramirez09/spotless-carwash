// WCAG contrast helpers.
//
// The wash-dial colours are authored in Sanity, so an editor can pick any
// background they like — and the swatches that mirror the physical dial on the
// bay happen to be bright mid-tones that white text fails against. Rather than
// hardcode corrected values (which the next Studio edit would undo), the
// component derives a readable pair at render time.
//
// Pure and dependency-free so it can be unit-tested and run on either side.

/** WCAG AA minimum for body-sized text. */
export const AA_NORMAL = 4.5

const INK = '#08183F'
const WHITE = '#ffffff'

function parseHex(hex: string): [number, number, number] | null {
  const h = hex.trim().replace(/^#/, '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number]
}

function toHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

function channelLuminance(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(hex: string): number | null {
  const rgb = parseHex(hex)
  if (!rgb) return null
  const [r, g, b] = rgb.map(channelLuminance)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contrast ratio between two colours, 1..21. Returns null if either is unparseable. */
export function contrastRatio(a: string, b: string): number | null {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  if (la == null || lb == null) return null
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export function meetsAA(foreground: string, background: string, min = AA_NORMAL): boolean {
  const r = contrastRatio(foreground, background)
  return r != null && r >= min
}

/**
 * A background/foreground pair guaranteed to clear `min`, staying as close to
 * what was authored as possible.
 *
 * Order of preference:
 *   1. Keep both as authored, if they already pass.
 *   2. Keep the background, swap the text to white or ink — whichever passes.
 *      The background is the thing carrying meaning (it mirrors the dial), so
 *      it is the last thing to change.
 *   3. Darken the background in small steps until white text passes. Hue is
 *      preserved because all three channels scale together.
 *
 * Unparseable input is returned untouched — a caller passing a CSS variable or
 * a named colour gets its value back rather than a crash.
 */
export function accessiblePair(
  background: string | undefined,
  preferredForeground?: string,
  min = AA_NORMAL,
): { bg: string | undefined; fg: string | undefined } {
  if (!background) return { bg: background, fg: preferredForeground }
  const rgb = parseHex(background)
  if (!rgb) return { bg: background, fg: preferredForeground }

  if (preferredForeground && meetsAA(preferredForeground, background, min)) {
    return { bg: background, fg: preferredForeground }
  }
  for (const candidate of [WHITE, INK]) {
    if (meetsAA(candidate, background, min)) return { bg: background, fg: candidate }
  }

  // Neither text colour works on this background — darken it until white does.
  let current: [number, number, number] = rgb
  for (let i = 0; i < 40; i += 1) {
    current = current.map((c) => c * 0.94) as [number, number, number]
    const hex = toHex(current)
    if (meetsAA(WHITE, hex, min)) return { bg: hex, fg: WHITE }
  }
  // Unreachable in practice: 40 steps takes any colour to near-black.
  return { bg: '#000000', fg: WHITE }
}

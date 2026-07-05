// US phone helpers shared by the subscribe forms (live formatting) and the zod
// schema (validation + canonical storage). Pure + dependency-free so it runs in
// client components, server routes, and tests alike.

/** Digits only, dropping a leading US country code (1) when 11 digits. */
export function nationalDigits(input: string): string {
  const digits = (input ?? '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1)
  return digits
}

// Valid NANP number: 10 digits, area code and exchange each starting 2–9.
const US_PHONE_RE = /^[2-9]\d{2}[2-9]\d{6}$/

export function isValidUsPhone(input: string): boolean {
  return US_PHONE_RE.test(nationalDigits(input))
}

/**
 * Progressive formatter for typing — always returns a partial/complete
 * `(XXX) XXX-XXXX` for whatever digits have been entered so far. Extra digits
 * beyond 10 are dropped so the field can't overflow.
 */
export function formatUsPhone(input: string): string {
  const d = nationalDigits(input).slice(0, 10)
  if (d.length === 0) return ''
  if (d.length < 4) return `(${d}`
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

/** Canonical stored form: `(XXX) XXX-XXXX` when valid, otherwise null. */
export function normalizeUsPhone(input: string): string | null {
  if (!isValidUsPhone(input)) return null
  return formatUsPhone(input)
}

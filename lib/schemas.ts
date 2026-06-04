import { z } from 'zod'

// Shared zod schemas for validating untrusted request bodies at the API
// boundary. Helpers coerce non-string input to '' so a missing field and an
// empty field produce the same (intended) "required" message rather than a
// generic type error — preserving the routes' prior behavior.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const trimmed = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

// Required, non-empty string with a custom message for empty/missing.
const requiredStr = (message: string) => z.preprocess(trimmed, z.string().min(1, message))
// Optional string — '' when missing/non-string.
const optionalStr = z.preprocess(trimmed, z.string())
// Strict boolean — true only when the value is literally `true`.
const strictBool = z.preprocess((v) => v === true, z.boolean())

// ---------------------------------------------------------------------------
// POST /api/subscribe
// ---------------------------------------------------------------------------
// Email presence is enforced here; format validation stays in
// subscribeToPromotions so its 'invalid_email' path/message is preserved.
export const subscribeBodySchema = z.object({
  // Two-tier message: empty → "required", non-empty but malformed → "valid".
  // Same end result the server produced before (subscribeToPromotions still
  // re-checks as defense in depth), and now usable for client-side validation.
  email: z.preprocess(
    trimmed,
    z
      .string()
      .min(1, 'Email is required.')
      .regex(EMAIL_RE, 'Please enter a valid email address.'),
  ),
  name: optionalStr,
  phone: optionalStr,
  source: optionalStr,
  confirmResubscribe: strictBool,
})
export type SubscribeBody = z.infer<typeof subscribeBodySchema>

// ---------------------------------------------------------------------------
// POST /api/checkout
// ---------------------------------------------------------------------------
// Shape/coercion/required-field validation. The mode-dependent wash-value
// check (pack needs a valid package, single a valid wash value) stays in the
// route because it drives pricing and reads cleanest as an explicit check.
export const checkoutBodySchema = z.object({
  // Anything that isn't 'single' falls back to 'pack', matching prior logic.
  mode: z.enum(['single', 'pack']).catch('pack'),
  package: optionalStr,
  // Sent as a number from the client; normalized to a wash-value string later.
  washValue: z.union([z.string(), z.number()]).optional(),
  quantity: z
    .preprocess((v) => {
      const n = Number(v)
      return Number.isFinite(n) ? n : 1
    }, z.number())
    .transform((n) => Math.max(1, Math.min(20, n))),
  email: z.preprocess(trimmed, z.string().regex(EMAIL_RE, 'Valid email required')),
  name: requiredStr('Name required'),
  phone: requiredStr('Phone required'),
  mailingLine1: requiredStr('Complete mailing address required'),
  mailingLine2: optionalStr,
  mailingCity: requiredStr('Complete mailing address required'),
  mailingState: z
    .preprocess(trimmed, z.string().min(1, 'Complete mailing address required'))
    .transform((s) => s.toUpperCase()),
  mailingPostalCode: requiredStr('Complete mailing address required'),
  mailingListSubscribed: strictBool,
})
export type CheckoutBody = z.infer<typeof checkoutBodySchema>

// First validation message from a failed safeParse, for a 400 response.
export function firstIssueMessage(error: z.ZodError, fallback = 'Invalid request.'): string {
  return error.issues[0]?.message ?? fallback
}

import { NextResponse } from 'next/server'
import { subscribeToPromotions, type SubscribeOutcome } from '@/lib/promotions'

export const runtime = 'nodejs'

type Body = {
  email?: unknown
  name?: unknown
  phone?: unknown
  source?: unknown
  confirmResubscribe?: unknown
}

const asString = (v: unknown): string => (typeof v === 'string' ? v : '')

// Human-readable confirmation per outcome, returned alongside the machine
// `outcome` so clients can show it directly or map their own copy.
const OUTCOME_MESSAGES: Record<SubscribeOutcome, string> = {
  subscribed: "You're on the list — thanks for subscribing!",
  confirm_resubscribe: 'You previously unsubscribed. Want to resubscribe?',
  resubscribed: "Welcome back — you're resubscribed.",
  already_subscribed: "You're already on our list — thanks!",
}

export async function POST(req: Request) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const email = asString(body.email)
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const result = await subscribeToPromotions({
    email,
    name: asString(body.name) || null,
    phone: asString(body.phone) || null,
    source: asString(body.source) || 'website',
    confirmResubscribe: body.confirmResubscribe === true,
  })

  if (!result.ok) {
    if (result.reason === 'invalid_email') {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 },
      )
    }
    if (result.reason === 'unconfigured') {
      // Ops misconfig, not the user's fault — don't surface a 500.
      return NextResponse.json(
        { error: 'Signups are temporarily unavailable. Please try again later.' },
        { status: 503 },
      )
    }
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    outcome: result.outcome,
    message: OUTCOME_MESSAGES[result.outcome],
  })
}

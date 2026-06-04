import { NextResponse } from 'next/server'
import { subscribeToPromotions, type SubscribeOutcome } from '@/lib/promotions'
import { subscribeBodySchema, firstIssueMessage } from '@/lib/schemas'

export const runtime = 'nodejs'

// Human-readable confirmation per outcome, returned alongside the machine
// `outcome` so clients can show it directly or map their own copy.
const OUTCOME_MESSAGES: Record<SubscribeOutcome, string> = {
  subscribed: "You're on the list — thanks for subscribing!",
  confirm_resubscribe: 'You previously unsubscribed. Want to resubscribe?',
  resubscribed: "Welcome back — you're resubscribed.",
  already_subscribed: "You're already on our list — thanks!",
}

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = subscribeBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 })
  }
  const body = parsed.data

  const result = await subscribeToPromotions({
    email: body.email,
    name: body.name || null,
    phone: body.phone || null,
    source: body.source || 'website',
    confirmResubscribe: body.confirmResubscribe,
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

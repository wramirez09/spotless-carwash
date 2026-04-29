import { revalidatePath } from 'next/cache'
import { parseBody } from 'next-sanity/webhook'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_WEBHOOK_SECRET
  if (!secret) {
    return new Response('Missing SANITY_WEBHOOK_SECRET', { status: 500 })
  }

  const { isValidSignature } = await parseBody(request, secret)
  if (!isValidSignature) {
    return new Response('Invalid signature', { status: 401 })
  }

  revalidatePath('/')

  return Response.json({ message: 'Revalidated' }, { status: 200 })
}

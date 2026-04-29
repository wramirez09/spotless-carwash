import { defineEnableDraftMode } from 'next-sanity/draft-mode'
import { sanityClient } from '@/lib/sanity'

const token = process.env.SANITY_API_READ_TOKEN

if (!token) {
  // Fail fast in module init so missing config is obvious in dev logs.
  console.warn(
    '[draft-mode] Missing SANITY_API_READ_TOKEN — Sanity Presentation will be unable to enter draft mode.',
  )
}

export const { GET } = defineEnableDraftMode({
  client: sanityClient.withConfig({ token, useCdn: false }),
})

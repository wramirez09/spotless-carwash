import { draftMode } from 'next/headers'
import { sanityClient } from './sanity'

type FetchOptions = {
  params?: Record<string, unknown>
  revalidate?: number | false
  tags?: string[]
}

const readToken = process.env.SANITY_API_READ_TOKEN

/**
 * Server-side fetch wrapper. Returns null on missing config or network errors
 * so callers can fall back to defaults instead of crashing the page.
 *
 * In draft mode (Sanity Presentation), uses `previewDrafts` perspective so
 * unpublished changes show up immediately. Production keeps `published`.
 */
export async function sanityFetch<T>(query: string, opts: FetchOptions = {}): Promise<T | null> {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) return null

  let isDraft = false
  try {
    isDraft = (await draftMode()).isEnabled
  } catch {
    // draftMode() throws outside a request context (e.g., during static gen).
  }

  const client =
    isDraft && readToken
      ? sanityClient.withConfig({
          token: readToken,
          perspective: 'previewDrafts',
          useCdn: false,
        })
      : sanityClient

  try {
    return await client.fetch<T>(query, opts.params ?? {}, {
      next: {
        revalidate: isDraft ? 0 : opts.revalidate ?? 60,
        tags: opts.tags,
      },
    })
  } catch (err) {
    console.warn('[sanity] fetch failed:', err)
    return null
  }
}

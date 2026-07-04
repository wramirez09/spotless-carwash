import { createClient } from 'next-sanity'

// Fall back to the (public) project ID so an empty env doesn't hard-crash every
// page in local dev. The real value still comes from NEXT_PUBLIC_SANITY_PROJECT_ID
// per environment; this is the same ID already committed in sanity.config.ts.
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '60he0627'
const dataset = 'production'
const apiVersion = '2024-01-01'
const studioUrl = '/studio'

const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV
const isProduction = vercelEnv === 'production'
// Stega encoding powers Presentation's click-to-edit overlay. We turn it on
// only for Vercel preview deployments where editors review unpublished
// content. Production keeps it OFF so public users never see encoded markers;
// local development keeps it OFF so signed-out devs aren't shown overlays.
// Set NEXT_PUBLIC_VERCEL_ENV=preview locally if you need to test the overlay.
const stegaEnabled = vercelEnv === 'preview'

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: isProduction,
  perspective: 'published',
  stega: stegaEnabled ? { enabled: true, studioUrl } : { enabled: false },
})

export { projectId, dataset, apiVersion, studioUrl }

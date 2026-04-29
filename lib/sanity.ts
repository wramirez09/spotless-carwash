import { createClient } from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = 'production'
const apiVersion = '2024-01-01'
const studioUrl = '/studio'

const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV
const isProduction = vercelEnv === 'production'
// Stega encoding powers Presentation's click-to-edit overlay. We turn it on
// for every non-production environment (preview + local dev) so editing works
// while the studio is being authored against. Production keeps it OFF so
// public users never see the encoded markers.
const stegaEnabled = !isProduction

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: isProduction,
  perspective: 'published',
  stega: stegaEnabled ? { enabled: true, studioUrl } : { enabled: false },
})

export { projectId, dataset, apiVersion, studioUrl }

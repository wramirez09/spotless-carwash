import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { presentationTool } from 'sanity/presentation'
import { schemaTypes, SINGLETON_TYPES } from './sanity/schemas'
import { structure } from './sanity/structure'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = 'production'

function buildPreviewOrigin(): string {
  // Studio runs in the browser via NextStudio. Whatever domain the user is
  // viewing the studio on IS the domain they want to preview — using it
  // guarantees same-origin between studio iframe and preview iframe (no
  // CORS / postMessage issues, no env-var dependency).
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  // Server-side fallback (used during build / SSR of the studio shell).
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_VERCEL_URL?.trim() ||
    ''
  if (!raw) return 'http://localhost:3000'
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, '')
  if (raw.includes('.')) return `https://${raw.replace(/\/+$/, '')}`
  return 'http://localhost:3000'
}

const previewOrigin = buildPreviewOrigin()

const SINGLETON_TYPE_SET = new Set<string>(SINGLETON_TYPES)

export default defineConfig({
  name: 'spotless-carwash',
  title: 'Spotless Carwash',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [
    structureTool({ structure }),
    presentationTool({
      previewUrl: {
        origin: previewOrigin,
        previewMode: { enable: '/api/draft' },
      },
    }),
  ],
  schema: {
    types: schemaTypes,
    // Hide "create new" + duplicate actions on singletons; one doc per type only.
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETON_TYPE_SET.has(schemaType)),
  },
  document: {
    actions: (input, { schemaType }) =>
      SINGLETON_TYPE_SET.has(schemaType)
        ? input.filter(({ action }) => action !== 'duplicate' && action !== 'unpublish' && action !== 'delete')
        : input,
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global'
        ? prev.filter((tpl) => !SINGLETON_TYPE_SET.has(tpl.templateId))
        : prev,
  },
})

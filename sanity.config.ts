import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { presentationTool } from 'sanity/presentation'
import { schemaTypes, SINGLETON_TYPES } from './sanity/schemas'
import { structure } from './sanity/structure'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = 'production'

const previewOrigin =
  typeof process.env.NEXT_PUBLIC_VERCEL_URL === 'string' && process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : 'http://localhost:3000'

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

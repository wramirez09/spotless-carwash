/**
 * Uploads the local Locations-section card photos to Sanity and patches each
 * location document's `photo` field so the homepage cards can be edited via
 * Sanity Studio.
 *
 * Run with:
 *   SANITY_WRITE_TOKEN=<token> npx tsx scripts/upload-location-photos.ts
 */

import { createClient } from '@sanity/client'
import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const token = process.env.SANITY_WRITE_TOKEN

if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
if (!token) throw new Error('Missing SANITY_WRITE_TOKEN (Sanity Manage → API → Tokens, Editor role)')

const client = createClient({
  projectId,
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

type Entry = {
  slug: 'roosevelt-rd' | 'madison-st'
  file: string
  alt: string
}

const entries: Entry[] = [
  {
    slug: 'roosevelt-rd',
    file: 'public/images/location-exterior.jpg',
    alt: 'Roosevelt Rd storefront exterior',
  },
  {
    slug: 'madison-st',
    file: 'public/images/madison-loaction.jpg',
    alt: 'Madison St storefront exterior',
  },
]

async function uploadAndPatch({ slug, file, alt }: Entry) {
  const abs = resolve(file)
  const buf = await readFile(abs)
  const asset = await client.assets.upload('image', buf, { filename: basename(abs) })
  console.log(`✓ Uploaded ${file} → ${asset._id}`)

  const docId = `location-${slug}`
  await client
    .patch(docId)
    .set({
      photo: {
        _type: 'imageWithAlt',
        alt,
        asset: { _type: 'reference', _ref: asset._id },
      },
    })
    .commit()
  console.log(`✓ Patched ${docId}.photo`)
}

async function main() {
  for (const entry of entries) {
    await uploadAndPatch(entry)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

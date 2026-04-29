import type { Metadata } from 'next'
import LocationPage from '@/src/components/LocationPage'
import LocalBusinessSchema from '@/src/components/seo/LocalBusinessSchema'
import { locations } from '@/src/data/locations'
import { sanityFetch } from '@/lib/sanityFetch'

const loc = locations.find((l) => l.slug === 'madison-st')!

const META_QUERY = `*[_type == "location" && slug.current == $slug][0]{ metaTitle, metaDescription }`

export async function generateMetadata(): Promise<Metadata> {
  const data = await sanityFetch<{ metaTitle?: string; metaDescription?: string }>(
    META_QUERY,
    { params: { slug: loc.slug } },
  )
  return {
    title: data?.metaTitle ?? `${loc.name} · Touchless Car Wash`,
    description:
      data?.metaDescription ??
      `Spotless Carwash on Madison Street in Forest Park, IL. Touchless automatic bays and self-serve wand bays. Open 7am–10pm daily. ${loc.street}.`,
  }
}

export default function Page() {
  return (
    <>
      <LocalBusinessSchema location={loc} />
      <LocationPage location={loc} />
    </>
  )
}

import type { Metadata } from 'next'
import LocationPage from '@/src/components/LocationPage'
import LocalBusinessSchema from '@/src/components/seo/LocalBusinessSchema'
import { locations } from '@/src/data/locations'
import { sanityFetch } from '@/lib/sanityFetch'

const loc = locations.find((l) => l.slug === 'roosevelt-rd')!

const META_QUERY = `*[_type == "location" && slug.current == $slug][0]{ metaTitle, metaDescription }`
const LOCATION_DOC_QUERY = `*[_type == "location" && slug.current == $slug][0]{ photo, pageDescription, winterAddon }`

export async function generateMetadata(): Promise<Metadata> {
  const data = await sanityFetch<{ metaTitle?: string; metaDescription?: string }>(
    META_QUERY,
    { params: { slug: loc.slug } },
  )
  return {
    title: data?.metaTitle ?? `${loc.name} · Heated Touchless Car Wash`,
    description:
      data?.metaDescription ??
      `Spotless Carwash on Roosevelt Road in Forest Park, IL. Heated, enclosed automatic bays for winter washing plus self-serve wand bays. Open 7am–10pm daily. ${loc.street}.`,
  }
}

export default async function Page() {
  const data = await sanityFetch<{
    photo?: import('@/lib/sanityImage').ImageWithAlt | null
    pageDescription?: string | null
    winterAddon?: string | null
  }>(LOCATION_DOC_QUERY, { params: { slug: loc.slug } })
  const merged = {
    ...loc,
    photo: data?.photo ?? null,
    pageDescription: data?.pageDescription ?? null,
    winterAddon: data?.winterAddon ?? null,
  }
  return (
    <>
      <LocalBusinessSchema location={merged} />
      <LocationPage location={merged} />
    </>
  )
}

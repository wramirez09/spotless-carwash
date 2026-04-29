import type { Metadata } from 'next'
import LocationPage from '@/src/components/LocationPage'
import LocalBusinessSchema from '@/src/components/seo/LocalBusinessSchema'
import { locations } from '@/src/data/locations'

const loc = locations.find((l) => l.slug === 'madison-st')!

export const metadata: Metadata = {
  title: `${loc.name} · Touchless Car Wash`,
  description: `Spotless Carwash on Madison Street in Forest Park, IL. Touchless automatic bays and self-serve wand bays. Open 7am–10pm daily. ${loc.street}.`,
}

export default function Page() {
  return (
    <>
      <LocalBusinessSchema location={loc} />
      <LocationPage location={loc} />
    </>
  )
}

import type { Metadata } from 'next'
import LocationPage from '@/src/components/LocationPage'
import LocalBusinessSchema from '@/src/components/seo/LocalBusinessSchema'
import { locations } from '@/src/data/locations'

const loc = locations.find((l) => l.slug === 'roosevelt-rd')!

export const metadata: Metadata = {
  title: `${loc.name} · Heated Touchless Car Wash`,
  description: `Spotless Carwash on Roosevelt Road in Forest Park, IL. Heated, enclosed automatic bays for winter washing plus self-serve wand bays. Open 24/7. ${loc.street}.`,
}

export default function Page() {
  return (
    <>
      <LocalBusinessSchema location={loc} />
      <LocationPage location={loc} />
    </>
  )
}

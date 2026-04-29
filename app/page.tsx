import Hero from '@/src/components/Hero'
import Washes from '@/src/components/Washes'
import How from '@/src/components/How'
import Locations from '@/src/components/Locations'
import Bays from '@/src/components/Bays'
import Testimonial from '@/src/components/Testimonial'
import Instructions from '@/src/components/Instructions'
import OtherServices from '@/src/components/OtherServices'
import Tokens from '@/src/components/Tokens'
import Email from '@/src/components/Email'
import OrganizationSchema from '@/src/components/seo/OrganizationSchema'
import LocalBusinessSchema from '@/src/components/seo/LocalBusinessSchema'
import OfferCatalogSchema from '@/src/components/seo/OfferCatalogSchema'
import HowToSchema from '@/src/components/seo/HowToSchema'
import { locations } from '@/src/data/locations'

export default function HomePage() {
  return (
    <>
      <OrganizationSchema />
      {locations.map((loc) => (
        <LocalBusinessSchema key={loc.slug} location={loc} />
      ))}
      <OfferCatalogSchema />
      <HowToSchema />

      <Hero />
      <Washes />
      <How />
      <Locations />
      <Bays />
      <Testimonial />
      <Instructions />
      <OtherServices />
      <Tokens />
      <Email />
    </>
  )
}

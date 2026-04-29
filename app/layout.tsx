import type { Metadata } from 'next'
import { Archivo, Archivo_Black, Barlow_Condensed, JetBrains_Mono } from 'next/font/google'
import { draftMode, headers } from 'next/headers'
import VisualEditing from 'next-sanity/visual-editing/client-component'
import Nav from '@/src/components/Nav'
import Footer from '@/src/components/Footer'
import ExitPreviewButton from '@/src/components/ExitPreviewButton'
import { sanityFetch } from '@/lib/sanityFetch'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  variable: '--font-archivo-black',
  weight: '400',
  display: 'swap',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  weight: '700',
  style: 'italic',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '600'],
  display: 'swap',
})

const isProduction = process.env.VERCEL_ENV === 'production'

// TODO(domain): set metadataBase to the production URL once finalized so OG and canonical
// tags emit absolute URLs (e.g. new URL('https://spotlesscarwash.com')).

const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  titleDefault, titleTemplate, description, keywords,
  ogTitle, ogDescription, twitterTitle, twitterDescription
}`

const SITE_FALLBACK = {
  titleDefault: 'Spotless Carwash · Touchless Car Wash · Forest Park, IL',
  titleTemplate: '%s · Spotless Carwash',
  description:
    "Forest Park's touchless car wash. Two locations with heated automatic bays for winter and self-serve wand bays. Open 7am–10pm daily.",
  keywords: [
    'car wash',
    'touchless car wash',
    'self-serve car wash',
    'Forest Park IL',
    'Forest Park car wash',
    'heated car wash',
    'wash tokens',
    'apple pay car wash',
    'tap to pay car wash',
  ],
  ogTitle: 'Spotless Carwash · Touchless Car Wash · Forest Park, IL',
  ogDescription:
    'Two Forest Park locations, heated automatic bays, self-serve wand bays. Open 7am–10pm daily.',
  twitterTitle: 'Spotless Carwash · Touchless Car Wash · Forest Park, IL',
  twitterDescription:
    'Two Forest Park locations, heated automatic bays, self-serve wand bays. Open 7am–10pm daily.',
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await sanityFetch<Partial<typeof SITE_FALLBACK>>(SITE_SETTINGS_QUERY)
  const s = { ...SITE_FALLBACK, ...(data ?? {}) }
  return {
    title: { default: s.titleDefault, template: s.titleTemplate },
    description: s.description,
    applicationName: 'Spotless Carwash',
    keywords: s.keywords,
    openGraph: {
      title: s.ogTitle,
      description: s.ogDescription,
      siteName: 'Spotless Carwash',
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: s.twitterTitle,
      description: s.twitterDescription,
    },
    robots: isProduction
      ? { index: true, follow: true }
      : { index: false, follow: false },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled: isDraft } = await draftMode()
  const pathname = (await headers()).get('x-pathname') ?? ''
  const isStudio = pathname.startsWith('/studio')

  return (
    <html
      lang="en"
      className={`${archivo.variable} ${archivoBlack.variable} ${barlowCondensed.variable} ${jetbrains.variable}`}
    >
      <body className="bg-paper text-ink font-sans">
        {!isStudio && <Nav />}
        <main>{children}</main>
        {!isStudio && <Footer />}
        {isDraft && (
          <>
            <VisualEditing />
            <ExitPreviewButton />
          </>
        )}
      </body>
    </html>
  )
}

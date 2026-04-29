import type { Metadata } from 'next'
import { Archivo, Archivo_Black, JetBrains_Mono } from 'next/font/google'
import Nav from '@/src/components/Nav'
import Footer from '@/src/components/Footer'
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

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '600'],
  display: 'swap',
})

const isProduction = process.env.VERCEL_ENV === 'production'

// TODO(domain): set metadataBase to the production URL once finalized so OG and canonical
// tags emit absolute URLs (e.g. new URL('https://spotlesscarwash.com')).
export const metadata: Metadata = {
  title: {
    default: 'Spotless Carwash · Touchless Car Wash · Forest Park, IL',
    template: '%s · Spotless Carwash',
  },
  description:
    "Forest Park's touchless car wash. Two locations with heated automatic bays for winter and self-serve wand bays. Open 7am–10pm daily.",
  applicationName: 'Spotless Carwash',
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
  openGraph: {
    title: 'Spotless Carwash · Touchless Car Wash · Forest Park, IL',
    description:
      "Two Forest Park locations, heated automatic bays, self-serve wand bays. Open 7am–10pm daily.",
    siteName: 'Spotless Carwash',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spotless Carwash · Touchless Car Wash · Forest Park, IL',
    description:
      "Two Forest Park locations, heated automatic bays, self-serve wand bays. Open 7am–10pm daily.",
  },
  robots: isProduction
    ? { index: true, follow: true }
    : { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${archivoBlack.variable} ${jetbrains.variable}`}
    >
      <body className="bg-paper text-ink font-sans">
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}

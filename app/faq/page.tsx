import type { Metadata } from 'next'
import { faqs as fallbackFaqs, type FAQ } from '@/src/data/faq'
import FAQPageSchema from '@/src/components/seo/FAQPageSchema'
import BreadcrumbSchema from '@/src/components/seo/BreadcrumbSchema'
import { sanityFetch } from '@/lib/sanityFetch'

const FAQ_QUERY = `{
  "page": *[_type == "faqPage"][0]{
    eyebrow, metaTitle, metaDescription, heading, subhead
  },
  "faqs": *[_type == "faqEntry"] | order(order asc, _createdAt asc){ q, a }
}`

const FALLBACK = {
  eyebrow: 'Frequently asked',
  metaTitle: 'Self-Serve & Touchless Car Wash FAQ · Forest Park IL',
  metaDescription:
    'Answers to common questions about Spotless Carwash in Forest Park, IL — how touchless and self-serve bays work, token pricing, hours, and heated winter bays.',
  heading: 'Questions, **answered**.',
  subhead:
    "Everything you might want to know before you pull up — touchless vs. self-serve, hours, heated bays, tokens, and what to do once you're in the bay.",
}

type FAQPageData = typeof FALLBACK

async function loadFaq() {
  const data = await sanityFetch<{ page?: Partial<FAQPageData>; faqs?: FAQ[] }>(FAQ_QUERY)
  const page = { ...FALLBACK, ...(data?.page ?? {}) }
  const faqs = data?.faqs?.length ? data.faqs : fallbackFaqs
  return { page, faqs }
}

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await loadFaq()
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: '/faq' },
  }
}

export default async function Page() {
  const { page, faqs } = await loadFaq()

  // Render highlight markers in heading without importing the helper here
  // (small inline expression keeps page self-contained).
  const headingParts = page.heading.split(/\*\*(.+?)\*\*/)

  return (
    <>
      <FAQPageSchema />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'FAQ' },
        ]}
      />

      <header
        className="text-white pt-14 md:pt-20 pb-12 md:pb-16"
        style={{ background: 'linear-gradient(180deg,#1947c9 0%,#1B4FD9 100%)' }}
      >
        <div className="max-w-[860px] mx-auto px-5 md:px-7">
          <div className="inline-flex items-center gap-2.5 text-xs font-bold tracking-[0.18em] uppercase text-blue-100 mb-6">
            <span
              className="w-2 h-2 rounded-full bg-yellow-400"
              style={{ boxShadow: '0 0 0 4px rgba(255,217,61,.18)' }}
            ></span>
            {page.eyebrow}
          </div>
          <h1 className="display text-[48px] sm:text-[72px] md:text-[88px] leading-[0.92]">
            {headingParts.map((p, i) =>
              i % 2 === 1 ? (
                <em key={i} className="text-yellow-400">
                  {p}
                </em>
              ) : (
                p
              ),
            )}
          </h1>
          <p className="mt-6 text-lg text-blue-100 leading-relaxed max-w-[640px]">{page.subhead}</p>
        </div>
      </header>

      <section className="py-14 md:py-20">
        <div className="max-w-[860px] mx-auto px-5 md:px-7 flex flex-col gap-7">
          {faqs.map((f) => (
            <article key={f.q} className="bg-white border border-line rounded-2xl p-7">
              <h2 className="display text-[24px] sm:text-[28px] m-0 mb-3 text-ink">{f.q}</h2>
              <p className="text-[#445273] leading-relaxed m-0">{f.a}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

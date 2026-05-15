import type { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanityFetch'

type Section = { heading: string; paragraphs: { text: string }[] }

type Copy = {
  metaTitle: string
  metaDescription: string
  kickerCategory: string
  kickerLabel: string
  heading: string
  lastUpdatedLabel: string
  lastUpdatedDate: string
  intro: string
  sections: Section[]
}

const FALLBACK: Copy = {
  metaTitle: 'Privacy Policy',
  metaDescription:
    'How Spotless Carwash collects, uses, and protects information from visitors and customers.',
  kickerCategory: 'LEGAL /',
  kickerLabel: 'Privacy',
  heading: 'Privacy Policy',
  lastUpdatedLabel: 'Last updated:',
  lastUpdatedDate: 'May 2026',
  intro:
    'This privacy policy describes how Spotless Carwash (“we,” “us”) collects and uses information when you visit our website at spotlesscarwash.com or our two locations in Forest Park, IL.',
  sections: [
    {
      heading: 'What we collect',
      paragraphs: [
        {
          text:
            '**Email addresses** when you subscribe to our newsletter. We use this only to send the discounts, seasonal promos, and occasional free wash codes described at signup. You can unsubscribe at any time using the link in any email.',
        },
        {
          text:
            '**Token purchase information** when you buy wash tokens online. Payment is processed by our third-party payment provider (currently PayPal). We do not store your full card or payment account details on this site.',
        },
        {
          text:
            '**Standard analytics** like pages visited and approximate location (country/city), gathered from server logs and any analytics tools we run. We use this only to understand how the site is used and improve it.',
        },
      ],
    },
    {
      heading: "What we don't do",
      paragraphs: [
        {
          text:
            'We do not sell your information to third parties. We do not share your email address with anyone outside our newsletter delivery service. We do not track you across other websites.',
        },
      ],
    },
    {
      heading: 'Cookies',
      paragraphs: [
        {
          text:
            'This site uses standard cookies for session handling and any analytics tools we run. You can disable cookies in your browser settings; the site will still work, though some features may be limited.',
        },
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [
        {
          text:
            "You can ask us to delete the email address and any other information we hold about you at any time. Email [info@spotlessautowash.com](mailto:info@spotlessautowash.com) and we'll take care of it within a reasonable timeframe.",
        },
      ],
    },
    {
      heading: 'Updates',
      paragraphs: [
        {
          text:
            'We may update this policy from time to time. The “last updated” date at the top will reflect any changes.',
        },
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        {
          text:
            'Questions? Email [info@spotlessautowash.com](mailto:info@spotlessautowash.com) or call [(708) 771-2945](tel:7087712945).',
        },
      ],
    },
  ],
}

const QUERY = `*[_type == "privacyPage"][0]{
  metaTitle, metaDescription,
  kickerCategory, kickerLabel,
  heading, lastUpdatedLabel, lastUpdatedDate,
  intro,
  sections[]{ heading, paragraphs[]{ text } }
}`

async function loadCopy(): Promise<Copy> {
  const data = await sanityFetch<Partial<Copy> | null>(QUERY)
  if (!data) return FALLBACK
  const merged: Copy = { ...FALLBACK }
  for (const [k, v] of Object.entries(data) as [keyof Copy, unknown][]) {
    if (v === null || v === undefined) continue
    if (Array.isArray(v) && v.length === 0) continue
    // @ts-expect-error -- safe per-field copy
    merged[k] = v
  }
  return merged
}

export async function generateMetadata(): Promise<Metadata> {
  const copy = await loadCopy()
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: { canonical: '/privacy' },
  }
}

// Render an inline string supporting **bold** and [label](url) markdown.
function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) out.push(text.slice(lastIndex, m.index))
    if (m[1] !== undefined) {
      out.push(<strong key={`b-${key++}`}>{m[1]}</strong>)
    } else if (m[2] !== undefined && m[3] !== undefined) {
      out.push(
        <a
          key={`a-${key++}`}
          href={m[3]}
          className="text-blue-500 font-semibold underline"
        >
          {m[2]}
        </a>,
      )
    }
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < text.length) out.push(text.slice(lastIndex))
  return out
}

export default async function PrivacyPage() {
  const copy = await loadCopy()
  return (
    <main className="bg-paper py-16 md:py-24">
      <article className="max-w-[760px] mx-auto px-5 md:px-7 prose prose-headings:display prose-headings:font-normal">
        <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2.5">
          <span className="mono text-[#5b6987] font-medium">{copy.kickerCategory}</span> {copy.kickerLabel}
        </div>
        <h1 className="display text-[44px] sm:text-[56px] md:text-[68px] m-0 leading-[1.05] mb-3">
          {copy.heading}
        </h1>
        <p className="text-[#5b6987] text-sm m-0 mb-10">
          {copy.lastUpdatedLabel} {copy.lastUpdatedDate}
        </p>

        <div className="text-[#445273] leading-relaxed space-y-5 text-[16px]">
          <p>{renderInline(copy.intro)}</p>

          {copy.sections.map((section, i) => (
            <div key={i}>
              <h2 className="display text-[24px] mt-10 mb-2">{section.heading}</h2>
              {section.paragraphs.map((p, j) => (
                <p key={j}>{renderInline(p.text)}</p>
              ))}
            </div>
          ))}
        </div>
      </article>
    </main>
  )
}

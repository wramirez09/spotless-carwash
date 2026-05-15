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
  metaTitle: 'Terms of Service',
  metaDescription: 'Terms governing use of the Spotless Carwash website and wash tokens.',
  kickerCategory: 'LEGAL /',
  kickerLabel: 'Terms',
  heading: 'Terms of Service',
  lastUpdatedLabel: 'Last updated:',
  lastUpdatedDate: 'May 2026',
  intro:
    'By using the Spotless Carwash website at spotlesscarwash.com, or by buying or redeeming wash tokens, you agree to these terms.',
  sections: [
    {
      heading: 'Wash tokens',
      paragraphs: [
        {
          text:
            'Spotless wash tokens are prepaid passes for one Ultimate touchless automatic wash each. Tokens never expire and work at both Forest Park locations (Roosevelt Rd and Madison St).',
        },
        {
          text:
            'Tokens are non-refundable and have no cash value. Lost or stolen tokens cannot be replaced. We reserve the right to refuse damaged or counterfeit tokens.',
        },
      ],
    },
    {
      heading: 'Use of the bays',
      paragraphs: [
        {
          text:
            'Customers use our automatic and self-serve bays at their own risk. Please follow posted signage, traffic-light signals, and any instructions from on-site attendants. Pull in only on a green light. We are not responsible for damage caused by failure to follow instructions, ignoring stop signals, or driving with loose roof cargo, antennas, or attachments.',
        },
      ],
    },
    {
      heading: 'Damage claims',
      paragraphs: [
        {
          text:
            'If you believe your vehicle was damaged at one of our facilities, please notify the on-duty attendant immediately, before leaving the lot, so we can document the situation. Claims raised after leaving the lot are difficult to verify and may not be honored.',
        },
      ],
    },
    {
      heading: 'Hours and availability',
      paragraphs: [
        {
          text:
            'Bays are open 7am–10pm daily but may close temporarily for maintenance, weather, or repairs. We do our best to post any closures on-site and on social media.',
        },
      ],
    },
    {
      heading: 'Website content',
      paragraphs: [
        {
          text:
            'Pricing, packages, and other website information are subject to change. We try to keep everything current but the on-site posted pricing at the wash is the authoritative source.',
        },
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        {
          text:
            'Questions about these terms? Email [info@spotlessautowash.com](mailto:info@spotlessautowash.com) or call [(708) 771-2945](tel:7087712945).',
        },
      ],
    },
  ],
}

const QUERY = `*[_type == "termsPage"][0]{
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
    alternates: { canonical: '/terms' },
  }
}

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

export default async function TermsPage() {
  const copy = await loadCopy()
  return (
    <main className="bg-paper py-16 md:py-24">
      <article className="max-w-[760px] mx-auto px-5 md:px-7">
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

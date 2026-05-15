import type { ReportSection } from '@/lib/reportRender'
import { pt } from '@/lib/reportRender'

type ProseBlock = ReturnType<typeof pt>

const p = (text: string, key: string): ProseBlock => pt(text, key)

export type SeoAuditCopy = {
  metaTitle: string
  metaDescription: string
  kicker: string
  headline: string
  siteUrl: string
  dateLabel: string
  scoreLabel: string
  gradeSummary: ProseBlock[]
  headerNote: { text: string; emphasis: 'italic' | 'plain' | 'boldItalic' }
  sections: ReportSection[]
  footerLine: string
}

export const seoAuditFallback: SeoAuditCopy = {
  metaTitle: 'SEO Audit · Spotless Carwash',
  metaDescription:
    'Internal SEO content audit for Spotless Carwash — title tags, schema, content gaps, and prioritized recommendations.',
  kicker: 'Confidential · Client Review',
  headline: 'SEO Content Audit',
  siteUrl: 'https://spotless-carwash-git-main-center-point-digital.vercel.app/',
  dateLabel: 'Date: 2026-05-08',
  scoreLabel: 'SEO Health Score: 70/100',
  gradeSummary: [
    p(
      '**Grade: B–** Strong foundation (titles, descriptions, schema, sitemap exist and are mostly well-formed). Real wins are immediate. Bigger gaps are in canonicalization, social/OG metadata, and content depth (no blog/educational layer).',
      'gs1',
    ),
  ],
  headerNote: {
    text: '**Note re: prior audit.** The earlier `/market audit` flagged "No visible LocalBusiness schema / structured data" as an issue. After inspecting the rendered HTML directly, that finding was **incorrect**. The site actually ships extensive JSON-LD: `AutoWash` (a LocalBusiness sub-type), `Organization`, `HowTo`, `Service`, `OfferCatalog`, `Offer`, `OpeningHoursSpecification`, `PostalAddress`, `City`, plus `FAQPage` schema on `/faq`. This is one of the *strongest* parts of the site\'s SEO foundation, not a gap. Updating the mental model.',
    emphasis: 'plain',
  },
  sections: [
    {
      _key: 'onpage',
      heading: 'On-Page SEO Checklist',
      widgets: [
        {
          _type: 'reportSubsection',
          _key: 'title',
          heading: 'Title Tag',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'titletable',
              headers: ['Page', 'Status', 'Title', 'Length'],
              rows: [
                { cells: ['Homepage', '✅ Pass', '`Spotless Carwash · Touchless Car Wash · Forest Park, IL`', '54'] },
                { cells: ['Roosevelt Rd', '⚠️ Needs Work', '`Roosevelt Rd · Spotless Carwash · Forest Park, IL · Spotless Carwash`', '67'] },
                { cells: ['Madison St', '⚠️ Needs Work', '(likely same pattern as Roosevelt — title template appending brand twice)', '~67'] },
                { cells: ['FAQ', '✅ Pass', '`FAQ · Touchless & Self-Serve Car Wash Questions · Spotless Carwash`', '65'] },
              ],
            },
            {
              _type: 'reportProse',
              _key: 'titleprose',
              body: [
                p(
                  '**Issue: location page titles double up the brand name.** The site config has both a per-page title (e.g. "Roosevelt Rd · Spotless Carwash · Forest Park, IL") *and* a `titleTemplate` of `%s · Spotless Carwash` that appends "Spotless Carwash" again. Result: `Roosevelt Rd · Spotless Carwash · Forest Park, IL · Spotless Carwash`. Pushes title past 60 chars and looks odd in SERPs.',
                  't1',
                ),
                p(
                  '**Recommended fix:** Remove the brand name from the per-page title (let the template append it once), OR drop the global template. Pick one.',
                  't2',
                ),
              ],
            },
            {
              _type: 'reportCode',
              _key: 'titlecode',
              code: `// Pick ONE pattern:
// (a) Per-page title is the SEO target, let template add brand
title: 'Touchless Car Wash on Roosevelt Rd, Forest Park IL'  // → "...· Spotless Carwash"
// (b) Per-page title already contains brand, no template
title: 'Roosevelt Rd · Spotless Carwash · Forest Park, IL'    // titleTemplate: undefined`,
            },
            {
              _type: 'reportProse',
              _key: 'titlerec',
              body: [p('Recommended titles (option a):', 't3')],
            },
            {
              _type: 'reportList',
              _key: 'titlelist',
              style: 'bullet',
              items: [
                'Homepage: `Touchless Car Wash · Forest Park, IL · Spotless Carwash` (lead with keyword, 54)',
                'Roosevelt: `Touchless Car Wash on Roosevelt Rd, Forest Park IL · Spotless Carwash` (60)',
                'Madison: `Touchless Car Wash on Madison St, Forest Park IL · Spotless Carwash` (60)',
                'FAQ: `Self-Serve & Touchless Car Wash FAQ · Forest Park IL · Spotless Carwash` (66 — slightly long, OK)',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'meta',
          heading: 'Meta Description',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'metatable',
              headers: ['Page', 'Status', 'Length', 'Notes'],
              rows: [
                { cells: ['Homepage', '✅ Pass', '137', 'Geo-anchored, mentions touchless + self-serve + heated + hours — strong'] },
                { cells: ['Roosevelt Rd', '✅ Pass', '150', 'Includes street address — excellent for local'] },
                { cells: ['Madison St', '✅ Pass', '(~150)', 'Same pattern'] },
                { cells: ['FAQ', '✅ Pass', '157', 'Strong; right at ceiling'] },
              ],
            },
            {
              _type: 'reportProse',
              _key: 'metaprose',
              body: [
                p(
                  'All meta descriptions are well-written: keyword-anchored, contain an implicit value prop, end with hours or address. No major issues. Minor opportunity: add a CTA verb to the homepage description.',
                  'm1',
                ),
                p('**Suggested homepage description:**', 'm2'),
              ],
            },
            {
              _type: 'reportQuote',
              _key: 'metaquote',
              emphasis: 'italic',
              text:
                '"Forest Park\'s touchless car wash since the \'90s. Two locations, heated automatic bays for winter, self-serve wand bays — open 7am–10pm daily. Plan your wash." (155)',
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'headings',
          heading: 'Heading Hierarchy',
          widgets: [
            {
              _type: 'reportProse',
              _key: 'hp',
              body: [
                p('**Homepage H1:** `Spotless Carwash — keep it clean.`', 'h1'),
                p(
                  '**Issue:** The H1 leads with the brand name and the tagline — neither contains the primary keyword phrase. For local SEO, the H1 should ideally include "Touchless Car Wash" + city.',
                  'h2',
                ),
                p('**Recommended H1:**', 'h3'),
              ],
            },
            {
              _type: 'reportQuote',
              _key: 'hq1',
              emphasis: 'italic',
              text: '"Forest Park\'s Touchless Car Wash — Spotless Carwash" (or variations)',
            },
            {
              _type: 'reportProse',
              _key: 'hp2',
              body: [
                p('**Roosevelt H1:** `Spotless Carwash on Roosevelt Rd` ✅ — geo-anchored, OK.', 'h4'),
                p('**Madison H1:** Same pattern ✅', 'h5'),
                p("**FAQ H1:** `Questions, answered.` ⚠️ — too generic; doesn't include any keyword.", 'h6'),
                p('**Recommended FAQ H1:** *"Spotless Carwash FAQ — touchless, self-serve, tokens, hours"* or *"Touchless & Self-Serve Car Wash Questions"*', 'h7'),
                p('**H2 structure:** Strong. Section headlines on the homepage are clear and topical:', 'h8'),
              ],
            },
            {
              _type: 'reportList',
              _key: 'h2list',
              style: 'bullet',
              items: [
                '"Pull up & watch the lights." (Hero)',
                '"Four ways to make your car shine." (Wash packages)',
                '"Two locations. Ten bays. All in Forest Park." (Locations)',
                '"Sit back, or do it yourself." (Bays)',
                '"Nine settings. One clean car." (Self-serve dial)',
                '"Everything else on the lot." (Other services)',
                '"Buy a stack…" (Tokens)',
              ],
            },
            {
              _type: 'reportProse',
              _key: 'hp3',
              body: [
                p(
                  'These read well and are distinct. Minor SEO weakness: no H2 on the homepage explicitly contains "Forest Park" or "touchless" — the keyword density is carried by body copy and schema, not subheads.',
                  'h9',
                ),
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'images',
          heading: 'Image Optimization',
          widgets: [
            {
              _type: 'reportList',
              _key: 'imglist',
              style: 'bullet',
              items: [
                '✅ Using `next/image` with proper `srcSet` and multiple breakpoints — modern, responsive, and the build pipeline will serve WebP/AVIF where supported.',
                '✅ `quality=75` is reasonable for web.',
                '⚠️ **Alt text count is light.** Only 4 alt attributes detected on the homepage. Many image roles are likely background/decorative.',
                '⚠️ **One image filename has a typo:** `madison-loaction.jpg` (should be `madison-location.jpg`). Filenames are a minor SEO signal — descriptive, correct filenames help.',
                '⚠️ **No OpenGraph image** (`og:image`) is set. Social shares will show empty cards on Twitter/X, LinkedIn, Slack, iMessage, Facebook, etc. Twitter card type is `summary_large_image` but no image is provided — **broken**.',
              ],
            },
            {
              _type: 'reportProse',
              _key: 'imgp',
              body: [p('Recommended fixes:', 'i1')],
            },
            {
              _type: 'reportList',
              _key: 'imgrec',
              style: 'number',
              items: [
                'Add an `og:image` (and `twitter:image`) — 1200×630 hero image of the storefront or a wash bay. Set in `app/layout.tsx` Metadata or per-page Metadata.',
                'Audit alt text on every `Image` and ensure each conveys subject + context (e.g. *"Touchless automatic bay interior at Spotless Carwash Roosevelt Rd"* not *"bay"*).',
                'Rename `madison-loaction.jpg` → `madison-location.jpg`.',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'internal',
          heading: 'Internal Linking',
          widgets: [
            {
              _type: 'reportList',
              _key: 'illist',
              style: 'bullet',
              items: [
                '✅ Footer links to `/locations/roosevelt-rd`, `/locations/madison-st`, `/faq`, plus in-page anchors `/#washes`, `/#bays`, `/#tokens`, `/#how`.',
                '✅ Anchor text is descriptive ("Roosevelt Rd", "Madison St", "Wash packages") — no "click here".',
                "⚠️ **Limited deep linking.** Outside the footer, there's little contextual cross-linking. The FAQ doesn't link out to the relevant location/wash pages. The homepage doesn't deep-link to FAQ entries.",
                '❌ **No blog/content cluster** to link from. This is a content depth issue, not strictly a linking issue.',
              ],
            },
            {
              _type: 'reportProse',
              _key: 'ilp',
              body: [
                p(
                  '**Recommendation:** When the blog/content layer goes in (see Strategy section), build a hub-and-spoke: each post links to homepage + nearest location + FAQ entry + tokens.',
                  'il1',
                ),
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'urls',
          heading: 'URL Structure',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'urltable',
              headers: ['URL', 'Status', 'Notes'],
              rows: [
                { cells: ['`/`', '✅ Pass', '—'] },
                { cells: ['`/faq`', '✅ Pass', 'Clean, descriptive'] },
                { cells: ['`/locations/roosevelt-rd`', '✅ Pass', 'Hierarchical, hyphenated, keyword-rich'] },
                { cells: ['`/locations/madison-st`', '✅ Pass', 'Same'] },
              ],
            },
            {
              _type: 'reportProse',
              _key: 'urlp',
              body: [p('URL structure is clean. Lowercase, hyphenated, hierarchical. No issues.', 'u1')],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'canon',
          heading: 'Canonical Tags — ❌ MISSING ON ALL PAGES',
          widgets: [
            {
              _type: 'reportProse',
              _key: 'cp',
              body: [
                p('**Critical:** No `<link rel="canonical">` tag is set on any page. This is a real SEO risk in two scenarios:', 'c1'),
              ],
            },
            {
              _type: 'reportList',
              _key: 'clist',
              style: 'number',
              items: [
                'The Vercel preview URL and the production domain both index without a canonical pointing to the production version. Google could see them as duplicates and split ranking signal.',
                'Any URL parameters appended (e.g. UTM, `?ref=`) generate "duplicate" URLs without a canonical to consolidate.',
              ],
            },
            {
              _type: 'reportProse',
              _key: 'cp2',
              body: [p('**Recommended fix:** In `app/layout.tsx` or via `generateMetadata`, set:', 'c2')],
            },
            {
              _type: 'reportCode',
              _key: 'ccode',
              code: `export const metadata = {
  metadataBase: new URL('https://spotlesscarwash.com'),  // production domain
  alternates: { canonical: '/' },  // override per page as needed
  // ...
}`,
            },
            {
              _type: 'reportProse',
              _key: 'cp3',
              body: [p('Each page should have its own canonical pointing to the canonical version of itself.', 'c3')],
            },
          ],
        },
      ],
    },
    {
      _key: 'eeat',
      heading: 'Content Quality (E-E-A-T)',
      widgets: [
        {
          _type: 'reportTable',
          _key: 'eeattable',
          headers: ['Dimension', 'Score', 'Evidence'],
          rows: [
            { cells: ['**Experience**', 'Weak', "The site doesn't tell stories of operating a car wash for 30+ years. No \"since 199X\", no founder photo, no anecdotes about the heated bays in a particular Chicago winter. The 30-year history is the strongest experiential moat — and it's nearly invisible in the content."] },
            { cells: ['**Expertise**', 'Present', "The FAQ shows category expertise (touchless explanation, self-serve walkthrough, token economics, heated bays). The dial instructions match a real industry standard. But there's no expert voice: no \"we've been washing cars for 30 years and here's what we've learned\" content."] },
            { cells: ['**Authoritativeness**', 'Weak', 'No author/founder bio, no press mentions, no chamber of commerce affiliations, no community involvement, no awards. Yelp ratings ~3.0 ★ at both locations actively suppress authority signals.'] },
            { cells: ['**Trustworthiness**', 'Present', 'HTTPS ✅, real address ✅, real phone ✅, attendant hours posted ✅, multiple payment methods listed ✅, FAQ answers honest questions. Missing: privacy policy and terms of service pages, customer review widgets pulling Google reviews, third-party trust badges (BBB, chamber).'] },
          ],
        },
        {
          _type: 'reportProse',
          _key: 'eeatp',
          body: [p('Top E-E-A-T fixes (also drive conversion):', 'e1')],
        },
        {
          _type: 'reportList',
          _key: 'eeatlist',
          style: 'number',
          items: [
            'Add an `/about` page with the 30-year story, founder/family photo, why touchless was chosen.',
            'Pull live Google reviews into homepage and location pages.',
            'Add minimal `/privacy` and `/terms` pages (also helps Google trust signals).',
            'Add chamber of commerce / BBB / "voted best in Forest Park" badges if any apply.',
          ],
        },
      ],
    },
    {
      _key: 'keywords',
      heading: 'Keyword Analysis',
      widgets: [
        {
          _type: 'reportSubsection',
          _key: 'kw1',
          heading: 'Primary Keywords (currently targeted)',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'kwt1',
              headers: ['Keyword', 'Search Intent', 'Currently Ranks Well?', 'Page That Targets It'],
              rows: [
                { cells: ['`touchless car wash forest park`', 'Commercial/local', 'Likely top 3', 'Homepage'] },
                { cells: ['`car wash forest park il`', 'Commercial/local', 'Competitive (Crystal, Super Wash)', 'Homepage'] },
                { cells: ['`self-serve car wash forest park`', 'Commercial/local', 'Likely strong', 'Homepage / Bays section'] },
                { cells: ['`heated car wash forest park`', 'Commercial/local', 'Likely strong (limited competition)', 'Roosevelt page (should be sharper)'] },
                { cells: ['`wash tokens forest park`', 'Transactional', 'Owned (no competitor offers tokens)', 'Tokens section'] },
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'kw2',
          heading: 'Secondary Keywords to Target',
          widgets: [
            {
              _type: 'reportProse',
              _key: 'kw2p',
              body: [p('These are mostly absent from current copy and should be sprinkled naturally into pages and (especially) future blog content:', 'k1')],
            },
            {
              _type: 'reportList',
              _key: 'kw2list',
              style: 'bullet',
              items: [
                '`touchless car wash near me` (geo + intent)',
                '`car wash oak park il` (neighboring suburb — intent leaks here)',
                '`car wash river forest il` (neighboring suburb)',
                '`car wash open late forest park` (the 7am–10pm differentiator)',
                '`winter car wash chicago` (Roosevelt heated bay opportunity)',
                '`car wash near oak park` (nearest larger town)',
                '`apple pay car wash forest park` (already in keywords meta, less common in body)',
                '`is touchless car wash safe for paint` (informational — high purchase intent)',
                '`touchless vs brush car wash` (comparison — high purchase intent)',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'kw3',
          heading: 'Search Intent Alignment',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'kw3t',
              headers: ['Page', 'User Intent on Landing', 'Page Currently Serves That Intent?'],
              rows: [
                { cells: ['Homepage', 'Commercial: "where\'s a car wash in Forest Park?"', '✅ Mostly — packages and locations are visible'] },
                { cells: ['Location pages', 'Local: "is this car wash near me, hours?"', '⚠️ Mostly. Address, hours, phone present. **No embedded map**, no neighborhood context, no location-specific reviews. Reads more like brand pages than local landing pages.'] },
                { cells: ['FAQ', 'Informational: "how does X work?"', '✅ — content matches intent well'] },
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'kw4',
          heading: 'Missing Page Types (pure intent gaps)',
          widgets: [
            {
              _type: 'reportList',
              _key: 'kw4list',
              style: 'bullet',
              items: [
                '**Membership / Unlimited Wash page** — when launched, will target high-intent commercial searches Crystal currently owns',
                '**Pricing page** (separate URL) — pricing currently lives in homepage anchor; a `/pricing` page would capture explicit "[brand] pricing" queries',
                '**Comparison page** — `/touchless-vs-brush` informational; `/vs/crystal-car-wash` commercial',
              ],
            },
          ],
        },
      ],
    },
    {
      _key: 'tech',
      heading: 'Technical SEO',
      widgets: [
        {
          _type: 'reportSubsection',
          _key: 'robots',
          heading: 'robots.txt — ⚠️ Needs Work',
          widgets: [
            { _type: 'reportProse', _key: 'r1', body: [p('Current:', 'r1a')] },
            { _type: 'reportCode', _key: 'r2', code: `User-Agent: *\nAllow: /` },
            { _type: 'reportProse', _key: 'r3', body: [p('Issues:', 'r3a')] },
            {
              _type: 'reportList',
              _key: 'r4',
              style: 'number',
              items: [
                "❌ No `Sitemap:` declaration. Google can find sitemap.xml without it, but it's a free hint that costs nothing.",
              ],
            },
            { _type: 'reportProse', _key: 'r5', body: [p('**Recommended:**', 'r5a')] },
            { _type: 'reportCode', _key: 'r6', code: `User-Agent: *\nAllow: /\n\nSitemap: https://spotlesscarwash.com/sitemap.xml` },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'sitemap',
          heading: 'sitemap.xml — ⚠️ Needs Work',
          widgets: [
            { _type: 'reportProse', _key: 's1', body: [p('Current sitemap (4 URLs):', 's1a')] },
            { _type: 'reportCode', _key: 's2', code: `<url><loc>/</loc>...</url>\n<url><loc>/faq</loc>...</url>\n<url><loc>/locations/roosevelt-rd</loc>...</url>\n<url><loc>/locations/madison-st</loc>...</url>` },
            {
              _type: 'reportProse',
              _key: 's3',
              body: [
                p('**Critical issue:** All `<loc>` values are **relative paths** (`/`, `/faq`, etc.). The sitemap protocol requires **absolute URLs**. Google may silently ignore relative URLs in sitemaps.', 's3a'),
                p('**Recommended fix:**', 's3b'),
              ],
            },
            { _type: 'reportCode', _key: 's4', code: `<url><loc>https://spotlesscarwash.com/</loc>...</url>\n<url><loc>https://spotlesscarwash.com/faq</loc>...</url>\n<url><loc>https://spotlesscarwash.com/locations/roosevelt-rd</loc>...</url>\n<url><loc>https://spotlesscarwash.com/locations/madison-st</loc>...</url>` },
            {
              _type: 'reportProse',
              _key: 's5',
              body: [
                p("In Next.js App Router with `app/sitemap.ts` or `next-sitemap`, ensure the base URL is configured. With Next's built-in `MetadataRoute.Sitemap`, set `metadataBase` in `app/layout.tsx` and return absolute URLs.", 's5a'),
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'og',
          heading: 'Open Graph & Twitter Cards — ❌ Missing image',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'ogt',
              headers: ['Tag', 'Status'],
              rows: [
                { cells: ['`og:title`', '✅ Present'] },
                { cells: ['`og:description`', '✅ Present'] },
                { cells: ['`og:type`', '✅ `website`'] },
                { cells: ['`og:site_name`', '✅ Present'] },
                { cells: ['`og:locale`', '✅ `en_US`'] },
                { cells: ['`og:url`', '❌ **Missing**'] },
                { cells: ['`og:image`', '❌ **Missing**'] },
                { cells: ['`twitter:card`', '✅ `summary_large_image` (but image missing — broken card)'] },
                { cells: ['`twitter:title`', '✅ Present'] },
                { cells: ['`twitter:description`', '✅ Present'] },
                { cells: ['`twitter:image`', '❌ **Missing**'] },
              ],
            },
            {
              _type: 'reportProse',
              _key: 'ogp',
              body: [
                p('**Add a 1200×630 OG image** (a clean shot of the heated bay or the Roosevelt sign with brand text) and set both `og:image` and `twitter:image` in `app/layout.tsx`. Until this is fixed, every social share appears as a blank card — high CTR loss.', 'og1'),
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'schema',
          heading: 'Schema Markup — ✅ Strong',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'st',
              headers: ['Schema Type', 'Page', 'Status', 'Notes'],
              rows: [
                { cells: ['`Organization`', 'Homepage', '✅ Present', '—'] },
                { cells: ['`AutoWash` (× 2)', 'Homepage, location pages', '✅ Present', 'One per location, with `@id`, `name`, `description`, `address`, `openingHours`. **Note:** `LocalBusiness` is the parent type; `AutoWash` is a recognized child type.'] },
                { cells: ['`PostalAddress`', 'All', '✅ Present', '—'] },
                { cells: ['`OpeningHoursSpecification`', 'All', '✅ Present', '—'] },
                { cells: ['`City`', 'Homepage, location pages', '✅ Present', '—'] },
                { cells: ['`Service` + `OfferCatalog` + `Offer` + `MonetaryAmount`', 'Homepage', '✅ Present', 'Wash packages marked up — eligible for product/service rich results'] },
                { cells: ['`HowTo` + `HowToStep`', 'Homepage', '✅ Present', 'Self-serve dial as a HowTo — eligible for HowTo rich result if it survives Google\'s recent rich-result deprecations'] },
                { cells: ['`FAQPage` + `Question` + `Answer`', 'FAQ', '✅ Present', 'Eligible for FAQ rich result (now mostly limited to authoritative sites)'] },
                { cells: ['`BreadcrumbList`', 'Any', '❌ Not detected', 'Add to location pages and FAQ once you have site nav crumbs'] },
                { cells: ['`Review` / `AggregateRating`', 'None', '❌ Not present', 'Add if/when pulling Google reviews into the page'] },
              ],
            },
            { _type: 'reportProse', _key: 'sp', body: [p('Schema improvements (high impact, low effort):', 'sp1')] },
            {
              _type: 'reportList',
              _key: 'sl',
              style: 'number',
              items: [
                'Add `Review` / `AggregateRating` to each `AutoWash` once a review pipeline exists (pulling from Google Business Profile).',
                'Add `BreadcrumbList` to FAQ and location pages.',
                'Verify HowTo and FAQ rich results in Google Search Console.',
                'Add `Service` with `serviceType: "Car Wash Membership"` once the membership product launches.',
                'Roosevelt and Madison pages currently have only AutoWash + PostalAddress + OpeningHours + City schema — they could also include `Service` and `OfferCatalog` (a subset of homepage\'s schema, scoped to that location).',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'speed',
          heading: 'Page Speed — Not directly measured',
          widgets: [
            {
              _type: 'reportProse',
              _key: 'sp2',
              body: [
                p('Cannot measure Core Web Vitals from a server-side fetch. Initial signals are positive: Next.js 15.5 App Router, code-split JS chunks, proper `next/image` with responsive `srcSet`, async-loaded scripts. Recommend:', 'sp2a'),
              ],
            },
            {
              _type: 'reportList',
              _key: 'sl2',
              style: 'bullet',
              items: [
                'Run PageSpeed Insights (https://pagespeed.web.dev/) on the deployed URL',
                'Run Chrome DevTools Lighthouse in private mode',
                'Check `font-display: swap` on custom fonts (avoids FOIT)',
                'Verify no layout shift from hero image (check `width`/`height` on `Image` components)',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'mobile',
          heading: 'Mobile-Friendliness — ✅ Pass',
          widgets: [
            {
              _type: 'reportList',
              _key: 'ml',
              style: 'bullet',
              items: [
                '✅ Viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`',
                '✅ Responsive Tailwind classes (`sm:`, `md:`, `lg:` breakpoints used throughout)',
                '✅ `next/image` with multiple breakpoints',
              ],
            },
          ],
        },
      ],
    },
    {
      _key: 'gap',
      heading: 'Content Gap Analysis',
      widgets: [
        {
          _type: 'reportSubsection',
          _key: 'gap1',
          heading: 'Missing Content Topics',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'gt',
              headers: ['Missing Topic', 'Search Volume Potential', 'Competition', 'Content Type', 'Priority'],
              rows: [
                { cells: ['`touchless vs brush car wash`', 'High (informational, high commercial overlap)', 'Medium nationally, low locally', 'Blog post / dedicated page', '**1**'] },
                { cells: ['`is a car wash safe for new paint` / `…for ceramic coating`', 'High (very high commercial intent — defensive purchase)', 'Medium', 'Blog post', '**1**'] },
                { cells: ['`winter car wash forest park / chicago`', 'Medium-high seasonal', 'Low', 'Seasonal landing page', '**2**'] },
                { cells: ['`car wash near oak park / river forest / berwyn / cicero / maywood`', 'Medium per neighborhood', 'Medium', 'Sub-area landing pages or single "areas served" page', '**2**'] },
                { cells: ['`how to use a self-serve car wash`', 'Medium informational', 'Low', 'Blog post + video', '**2**'] },
                { cells: ['`unlimited car wash forest park`', 'Medium (Crystal owns this currently)', 'Medium', 'Membership LP — only after membership exists', '**3**'] },
                { cells: ['`Spotless car wash review` / `…hours` / `…directions`', 'Brand queries — already capture these', 'Low', 'Already covered', '—'] },
                { cells: ['`Durashield vs ceramic coating`', 'Low-medium', 'Low', 'Blog post (defensive)', '**3**'] },
                { cells: ['`car wash gift card forest park`', 'Low-medium seasonal', 'Low', 'Add to tokens page', '**3**'] },
              ],
            },
            {
              _type: 'reportProse',
              _key: 'gp',
              body: [
                p('The single biggest content opportunity: **a `/touchless-vs-brush` page**. It serves the highest-intent informational query in the category, captures the "is touchless really better" decision-stage searcher, and positions Spotless as the authoritative answer in the Forest Park area.', 'g1'),
              ],
            },
          ],
        },
      ],
    },
    {
      _key: 'snippets',
      heading: 'Featured Snippet Opportunities',
      intro: [p('The site is well-positioned for several snippet types:', 'sn0')],
      widgets: [
        {
          _type: 'reportSubsection',
          _key: 'sn1',
          heading: 'Paragraph Snippets',
          widgets: [
            { _type: 'reportProse', _key: 'sn1p', body: [p('**Target queries:** *"how does a touchless car wash work"*, *"how does a self-serve car wash work"*', 'sn1a'), p('The FAQ already answers these. To compete for the snippet:', 'sn1b')] },
            {
              _type: 'reportList',
              _key: 'sn1l',
              style: 'number',
              items: [
                'Make sure each FAQ question is an exact-match `<h3>` (or `<h2>`) of a likely query.',
                'The first 40–60 words after each question should be a self-contained answer.',
                "Verify FAQPage schema is parsing correctly in Search Console's URL Inspection.",
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'sn2',
          heading: 'List Snippets',
          widgets: [
            { _type: 'reportProse', _key: 'sn2p', body: [p('**Target query:** *"how to use a self-serve car wash"*', 'sn2a'), p('The 9-step dial instructions are perfect list-snippet material. Make sure:', 'sn2b')] },
            {
              _type: 'reportList',
              _key: 'sn2l',
              style: 'number',
              items: [
                'The instructions section has an `<h2>` containing the query (e.g. *"How to use the self-serve bay"*).',
                'The 9 steps are in an `<ol>` (currently a styled `<div>` per item — works visually but a snippet-eligible `<ol>` is cleaner).',
                'The HowTo schema (already present) reinforces this.',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'sn3',
          heading: 'Table Snippets',
          widgets: [
            {
              _type: 'reportProse',
              _key: 'sn3p',
              body: [
                p('**Target query:** *"car wash prices forest park"*', 'sn3a'),
                p('Current pricing is shown as cards/tiles. A clean comparison `<table>` of wash packages with price would be more snippet-eligible. Could co-exist with the visual presentation as an SEO-targeted block lower on the page or a `/pricing` URL.', 'sn3b'),
              ],
            },
          ],
        },
      ],
    },
    {
      _key: 'links',
      heading: 'Internal Linking Opportunities',
      widgets: [
        {
          _type: 'reportSubsection',
          _key: 'l1',
          heading: 'Specific Recommendations',
          widgets: [
            {
              _type: 'reportList',
              _key: 'lrec',
              style: 'number',
              items: [
                '**FAQ → location/wash anchors.** Each FAQ answer should deep-link to the most relevant page anchor. E.g. the "are bays heated in winter?" answer should link to `/locations/roosevelt-rd`. The "do tokens expire?" answer should link to `/#tokens`.',
                '**Location pages → FAQ entries.** "Wondering how the touchless wash works? See our FAQ →"',
                '**Homepage tokens section → tokens-specific landing page** (when one exists).',
                '**Future blog posts → cluster:** every blog post should link to (a) homepage, (b) the most relevant location, (c) one FAQ entry, (d) the tokens or membership section.',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'l2',
          heading: 'Orphan / Hub Concerns',
          widgets: [
            {
              _type: 'reportList',
              _key: 'lorph',
              style: 'bullet',
              items: [
                'No orphan pages currently (only 4 indexable URLs, all linked from header/footer).',
                '**Hub vulnerability:** as content scales, the homepage will become the only true hub. Recommend creating `/locations/` as an index page once a third location ever opens, and `/learn` or `/blog` as a content hub.',
              ],
            },
          ],
        },
      ],
    },
    {
      _key: 'cwv',
      heading: 'Core Web Vitals (qualitative — measure in production)',
      widgets: [
        { _type: 'reportProse', _key: 'cwvp', body: [p('Cannot measure from raw HTML. Indicators:', 'cwv1')] },
        {
          _type: 'reportList',
          _key: 'cwvlist',
          style: 'bullet',
          items: [
            '✅ Modern Next.js + App Router + React Server Components — good baseline',
            '✅ `next/image` with proper sizes — minimizes LCP for hero',
            "✅ Async script loading — won't render-block",
            '⚠️ Custom fonts (4 detected via class variables) — verify `font-display: swap` to prevent FOIT',
            '⚠️ Verify `width`/`height` on hero `Image` to avoid CLS',
          ],
        },
        {
          _type: 'reportProse',
          _key: 'cwvp2',
          body: [
            p('**Action:** Run PageSpeed Insights on production. If LCP > 2.5s, the most likely culprit is the hero image (`location-exterior.jpg` or similar). Use `priority` prop on the Hero `Image` component to preload it.', 'cwv2'),
            p('**Revenue impact context** (per industry research): a 100ms drop in LCP correlates with ~1.1% conversion lift; pages loading > 5s have ~38% bounce vs. ~9% at < 2s. For a local business where each session is potentially worth a $10–$300 wash + token purchase, even a small CWV win compounds.', 'cwv3'),
          ],
        },
      ],
    },
    {
      _key: 'strategy',
      heading: 'Content Strategy Recommendations',
      widgets: [
        {
          _type: 'reportSubsection',
          _key: 'cad',
          heading: 'Recommended Cadence',
          widgets: [
            {
              _type: 'reportList',
              _key: 'cadl',
              style: 'bullet',
              items: [
                "**1 blog post per month** for the first 6 months. Local-business SEO doesn't need daily content — it needs *the right* content. A monthly cadence is sustainable and matches search demand depth.",
                '**2 seasonal landing pages per year**: Winter (heated bays, salt removal, Nov–Mar) and Summer (UV protection, road-trip prep, May–Aug).',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'first6',
          heading: 'First 6 Posts (Priority Order)',
          widgets: [
            {
              _type: 'reportList',
              _key: 'f6',
              style: 'number',
              items: [
                "**\"Touchless vs. brush car wash: what's actually safer for your paint?\"** — anchor content for the differentiator. Targets the highest-intent informational query.",
                "**\"Forest Park car wash guide: how to use Spotless's self-serve bay like a pro\"** — long-tail \"how to\" + brand presence.",
                '**"How often should you wash your car in winter in Chicago?"** — drives token sales + heated bay positioning.',
                '**"Can you wash a Tesla in a car wash? (And other EV/repaint questions)"** — high-search, high-intent, touchless wins decisively.',
                "**\"Durashield vs. ceramic coating: what's the difference, and what should you actually buy?\"** — defensive content vs. Crystal's ceramic/graphene tier.",
                "**\"What's a wash token, and is it worth it? (Yes — here's the math)\"** — drives token sales.",
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'upd',
          heading: 'Content Update Strategy',
          widgets: [
            {
              _type: 'reportList',
              _key: 'updl',
              style: 'bullet',
              items: [
                'Refresh the homepage and location pages annually with current year, latest copy (anniversaries, etc.).',
                'Update FAQ as new common questions emerge (mine attendant feedback, email replies, social DMs).',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'dist',
          heading: 'Distribution Plan',
          widgets: [
            {
              _type: 'reportList',
              _key: 'distl',
              style: 'bullet',
              items: [
                'Email each new post to the newsletter list.',
                'Cross-post a teaser to Facebook (Spotless already has a FB page).',
                'Submit business posts to Google Business Profile (functions like mini blog posts and helps local pack).',
                'Add internal links from older content as new content publishes.',
              ],
            },
          ],
        },
      ],
    },
    {
      _key: 'prio',
      heading: 'Prioritized Recommendations',
      widgets: [
        {
          _type: 'reportSubsection',
          _key: 'crit',
          heading: 'Critical (Fix This Week — small effort, real impact)',
          widgets: [
            {
              _type: 'reportList',
              _key: 'crl',
              style: 'number',
              items: [
                '**Add absolute URLs to sitemap.xml.** Currently `/` instead of `https://spotlesscarwash.com/` — Google may silently ignore relative URLs. Configure `metadataBase` in `app/layout.tsx`.',
                '**Add `Sitemap:` declaration to robots.txt.** One line, no risk.',
                '**Add canonical tags to every page.** Set `metadataBase` and `alternates.canonical` in `app/layout.tsx` and per-page metadata.',
                '**Add `og:image` and `twitter:image`.** Use a 1200×630 hero of the storefront or wash bay. Set in `app/layout.tsx`.',
                '**Fix the duplicate-brand title issue on location pages** ("Roosevelt Rd · Spotless Carwash · Forest Park, IL · Spotless Carwash"). Drop brand from per-page title OR drop `titleTemplate`.',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'high',
          heading: 'High Priority (This Month)',
          widgets: [
            {
              _type: 'reportList',
              _key: 'hl',
              style: 'number',
              start: 6,
              items: [
                '**Rewrite homepage H1 to lead with the keyword:** *"Forest Park\'s Touchless Car Wash"* (or similar) instead of *"Spotless Carwash — keep it clean."* Tagline can move to a subhead.',
                '**Build out location pages with neighborhood content** (~400–600 words per page about the surrounding area, embedded Google map, location-specific photo gallery, location-specific reviews).',
                '**Embed Google Business Profile reviews** on homepage and location pages. Adds review signal and addresses E-E-A-T trust gap.',
                '**Audit and improve image alt text** across all `Image` components. Be descriptive and include keywords naturally.',
                '**Rename `madison-loaction.jpg` → `madison-location.jpg`.** Tiny SEO + correctness win.',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'med',
          heading: 'Medium Priority (This Quarter)',
          widgets: [
            {
              _type: 'reportList',
              _key: 'ml',
              style: 'number',
              start: 11,
              items: [
                '**Launch the blog/content layer.** Start with the "touchless vs. brush" flagship post. Cadence: 1/month.',
                '**Add an `/about` page with the 30-year story.** Founder/family photo, why touchless, why two locations. Strongest E-E-A-T move available.',
                '**Add `BreadcrumbList` schema** to location and FAQ pages.',
                '**Add `Review` / `AggregateRating` schema** once Google reviews are pulled in.',
                '**Build a `/pricing` page** as an SEO-targeted alternative to the homepage anchor — captures explicit pricing queries.',
                '**Build a `/touchless-vs-brush` comparison page** — captures the highest-intent informational query in the category.',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'low',
          heading: 'Low Priority (When Resources Allow)',
          widgets: [
            {
              _type: 'reportList',
              _key: 'lol',
              style: 'number',
              start: 17,
              items: [
                '**Add `/privacy` and `/terms` pages.** Trust signal + occasional E-E-A-T benefit.',
                '**Convert dial steps `<div>` to `<ol>`** for cleaner list-snippet eligibility (in addition to the existing HowTo schema).',
                '**Add a comparison table** for wash packages with semantic `<table>` markup (alongside the existing visual cards).',
                '**Add a sitewide "Areas Served" footer block** listing Forest Park, Oak Park, River Forest, Berwyn, Maywood, Cicero, with each linking to a future area page.',
              ],
            },
          ],
        },
      ],
    },
    {
      _key: 'summary',
      heading: 'Summary Score Sheet',
      widgets: [
        {
          _type: 'reportTable',
          _key: 'sumt',
          headers: ['Category', 'Score', 'Status'],
          rows: [
            { cells: ['Title Tags', '7/10', 'Mostly good; location duplication issue'] },
            { cells: ['Meta Descriptions', '9/10', 'Excellent'] },
            { cells: ['Headings', '7/10', 'Good structure; H1 keyword optimization opportunity'] },
            { cells: ['Image Optimization', '6/10', 'Strong responsive setup; alt text + OG image gaps'] },
            { cells: ['Internal Linking', '6/10', 'Adequate now; no content layer to support deep linking'] },
            { cells: ['URL Structure', '9/10', 'Clean'] },
            { cells: ['Canonical', '3/10', 'Missing'] },
            { cells: ['Schema Markup', '9/10', '**Genuinely strong** — major correction from prior audit'] },
            { cells: ['robots/sitemap', '5/10', 'Both exist; sitemap uses relative URLs'] },
            { cells: ['Mobile Friendliness', '9/10', 'Solid'] },
            { cells: ['Content Depth', '4/10', 'No blog/content layer'] },
            { cells: ['E-E-A-T', '6/10', 'Trust foundation present; Experience and Authority underdeveloped'] },
          ],
          totalRow: ['Overall', '70/100', 'Grade: B–'],
        },
      ],
    },
    {
      _key: 'sources',
      heading: 'Sources',
      widgets: [
        {
          _type: 'reportList',
          _key: 'srcl',
          style: 'bullet',
          items: [
            'Page HTML directly inspected via curl',
            'robots.txt: https://spotless-carwash-git-main-center-point-digital.vercel.app/robots.txt',
            'sitemap.xml: https://spotless-carwash-git-main-center-point-digital.vercel.app/sitemap.xml',
            'Cross-referenced findings with `MARKETING-AUDIT.md` (corrected the schema/structured-data finding) and `COMPETITOR-REPORT.md` (for keyword/positioning gaps)',
          ],
        },
      ],
    },
  ],
  footerLine: 'Created by Center Point Digital LLC — `/market seo`',
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SEO Audit · Spotless Carwash',
  robots: { index: false, follow: false, nocache: true },
}

export default function SeoAuditPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 text-ink">
      <header className="border-b border-ink/20 pb-8 mb-10">
        <p className="text-xs uppercase tracking-widest text-ink/60 mb-2">Confidential · Client Review</p>
        <h1 className="text-4xl font-black mb-2">SEO Content Audit</h1>
        <p className="text-base text-ink/80 mb-1">https://spotless-carwash-git-main-center-point-digital.vercel.app/</p>
        <p className="text-sm text-ink/70">Date: 2026-05-08</p>
        <p className="mt-4 text-xl font-bold">SEO Health Score: 70/100</p>
        <p className="mt-2"><strong>Grade: B–</strong> Strong foundation (titles, descriptions, schema, sitemap exist and are mostly well-formed). Real wins are immediate. Bigger gaps are in canonicalization, social/OG metadata, and content depth (no blog/educational layer).</p>
        <blockquote className="border-l-4 border-ink/30 pl-4 italic text-ink/80 mt-4">
          <strong>Note re: prior audit.</strong> The earlier <code>/market audit</code> flagged &ldquo;No visible LocalBusiness schema / structured data&rdquo; as an issue. After inspecting the rendered HTML directly, that finding was <strong>incorrect</strong>. The site actually ships extensive JSON-LD: <code>AutoWash</code> (a LocalBusiness sub-type), <code>Organization</code>, <code>HowTo</code>, <code>Service</code>, <code>OfferCatalog</code>, <code>Offer</code>, <code>OpeningHoursSpecification</code>, <code>PostalAddress</code>, <code>City</code>, plus <code>FAQPage</code> schema on <code>/faq</code>. This is one of the <em>strongest</em> parts of the site&apos;s SEO foundation, not a gap. Updating the mental model.
        </blockquote>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">On-Page SEO Checklist</h2>

        <h3 className="text-xl font-bold mb-3">Title Tag</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Page</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-left py-2 pr-4">Title</th>
                <th className="text-left py-2">Length</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Homepage</td><td className="py-2 pr-4">✅ Pass</td><td className="py-2 pr-4"><code>Spotless Carwash · Touchless Car Wash · Forest Park, IL</code></td><td className="py-2">54</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Roosevelt Rd</td><td className="py-2 pr-4">⚠️ Needs Work</td><td className="py-2 pr-4"><code>Roosevelt Rd · Spotless Carwash · Forest Park, IL · Spotless Carwash</code></td><td className="py-2">67</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Madison St</td><td className="py-2 pr-4">⚠️ Needs Work</td><td className="py-2 pr-4">(likely same pattern as Roosevelt — title template appending brand twice)</td><td className="py-2">~67</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">FAQ</td><td className="py-2 pr-4">✅ Pass</td><td className="py-2 pr-4"><code>FAQ · Touchless &amp; Self-Serve Car Wash Questions · Spotless Carwash</code></td><td className="py-2">65</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mb-4"><strong>Issue: location page titles double up the brand name.</strong> The site config has both a per-page title (e.g. &ldquo;Roosevelt Rd · Spotless Carwash · Forest Park, IL&rdquo;) <em>and</em> a <code>titleTemplate</code> of <code>%s · Spotless Carwash</code> that appends &ldquo;Spotless Carwash&rdquo; again. Result: <code>Roosevelt Rd · Spotless Carwash · Forest Park, IL · Spotless Carwash</code>. Pushes title past 60 chars and looks odd in SERPs.</p>
        <p className="mb-4"><strong>Recommended fix:</strong> Remove the brand name from the per-page title (let the template append it once), OR drop the global template. Pick one.</p>
        <pre className="bg-ink/5 border border-ink/10 p-4 rounded text-xs overflow-x-auto mb-4"><code>{`// Pick ONE pattern:
// (a) Per-page title is the SEO target, let template add brand
title: 'Touchless Car Wash on Roosevelt Rd, Forest Park IL'  // → "...· Spotless Carwash"
// (b) Per-page title already contains brand, no template
title: 'Roosevelt Rd · Spotless Carwash · Forest Park, IL'    // titleTemplate: undefined`}</code></pre>
        <p className="font-semibold mb-2">Recommended titles (option a):</p>
        <ul className="list-disc pl-6 space-y-1 mb-6">
          <li>Homepage: <code>Touchless Car Wash · Forest Park, IL · Spotless Carwash</code> (lead with keyword, 54)</li>
          <li>Roosevelt: <code>Touchless Car Wash on Roosevelt Rd, Forest Park IL · Spotless Carwash</code> (60)</li>
          <li>Madison: <code>Touchless Car Wash on Madison St, Forest Park IL · Spotless Carwash</code> (60)</li>
          <li>FAQ: <code>Self-Serve &amp; Touchless Car Wash FAQ · Forest Park IL · Spotless Carwash</code> (66 — slightly long, OK)</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">Meta Description</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Page</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-left py-2 pr-4">Length</th>
                <th className="text-left py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Homepage</td><td className="py-2 pr-4">✅ Pass</td><td className="py-2 pr-4">137</td><td className="py-2">Geo-anchored, mentions touchless + self-serve + heated + hours — strong</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Roosevelt Rd</td><td className="py-2 pr-4">✅ Pass</td><td className="py-2 pr-4">150</td><td className="py-2">Includes street address — excellent for local</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Madison St</td><td className="py-2 pr-4">✅ Pass</td><td className="py-2 pr-4">(~150)</td><td className="py-2">Same pattern</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">FAQ</td><td className="py-2 pr-4">✅ Pass</td><td className="py-2 pr-4">157</td><td className="py-2">Strong; right at ceiling</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mb-3">All meta descriptions are well-written: keyword-anchored, contain an implicit value prop, end with hours or address. No major issues. Minor opportunity: add a CTA verb to the homepage description.</p>
        <p className="mb-2"><strong>Suggested homepage description:</strong></p>
        <blockquote className="border-l-4 border-ink/30 pl-4 italic text-ink/90 mb-6">
          &ldquo;Forest Park&apos;s touchless car wash since the &lsquo;90s. Two locations, heated automatic bays for winter, self-serve wand bays — open 7am–10pm daily. Plan your wash.&rdquo; (155)
        </blockquote>

        <h3 className="text-xl font-bold mb-3">Heading Hierarchy</h3>
        <p className="mb-3"><strong>Homepage H1:</strong> <code>Spotless Carwash — keep it clean.</code></p>
        <p className="mb-3"><strong>Issue:</strong> The H1 leads with the brand name and the tagline — neither contains the primary keyword phrase. For local SEO, the H1 should ideally include &ldquo;Touchless Car Wash&rdquo; + city.</p>
        <p className="mb-2"><strong>Recommended H1:</strong></p>
        <blockquote className="border-l-4 border-ink/30 pl-4 italic text-ink/90 mb-4">
          &ldquo;Forest Park&apos;s Touchless Car Wash — Spotless Carwash&rdquo; (or variations)
        </blockquote>
        <p className="mb-1"><strong>Roosevelt H1:</strong> <code>Spotless Carwash on Roosevelt Rd</code> ✅ — geo-anchored, OK.</p>
        <p className="mb-1"><strong>Madison H1:</strong> Same pattern ✅</p>
        <p className="mb-3"><strong>FAQ H1:</strong> <code>Questions, answered.</code> ⚠️ — too generic; doesn&apos;t include any keyword.</p>
        <p className="mb-4"><strong>Recommended FAQ H1:</strong> <em>&ldquo;Spotless Carwash FAQ — touchless, self-serve, tokens, hours&rdquo;</em> or <em>&ldquo;Touchless &amp; Self-Serve Car Wash Questions&rdquo;</em></p>
        <p className="mb-2"><strong>H2 structure:</strong> Strong. Section headlines on the homepage are clear and topical:</p>
        <ul className="list-disc pl-6 space-y-1 mb-4">
          <li>&ldquo;Pull up &amp; watch the lights.&rdquo; (Hero)</li>
          <li>&ldquo;Four ways to make your car shine.&rdquo; (Wash packages)</li>
          <li>&ldquo;Two locations. Ten bays. All in Forest Park.&rdquo; (Locations)</li>
          <li>&ldquo;Sit back, or do it yourself.&rdquo; (Bays)</li>
          <li>&ldquo;Nine settings. One clean car.&rdquo; (Self-serve dial)</li>
          <li>&ldquo;Everything else on the lot.&rdquo; (Other services)</li>
          <li>&ldquo;Buy a stack…&rdquo; (Tokens)</li>
        </ul>
        <p className="mb-6">These read well and are distinct. Minor SEO weakness: no H2 on the homepage explicitly contains &ldquo;Forest Park&rdquo; or &ldquo;touchless&rdquo; — the keyword density is carried by body copy and schema, not subheads.</p>

        <h3 className="text-xl font-bold mb-3">Image Optimization</h3>
        <ul className="list-disc pl-6 space-y-1 mb-4">
          <li>✅ Using <code>next/image</code> with proper <code>srcSet</code> and multiple breakpoints (640w, 750w, 828w, 1080w, 1200w, 1920w, 2048w, 3840w) — modern, responsive, and the build pipeline will serve WebP/AVIF where supported.</li>
          <li>✅ <code>quality=75</code> is reasonable for web.</li>
          <li>⚠️ <strong>Alt text count is light.</strong> Only 4 alt attributes detected on the homepage. Many image roles are likely background/decorative.</li>
          <li>⚠️ <strong>One image filename has a typo:</strong> <code>madison-loaction.jpg</code> (should be <code>madison-location.jpg</code>). Filenames are a minor SEO signal — descriptive, correct filenames help.</li>
          <li>⚠️ <strong>No OpenGraph image</strong> (<code>og:image</code>) is set. Social shares will show empty cards on Twitter/X, LinkedIn, Slack, iMessage, Facebook, etc. This is a real visibility/CTR loss in the social channel. Twitter card type is <code>summary_large_image</code> but no image is provided — <strong>broken</strong>.</li>
        </ul>
        <p className="font-semibold mb-2">Recommended fixes:</p>
        <ol className="list-decimal pl-6 space-y-1 mb-6">
          <li>Add an <code>og:image</code> (and <code>twitter:image</code>) — 1200×630 hero image of the storefront or a wash bay. Set in <code>app/layout.tsx</code> Metadata or per-page Metadata.</li>
          <li>Audit alt text on every <code>Image</code> and ensure each conveys subject + context (e.g. <em>&ldquo;Touchless automatic bay interior at Spotless Carwash Roosevelt Rd&rdquo;</em> not <em>&ldquo;bay&rdquo;</em>).</li>
          <li>Rename <code>madison-loaction.jpg</code> → <code>madison-location.jpg</code>.</li>
        </ol>

        <h3 className="text-xl font-bold mb-3">Internal Linking</h3>
        <ul className="list-disc pl-6 space-y-1 mb-4">
          <li>✅ Footer links to <code>/locations/roosevelt-rd</code>, <code>/locations/madison-st</code>, <code>/faq</code>, plus in-page anchors <code>/#washes</code>, <code>/#bays</code>, <code>/#tokens</code>, <code>/#how</code>.</li>
          <li>✅ Anchor text is descriptive (&ldquo;Roosevelt Rd&rdquo;, &ldquo;Madison St&rdquo;, &ldquo;Wash packages&rdquo;) — no &ldquo;click here&rdquo;.</li>
          <li>⚠️ <strong>Limited deep linking.</strong> Outside the footer, there&apos;s little contextual cross-linking. The FAQ doesn&apos;t link out to the relevant location/wash pages. The homepage doesn&apos;t deep-link to FAQ entries.</li>
          <li>❌ <strong>No blog/content cluster</strong> to link from (the site has no <code>/blog</code> or <code>/learn</code>). This is a content depth issue, not strictly a linking issue.</li>
        </ul>
        <p className="mb-6"><strong>Recommendation:</strong> When the blog/content layer goes in (see Strategy section), build a hub-and-spoke: each post links to homepage + nearest location + FAQ entry + tokens.</p>

        <h3 className="text-xl font-bold mb-3">URL Structure</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">URL</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-left py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>/</code></td><td className="py-2 pr-4">✅ Pass</td><td className="py-2">—</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>/faq</code></td><td className="py-2 pr-4">✅ Pass</td><td className="py-2">Clean, descriptive</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>/locations/roosevelt-rd</code></td><td className="py-2 pr-4">✅ Pass</td><td className="py-2">Hierarchical, hyphenated, keyword-rich</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>/locations/madison-st</code></td><td className="py-2 pr-4">✅ Pass</td><td className="py-2">Same</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mb-6">URL structure is clean. Lowercase, hyphenated, hierarchical. No issues.</p>

        <h3 className="text-xl font-bold mb-3">Canonical Tags — ❌ MISSING ON ALL PAGES</h3>
        <p className="mb-3"><strong>Critical:</strong> No <code>&lt;link rel=&quot;canonical&quot;&gt;</code> tag is set on any page. This is a real SEO risk in two scenarios:</p>
        <ol className="list-decimal pl-6 space-y-1 mb-4">
          <li>The Vercel preview URL (<code>spotless-carwash-git-main-center-point-digital.vercel.app</code>) and the production domain both index without a canonical pointing to the production version. Google could see them as duplicates and split ranking signal.</li>
          <li>Any URL parameters appended (e.g. UTM, <code>?ref=</code>) generate &ldquo;duplicate&rdquo; URLs without a canonical to consolidate.</li>
        </ol>
        <p className="mb-3"><strong>Recommended fix:</strong> In <code>app/layout.tsx</code> or via <code>generateMetadata</code>, set:</p>
        <pre className="bg-ink/5 border border-ink/10 p-4 rounded text-xs overflow-x-auto mb-4"><code>{`export const metadata = {
  metadataBase: new URL('https://spotlesscarwash.com'),  // production domain
  alternates: { canonical: '/' },  // override per page as needed
  // ...
}`}</code></pre>
        <p>Each page should have its own canonical pointing to the canonical version of itself.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Content Quality (E-E-A-T)</h2>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Dimension</th>
                <th className="text-left py-2 pr-4">Score</th>
                <th className="text-left py-2">Evidence</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><strong>Experience</strong></td><td className="py-2 pr-4">Weak</td><td className="py-2">The site doesn&apos;t tell stories of operating a car wash for 30+ years. No &ldquo;since 199X&rdquo;, no founder photo, no anecdotes about the heated bays in a particular Chicago winter. The 30-year history is the strongest experiential moat — and it&apos;s nearly invisible in the content.</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><strong>Expertise</strong></td><td className="py-2 pr-4">Present</td><td className="py-2">The FAQ shows category expertise (touchless explanation, self-serve walkthrough, token economics, heated bays). The dial instructions match a real industry standard. But there&apos;s no expert voice: no &ldquo;we&apos;ve been washing cars for 30 years and here&apos;s what we&apos;ve learned&rdquo; content.</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><strong>Authoritativeness</strong></td><td className="py-2 pr-4">Weak</td><td className="py-2">No author/founder bio, no press mentions, no chamber of commerce affiliations, no community involvement, no awards. Yelp ratings ~3.0 ★ at both locations actively suppress authority signals.</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><strong>Trustworthiness</strong></td><td className="py-2 pr-4">Present</td><td className="py-2">HTTPS ✅, real address ✅, real phone ✅, attendant hours posted ✅, multiple payment methods listed ✅, FAQ answers honest questions. Missing: privacy policy and terms of service pages, customer review widgets pulling Google reviews, third-party trust badges (BBB, chamber).</td></tr>
            </tbody>
          </table>
        </div>
        <p className="font-semibold mb-2">Top E-E-A-T fixes (also drive conversion):</p>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Add an <code>/about</code> page with the 30-year story, founder/family photo, why touchless was chosen.</li>
          <li>Pull live Google reviews into homepage and location pages.</li>
          <li>Add minimal <code>/privacy</code> and <code>/terms</code> pages (also helps Google trust signals).</li>
          <li>Add chamber of commerce / BBB / &ldquo;voted best in Forest Park&rdquo; badges if any apply.</li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Keyword Analysis</h2>

        <h3 className="text-xl font-bold mb-3">Primary Keywords (currently targeted)</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Keyword</th>
                <th className="text-left py-2 pr-4">Search Intent</th>
                <th className="text-left py-2 pr-4">Currently Ranks Well?</th>
                <th className="text-left py-2">Page That Targets It</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>touchless car wash forest park</code></td><td className="py-2 pr-4">Commercial/local</td><td className="py-2 pr-4">Likely top 3</td><td className="py-2">Homepage</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>car wash forest park il</code></td><td className="py-2 pr-4">Commercial/local</td><td className="py-2 pr-4">Competitive (Crystal, Super Wash)</td><td className="py-2">Homepage</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>self-serve car wash forest park</code></td><td className="py-2 pr-4">Commercial/local</td><td className="py-2 pr-4">Likely strong</td><td className="py-2">Homepage / Bays section</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>heated car wash forest park</code></td><td className="py-2 pr-4">Commercial/local</td><td className="py-2 pr-4">Likely strong (limited competition)</td><td className="py-2">Roosevelt page (should be sharper)</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>wash tokens forest park</code></td><td className="py-2 pr-4">Transactional</td><td className="py-2 pr-4">Owned (no competitor offers tokens)</td><td className="py-2">Tokens section</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-bold mb-3">Secondary Keywords to Target</h3>
        <p className="mb-3">These are mostly absent from current copy and should be sprinkled naturally into pages and (especially) future blog content:</p>
        <ul className="list-disc pl-6 space-y-1 mb-6">
          <li><code>touchless car wash near me</code> (geo + intent)</li>
          <li><code>car wash oak park il</code> (neighboring suburb — intent leaks here)</li>
          <li><code>car wash river forest il</code> (neighboring suburb)</li>
          <li><code>car wash open late forest park</code> (the 7am–10pm differentiator)</li>
          <li><code>winter car wash chicago</code> (Roosevelt heated bay opportunity)</li>
          <li><code>car wash near oak park</code> (nearest larger town)</li>
          <li><code>apple pay car wash forest park</code> (already in keywords meta, less common in body)</li>
          <li><code>is touchless car wash safe for paint</code> (informational — high purchase intent)</li>
          <li><code>touchless vs brush car wash</code> (comparison — high purchase intent)</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">Search Intent Alignment</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Page</th>
                <th className="text-left py-2 pr-4">User Intent on Landing</th>
                <th className="text-left py-2">Page Currently Serves That Intent?</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Homepage</td><td className="py-2 pr-4">Commercial: &ldquo;where&apos;s a car wash in Forest Park?&rdquo;</td><td className="py-2">✅ Mostly — packages and locations are visible</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Location pages</td><td className="py-2 pr-4">Local: &ldquo;is this car wash near me, hours?&rdquo;</td><td className="py-2">⚠️ Mostly. Address, hours, phone present. <strong>No embedded map</strong>, no neighborhood context, no location-specific reviews. Reads more like brand pages than local landing pages.</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">FAQ</td><td className="py-2 pr-4">Informational: &ldquo;how does X work?&rdquo;</td><td className="py-2">✅ — content matches intent well</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-bold mb-3">Missing Page Types (pure intent gaps)</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Membership / Unlimited Wash page</strong> — when launched, will target high-intent commercial searches Crystal currently owns</li>
          <li><strong>Pricing page</strong> (separate URL) — pricing currently lives in homepage anchor; a <code>/pricing</code> page would capture explicit &ldquo;[brand] pricing&rdquo; queries</li>
          <li><strong>Comparison page</strong> — <code>/touchless-vs-brush</code> informational; <code>/vs/crystal-car-wash</code> commercial</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Technical SEO</h2>

        <h3 className="text-xl font-bold mb-3">robots.txt — ⚠️ Needs Work</h3>
        <p className="mb-2">Current:</p>
        <pre className="bg-ink/5 border border-ink/10 p-4 rounded text-xs overflow-x-auto mb-4"><code>{`User-Agent: *
Allow: /`}</code></pre>
        <p className="font-semibold mb-2">Issues:</p>
        <ol className="list-decimal pl-6 space-y-1 mb-4">
          <li>❌ No <code>Sitemap:</code> declaration. Google can find sitemap.xml without it, but it&apos;s a free hint that costs nothing.</li>
        </ol>
        <p className="mb-2"><strong>Recommended:</strong></p>
        <pre className="bg-ink/5 border border-ink/10 p-4 rounded text-xs overflow-x-auto mb-6"><code>{`User-Agent: *
Allow: /

Sitemap: https://spotlesscarwash.com/sitemap.xml`}</code></pre>

        <h3 className="text-xl font-bold mb-3">sitemap.xml — ⚠️ Needs Work</h3>
        <p className="mb-2">Current sitemap (4 URLs):</p>
        <pre className="bg-ink/5 border border-ink/10 p-4 rounded text-xs overflow-x-auto mb-4"><code>{`<url><loc>/</loc>...</url>
<url><loc>/faq</loc>...</url>
<url><loc>/locations/roosevelt-rd</loc>...</url>
<url><loc>/locations/madison-st</loc>...</url>`}</code></pre>
        <p className="mb-3"><strong>Critical issue:</strong> All <code>&lt;loc&gt;</code> values are <strong>relative paths</strong> (<code>/</code>, <code>/faq</code>, etc.). The sitemap protocol requires <strong>absolute URLs</strong>. Google may silently ignore relative URLs in sitemaps.</p>
        <p className="mb-2"><strong>Recommended fix:</strong></p>
        <pre className="bg-ink/5 border border-ink/10 p-4 rounded text-xs overflow-x-auto mb-4"><code>{`<url><loc>https://spotlesscarwash.com/</loc>...</url>
<url><loc>https://spotlesscarwash.com/faq</loc>...</url>
<url><loc>https://spotlesscarwash.com/locations/roosevelt-rd</loc>...</url>
<url><loc>https://spotlesscarwash.com/locations/madison-st</loc>...</url>`}</code></pre>
        <p className="mb-6">In Next.js App Router with <code>app/sitemap.ts</code> or <code>next-sitemap</code>, ensure the base URL is configured. With Next&apos;s built-in <code>MetadataRoute.Sitemap</code>, set <code>metadataBase</code> in <code>app/layout.tsx</code> and return absolute URLs.</p>

        <h3 className="text-xl font-bold mb-3">Canonical Tags — ❌ Missing (also covered above)</h3>

        <h3 className="text-xl font-bold mb-3 mt-6">Open Graph &amp; Twitter Cards — ❌ Missing image</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Tag</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>og:title</code></td><td className="py-2">✅ Present</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>og:description</code></td><td className="py-2">✅ Present</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>og:type</code></td><td className="py-2">✅ <code>website</code></td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>og:site_name</code></td><td className="py-2">✅ Present</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>og:locale</code></td><td className="py-2">✅ <code>en_US</code></td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>og:url</code></td><td className="py-2">❌ <strong>Missing</strong></td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>og:image</code></td><td className="py-2">❌ <strong>Missing</strong></td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>twitter:card</code></td><td className="py-2">✅ <code>summary_large_image</code> (but image missing — broken card)</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>twitter:title</code></td><td className="py-2">✅ Present</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>twitter:description</code></td><td className="py-2">✅ Present</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>twitter:image</code></td><td className="py-2">❌ <strong>Missing</strong></td></tr>
            </tbody>
          </table>
        </div>
        <p className="mb-6"><strong>Add a 1200×630 OG image</strong> (a clean shot of the heated bay or the Roosevelt sign with brand text) and set both <code>og:image</code> and <code>twitter:image</code> in <code>app/layout.tsx</code>. Until this is fixed, every social share appears as a blank card — high CTR loss.</p>

        <h3 className="text-xl font-bold mb-3">Schema Markup — ✅ Strong</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Schema Type</th>
                <th className="text-left py-2 pr-4">Page</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-left py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>Organization</code></td><td className="py-2 pr-4">Homepage</td><td className="py-2 pr-4">✅ Present</td><td className="py-2">—</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>AutoWash</code> (× 2)</td><td className="py-2 pr-4">Homepage, location pages</td><td className="py-2 pr-4">✅ Present</td><td className="py-2">One per location, with <code>@id</code>, <code>name</code>, <code>description</code>, <code>address</code>, <code>openingHours</code>. <strong>Note:</strong> <code>LocalBusiness</code> is the parent type; <code>AutoWash</code> is a recognized child type. Some recommend using <code>LocalBusiness</code> directly for broader compatibility, but <code>AutoWash</code> is the <em>more specific and correct</em> type and Google recognizes it.</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>PostalAddress</code></td><td className="py-2 pr-4">All</td><td className="py-2 pr-4">✅ Present</td><td className="py-2">—</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>OpeningHoursSpecification</code></td><td className="py-2 pr-4">All</td><td className="py-2 pr-4">✅ Present</td><td className="py-2">—</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>City</code></td><td className="py-2 pr-4">Homepage, location pages</td><td className="py-2 pr-4">✅ Present</td><td className="py-2">—</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>Service</code> + <code>OfferCatalog</code> + <code>Offer</code> + <code>MonetaryAmount</code></td><td className="py-2 pr-4">Homepage</td><td className="py-2 pr-4">✅ Present</td><td className="py-2">Wash packages marked up — eligible for product/service rich results</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>HowTo</code> + <code>HowToStep</code></td><td className="py-2 pr-4">Homepage</td><td className="py-2 pr-4">✅ Present</td><td className="py-2">Self-serve dial as a HowTo — eligible for HowTo rich result if it survives Google&apos;s recent rich-result deprecations (HowTo was scaled back in 2023; verify in Search Console)</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>FAQPage</code> + <code>Question</code> + <code>Answer</code></td><td className="py-2 pr-4">FAQ</td><td className="py-2 pr-4">✅ Present</td><td className="py-2">Eligible for FAQ rich result (now mostly limited to authoritative sites — verify)</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>BreadcrumbList</code></td><td className="py-2 pr-4">Any</td><td className="py-2 pr-4">❌ Not detected</td><td className="py-2">Add to location pages and FAQ once you have site nav crumbs</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><code>Review</code> / <code>AggregateRating</code></td><td className="py-2 pr-4">None</td><td className="py-2 pr-4">❌ Not present</td><td className="py-2">Add if/when pulling Google reviews into the page</td></tr>
            </tbody>
          </table>
        </div>
        <p className="font-semibold mb-2">Schema improvements (high impact, low effort):</p>
        <ol className="list-decimal pl-6 space-y-1 mb-6">
          <li>Add <code>Review</code> / <code>AggregateRating</code> to each <code>AutoWash</code> once a review pipeline exists (pulling from Google Business Profile).</li>
          <li>Add <code>BreadcrumbList</code> to FAQ and location pages.</li>
          <li>Verify HowTo and FAQ rich results in Google Search Console — Google has limited eligibility for both schema types; on a low-authority site the schema may parse but not display rich snippets. Still worth shipping; signals topical structure.</li>
          <li>Add <code>Service</code> with <code>serviceType: &quot;Car Wash Membership&quot;</code> once the membership product launches.</li>
          <li>Roosevelt and Madison pages currently have only AutoWash + PostalAddress + OpeningHours + City schema — they could also include <code>Service</code> and <code>OfferCatalog</code> (a subset of homepage&apos;s schema, scoped to that location).</li>
        </ol>

        <h3 className="text-xl font-bold mb-3">Page Speed — Not directly measured</h3>
        <p className="mb-3">Cannot measure Core Web Vitals from a server-side fetch. Initial signals are positive: Next.js 15.5 App Router, code-split JS chunks, proper <code>next/image</code> with responsive <code>srcSet</code>, async-loaded scripts. Recommend:</p>
        <ul className="list-disc pl-6 space-y-1 mb-6">
          <li>Run PageSpeed Insights (https://pagespeed.web.dev/) on the deployed URL</li>
          <li>Run Chrome DevTools Lighthouse in private mode</li>
          <li>Check <code>font-display: swap</code> on custom fonts (avoids FOIT)</li>
          <li>Verify no layout shift from hero image (check <code>width</code>/<code>height</code> on <code>Image</code> components)</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">Mobile-Friendliness — ✅ Pass</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>✅ Viewport meta tag: <code>&lt;meta name=&quot;viewport&quot; content=&quot;width=device-width, initial-scale=1&quot;&gt;</code></li>
          <li>✅ Responsive Tailwind classes (<code>sm:</code>, <code>md:</code>, <code>lg:</code> breakpoints used throughout)</li>
          <li>✅ <code>next/image</code> with multiple breakpoints</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Content Gap Analysis</h2>
        <h3 className="text-xl font-bold mb-3">Missing Content Topics</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-3">Missing Topic</th>
                <th className="text-left py-2 pr-3">Search Volume Potential</th>
                <th className="text-left py-2 pr-3">Competition</th>
                <th className="text-left py-2 pr-3">Content Type</th>
                <th className="text-left py-2">Priority</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><code>touchless vs brush car wash</code></td><td className="py-2 pr-3">High (informational, high commercial overlap)</td><td className="py-2 pr-3">Medium nationally, low locally</td><td className="py-2 pr-3">Blog post / dedicated page</td><td className="py-2"><strong>1</strong></td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><code>is a car wash safe for new paint</code> / <code>…for ceramic coating</code></td><td className="py-2 pr-3">High (very high commercial intent — defensive purchase)</td><td className="py-2 pr-3">Medium</td><td className="py-2 pr-3">Blog post</td><td className="py-2"><strong>1</strong></td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><code>winter car wash forest park / chicago</code></td><td className="py-2 pr-3">Medium-high seasonal</td><td className="py-2 pr-3">Low</td><td className="py-2 pr-3">Seasonal landing page</td><td className="py-2"><strong>2</strong></td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><code>car wash near oak park / river forest / berwyn / cicero / maywood</code></td><td className="py-2 pr-3">Medium per neighborhood</td><td className="py-2 pr-3">Medium</td><td className="py-2 pr-3">Sub-area landing pages or single &ldquo;areas served&rdquo; page</td><td className="py-2"><strong>2</strong></td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><code>how to use a self-serve car wash</code></td><td className="py-2 pr-3">Medium informational</td><td className="py-2 pr-3">Low</td><td className="py-2 pr-3">Blog post + video</td><td className="py-2"><strong>2</strong></td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><code>unlimited car wash forest park</code></td><td className="py-2 pr-3">Medium (Crystal owns this currently)</td><td className="py-2 pr-3">Medium</td><td className="py-2 pr-3">Membership LP — only after membership exists</td><td className="py-2"><strong>3</strong></td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><code>Spotless car wash review</code> / <code>…hours</code> / <code>…directions</code></td><td className="py-2 pr-3">Brand queries — already capture these</td><td className="py-2 pr-3">Low</td><td className="py-2 pr-3">Already covered</td><td className="py-2">—</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><code>LustraShield vs ceramic coating</code></td><td className="py-2 pr-3">Low-medium</td><td className="py-2 pr-3">Low</td><td className="py-2 pr-3">Blog post (defensive)</td><td className="py-2"><strong>3</strong></td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><code>car wash gift card forest park</code></td><td className="py-2 pr-3">Low-medium seasonal</td><td className="py-2 pr-3">Low</td><td className="py-2 pr-3">Add to tokens page</td><td className="py-2"><strong>3</strong></td></tr>
            </tbody>
          </table>
        </div>
        <p>The single biggest content opportunity: <strong>a <code>/touchless-vs-brush</code> page</strong>. It serves the highest-intent informational query in the category, captures the &ldquo;is touchless really better&rdquo; decision-stage searcher, and positions Spotless as the authoritative answer in the Forest Park area.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Featured Snippet Opportunities</h2>
        <p className="mb-4">The site is well-positioned for several snippet types:</p>

        <h3 className="text-xl font-bold mb-3">Paragraph Snippets</h3>
        <p className="mb-3"><strong>Target queries:</strong> <em>&ldquo;how does a touchless car wash work&rdquo;</em>, <em>&ldquo;how does a self-serve car wash work&rdquo;</em></p>
        <p className="mb-2">The FAQ already answers these. To compete for the snippet:</p>
        <ol className="list-decimal pl-6 space-y-1 mb-6">
          <li>Make sure each FAQ question is an exact-match <code>&lt;h3&gt;</code> (or <code>&lt;h2&gt;</code>) of a likely query.</li>
          <li>The first 40–60 words after each question should be a self-contained answer.</li>
          <li>Verify FAQPage schema is parsing correctly in Search Console&apos;s URL Inspection.</li>
        </ol>

        <h3 className="text-xl font-bold mb-3">List Snippets</h3>
        <p className="mb-3"><strong>Target query:</strong> <em>&ldquo;how to use a self-serve car wash&rdquo;</em></p>
        <p className="mb-2">The 9-step dial instructions are perfect list-snippet material. Make sure:</p>
        <ol className="list-decimal pl-6 space-y-1 mb-6">
          <li>The instructions section has an <code>&lt;h2&gt;</code> containing the query (e.g. <em>&ldquo;How to use the self-serve bay&rdquo;</em>).</li>
          <li>The 9 steps are in an <code>&lt;ol&gt;</code> (currently a styled <code>&lt;div&gt;</code> per item — works visually but a snippet-eligible <code>&lt;ol&gt;</code> is cleaner).</li>
          <li>The HowTo schema (already present) reinforces this.</li>
        </ol>

        <h3 className="text-xl font-bold mb-3">Table Snippets</h3>
        <p className="mb-3"><strong>Target query:</strong> <em>&ldquo;car wash prices forest park&rdquo;</em></p>
        <p>Current pricing is shown as cards/tiles. A clean comparison <code>&lt;table&gt;</code> of wash packages with price would be more snippet-eligible. Could co-exist with the visual presentation as an SEO-targeted block lower on the page or a <code>/pricing</code> URL.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Internal Linking Opportunities</h2>
        <h3 className="text-xl font-bold mb-3">Specific Recommendations</h3>
        <ol className="list-decimal pl-6 space-y-2 mb-6">
          <li><strong>FAQ → location/wash anchors.</strong> Each FAQ answer should deep-link to the most relevant page anchor. E.g. the &ldquo;are bays heated in winter?&rdquo; answer should link to <code>/locations/roosevelt-rd</code>. The &ldquo;do tokens expire?&rdquo; answer should link to <code>/#tokens</code>.</li>
          <li><strong>Location pages → FAQ entries.</strong> &ldquo;Wondering how the touchless wash works? See our FAQ →&rdquo;</li>
          <li><strong>Homepage tokens section → tokens-specific landing page</strong> (when one exists).</li>
          <li><strong>Future blog posts → cluster:</strong> every blog post should link to (a) homepage, (b) the most relevant location, (c) one FAQ entry, (d) the tokens or membership section.</li>
        </ol>

        <h3 className="text-xl font-bold mb-3">Orphan / Hub Concerns</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>No orphan pages currently (only 4 indexable URLs, all linked from header/footer).</li>
          <li><strong>Hub vulnerability:</strong> as content scales, the homepage will become the only true hub. Recommend creating <code>/locations/</code> as an index page once a third location ever opens, and <code>/learn</code> or <code>/blog</code> as a content hub.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Core Web Vitals (qualitative — measure in production)</h2>
        <p className="mb-3">Cannot measure from raw HTML. Indicators:</p>
        <ul className="list-disc pl-6 space-y-1 mb-4">
          <li>✅ Modern Next.js + App Router + React Server Components — good baseline</li>
          <li>✅ <code>next/image</code> with proper sizes — minimizes LCP for hero</li>
          <li>✅ Async script loading — won&apos;t render-block</li>
          <li>⚠️ Custom fonts (4 detected via class variables) — verify <code>font-display: swap</code> to prevent FOIT</li>
          <li>⚠️ Verify <code>width</code>/<code>height</code> on hero <code>Image</code> to avoid CLS</li>
        </ul>
        <p className="mb-4"><strong>Action:</strong> Run PageSpeed Insights on production. If LCP &gt; 2.5s, the most likely culprit is the hero image (<code>location-exterior.jpg</code> or similar). Use <code>priority</code> prop on the Hero <code>Image</code> component to preload it.</p>
        <p><strong>Revenue impact context</strong> (per industry research): a 100ms drop in LCP correlates with ~1.1% conversion lift; pages loading &gt; 5s have ~38% bounce vs. ~9% at &lt; 2s. For a local business where each session is potentially worth a $10–$300 wash + token purchase, even a small CWV win compounds.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Content Strategy Recommendations</h2>

        <h3 className="text-xl font-bold mb-3">Recommended Cadence</h3>
        <ul className="list-disc pl-6 space-y-1 mb-6">
          <li><strong>1 blog post per month</strong> for the first 6 months. Local-business SEO doesn&apos;t need daily content — it needs <em>the right</em> content. A monthly cadence is sustainable and matches search demand depth.</li>
          <li><strong>2 seasonal landing pages per year</strong>: Winter (heated bays, salt removal, Nov–Mar) and Summer (UV protection, road-trip prep, May–Aug).</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">First 6 Posts (Priority Order)</h3>
        <ol className="list-decimal pl-6 space-y-2 mb-6">
          <li><strong>&ldquo;Touchless vs. brush car wash: what&apos;s actually safer for your paint?&rdquo;</strong> — anchor content for the differentiator. Targets the highest-intent informational query.</li>
          <li><strong>&ldquo;Forest Park car wash guide: how to use Spotless&apos;s self-serve bay like a pro&rdquo;</strong> — long-tail &ldquo;how to&rdquo; + brand presence.</li>
          <li><strong>&ldquo;How often should you wash your car in winter in Chicago?&rdquo;</strong> — drives token sales + heated bay positioning.</li>
          <li><strong>&ldquo;Can you wash a Tesla in a car wash? (And other EV/repaint questions)&rdquo;</strong> — high-search, high-intent, touchless wins decisively.</li>
          <li><strong>&ldquo;LustraShield vs. ceramic coating: what&apos;s the difference, and what should you actually buy?&rdquo;</strong> — defensive content vs. Crystal&apos;s ceramic/graphene tier.</li>
          <li><strong>&ldquo;What&apos;s a wash token, and is it worth it? (Yes — here&apos;s the math)&rdquo;</strong> — drives token sales.</li>
        </ol>

        <h3 className="text-xl font-bold mb-3">Content Update Strategy</h3>
        <ul className="list-disc pl-6 space-y-1 mb-6">
          <li>Refresh the homepage and location pages annually with current year, latest copy (anniversaries, etc.).</li>
          <li>Update FAQ as new common questions emerge (mine attendant feedback, email replies, social DMs).</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">Distribution Plan</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Email each new post to the newsletter list.</li>
          <li>Cross-post a teaser to Facebook (Spotless already has a FB page).</li>
          <li>Submit business posts to Google Business Profile (functions like mini blog posts and helps local pack).</li>
          <li>Add internal links from older content as new content publishes.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Prioritized Recommendations</h2>

        <h3 className="text-xl font-bold mb-3">Critical (Fix This Week — small effort, real impact)</h3>
        <ol className="list-decimal pl-6 space-y-2 mb-6">
          <li><strong>Add absolute URLs to sitemap.xml.</strong> Currently <code>/</code> instead of <code>https://spotlesscarwash.com/</code> — Google may silently ignore relative URLs. Configure <code>metadataBase</code> in <code>app/layout.tsx</code>.</li>
          <li><strong>Add <code>Sitemap:</code> declaration to robots.txt.</strong> One line, no risk.</li>
          <li><strong>Add canonical tags to every page.</strong> Set <code>metadataBase</code> and <code>alternates.canonical</code> in <code>app/layout.tsx</code> and per-page metadata.</li>
          <li><strong>Add <code>og:image</code> and <code>twitter:image</code>.</strong> Use a 1200×630 hero of the storefront or wash bay. Set in <code>app/layout.tsx</code>.</li>
          <li><strong>Fix the duplicate-brand title issue on location pages</strong> (&ldquo;Roosevelt Rd · Spotless Carwash · Forest Park, IL · Spotless Carwash&rdquo;). Drop brand from per-page title OR drop <code>titleTemplate</code>.</li>
        </ol>

        <h3 className="text-xl font-bold mb-3">High Priority (This Month)</h3>
        <ol start={6} className="list-decimal pl-6 space-y-2 mb-6">
          <li><strong>Rewrite homepage H1 to lead with the keyword:</strong> <em>&ldquo;Forest Park&apos;s Touchless Car Wash&rdquo;</em> (or similar) instead of <em>&ldquo;Spotless Carwash — keep it clean.&rdquo;</em> Tagline can move to a subhead.</li>
          <li><strong>Build out location pages with neighborhood content</strong> (~400–600 words per page about the surrounding area, embedded Google map, location-specific photo gallery, location-specific reviews).</li>
          <li><strong>Embed Google Business Profile reviews</strong> on homepage and location pages. Adds review signal and addresses E-E-A-T trust gap.</li>
          <li><strong>Audit and improve image alt text</strong> across all <code>Image</code> components. Be descriptive and include keywords naturally.</li>
          <li><strong>Rename <code>madison-loaction.jpg</code> → <code>madison-location.jpg</code>.</strong> Tiny SEO + correctness win.</li>
        </ol>

        <h3 className="text-xl font-bold mb-3">Medium Priority (This Quarter)</h3>
        <ol start={11} className="list-decimal pl-6 space-y-2 mb-6">
          <li><strong>Launch the blog/content layer.</strong> Start with the &ldquo;touchless vs. brush&rdquo; flagship post. Cadence: 1/month.</li>
          <li><strong>Add an <code>/about</code> page with the 30-year story.</strong> Founder/family photo, why touchless, why two locations. Strongest E-E-A-T move available.</li>
          <li><strong>Add <code>BreadcrumbList</code> schema</strong> to location and FAQ pages.</li>
          <li><strong>Add <code>Review</code> / <code>AggregateRating</code> schema</strong> once Google reviews are pulled in.</li>
          <li><strong>Build a <code>/pricing</code> page</strong> as an SEO-targeted alternative to the homepage anchor — captures explicit pricing queries.</li>
          <li><strong>Build a <code>/touchless-vs-brush</code> comparison page</strong> — captures the highest-intent informational query in the category.</li>
        </ol>

        <h3 className="text-xl font-bold mb-3">Low Priority (When Resources Allow)</h3>
        <ol start={17} className="list-decimal pl-6 space-y-2">
          <li><strong>Add <code>/privacy</code> and <code>/terms</code> pages.</strong> Trust signal + occasional E-E-A-T benefit.</li>
          <li><strong>Convert dial steps <code>&lt;div&gt;</code> to <code>&lt;ol&gt;</code></strong> for cleaner list-snippet eligibility (in addition to the existing HowTo schema).</li>
          <li><strong>Add a comparison table</strong> for wash packages with semantic <code>&lt;table&gt;</code> markup (alongside the existing visual cards).</li>
          <li><strong>Add a sitewide &ldquo;Areas Served&rdquo; footer block</strong> listing Forest Park, Oak Park, River Forest, Berwyn, Maywood, Cicero, with each linking to a future area page.</li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Summary Score Sheet</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Category</th>
                <th className="text-left py-2 pr-4">Score</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Title Tags</td><td className="py-2 pr-4">7/10</td><td className="py-2">Mostly good; location duplication issue</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Meta Descriptions</td><td className="py-2 pr-4">9/10</td><td className="py-2">Excellent</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Headings</td><td className="py-2 pr-4">7/10</td><td className="py-2">Good structure; H1 keyword optimization opportunity</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Image Optimization</td><td className="py-2 pr-4">6/10</td><td className="py-2">Strong responsive setup; alt text + OG image gaps</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Internal Linking</td><td className="py-2 pr-4">6/10</td><td className="py-2">Adequate now; no content layer to support deep linking</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">URL Structure</td><td className="py-2 pr-4">9/10</td><td className="py-2">Clean</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Canonical</td><td className="py-2 pr-4">3/10</td><td className="py-2">Missing</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Schema Markup</td><td className="py-2 pr-4">9/10</td><td className="py-2"><strong>Genuinely strong</strong> — major correction from prior audit</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">robots/sitemap</td><td className="py-2 pr-4">5/10</td><td className="py-2">Both exist; sitemap uses relative URLs</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Mobile Friendliness</td><td className="py-2 pr-4">9/10</td><td className="py-2">Solid</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Content Depth</td><td className="py-2 pr-4">4/10</td><td className="py-2">No blog/content layer</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">E-E-A-T</td><td className="py-2 pr-4">6/10</td><td className="py-2">Trust foundation present; Experience and Authority underdeveloped</td></tr>
              <tr className="border-t-2 border-ink font-bold"><td className="py-2 pr-4">Overall</td><td className="py-2 pr-4">70/100</td><td className="py-2">Grade: B–</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Sources</h2>
        <ul className="list-disc pl-6 space-y-1 text-sm break-words">
          <li>Page HTML directly inspected via curl</li>
          <li>robots.txt: https://spotless-carwash-git-main-center-point-digital.vercel.app/robots.txt</li>
          <li>sitemap.xml: https://spotless-carwash-git-main-center-point-digital.vercel.app/sitemap.xml</li>
          <li>Cross-referenced findings with <code>MARKETING-AUDIT.md</code> (corrected the schema/structured-data finding) and <code>COMPETITOR-REPORT.md</code> (for keyword/positioning gaps)</li>
        </ul>
      </section>

      <footer className="border-t border-ink/20 pt-6 mt-12 text-sm text-ink/60 italic">
        Created by Center Point Digital LLC — <code>/market seo</code>
      </footer>
    </article>
  )
}

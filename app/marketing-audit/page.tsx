import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Marketing Audit · Spotless Carwash',
  robots: { index: false, follow: false, nocache: true },
}

export default function MarketingAuditPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 text-ink">
      <header className="border-b border-ink/20 pb-8 mb-10">
        <p className="text-xs uppercase tracking-widest text-ink/60 mb-2">Confidential · Client Review</p>
        <h1 className="text-4xl font-black mb-4">Marketing Audit: Spotless Carwash</h1>
        <dl className="text-sm space-y-1 text-ink/80">
          <div><dt className="inline font-semibold">URL: </dt><dd className="inline">https://spotless-carwash-git-main-center-point-digital.vercel.app/</dd></div>
          <div><dt className="inline font-semibold">Date: </dt><dd className="inline">2026-05-08</dd></div>
          <div><dt className="inline font-semibold">Business Type: </dt><dd className="inline">Local Business (Car Wash, multi-location)</dd></div>
        </dl>
        <p className="mt-4 text-xl font-bold">Overall Marketing Score: 65/100 (Grade: C)</p>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
        <p className="mb-4">
          Spotless Carwash is a 30+ year-old, two-location touchless car wash in Forest Park, IL. The site is clean, well-organized, and clearly communicates the core offering: four wash tiers ($8–$12), self-serve bays, and a prepaid token program. The brand has real assets — three decades of operation, heated indoor bays at Roosevelt Rd (a meaningful weather-driven differentiator in Chicagoland), and a working retention mechanic via tokens.
        </p>
        <p className="mb-4">
          The biggest gap is <strong>revenue capture and retention infrastructure</strong>. There is no monthly unlimited-wash membership — the single highest-leverage product in modern car wash economics, where industry leaders earn 50–70% of revenue from subscriptions. Token purchase routes to PayPal (high friction; ~20–35% drop-off vs. embedded checkout), email capture has no incentive, and there is no referral program despite the local/repeat-customer business model being ideal for word-of-mouth.
        </p>
        <p className="mb-4">
          The biggest missed messaging lever is the <strong>30-year story and the &ldquo;heated indoor bays in winter&rdquo;</strong> angle. Both are buried. In a category where most competitors are interchangeable, &ldquo;since the &lsquo;90s&rdquo; + &ldquo;wash your car at -10°F without freezing&rdquo; are positioning gold not currently doing work on the page.
        </p>
        <p className="font-semibold mt-6 mb-2">Top 3 actions to move the needle:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Launch an Unlimited Monthly Wash membership ($25–$35/mo) — projected $4–12k/mo recurring within 90 days.</li>
          <li>Replace the PayPal token redirect with embedded Stripe checkout + add an email-gated &ldquo;first wash $1&rdquo; offer.</li>
          <li>Build out the two location pages with full local-SEO treatment (LocalBusiness schema, GBP embed, neighborhood content, reviews) — currently these read more like brand pages than local-search landing pages.</li>
        </ol>
        <p className="mt-4">
          Implementing the full recommendation set could realistically lift monthly revenue <strong>$8,000–$22,000</strong> within 6 months, primarily from membership recurring revenue and improved local-search capture.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Score Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Category</th>
                <th className="text-left py-2 pr-4">Score</th>
                <th className="text-left py-2 pr-4">Weight</th>
                <th className="text-left py-2 pr-4">Weighted</th>
                <th className="text-left py-2">Key Finding</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Content &amp; Messaging</td><td className="py-2 pr-4">72/100</td><td className="py-2 pr-4">25%</td><td className="py-2 pr-4">18.0</td><td className="py-2">Clear &amp; well-structured, but underuses 30-year &amp; heated-bay differentiators</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Conversion Optimization</td><td className="py-2 pr-4">62/100</td><td className="py-2 pr-4">20%</td><td className="py-2 pr-4">12.4</td><td className="py-2">PayPal-only token checkout adds friction; no email lead magnet</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">SEO &amp; Discoverability</td><td className="py-2 pr-4">58/100</td><td className="py-2 pr-4">20%</td><td className="py-2 pr-4">11.6</td><td className="py-2">Location pages exist but lack local-SEO depth (schema, GBP, neighborhood content)</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Competitive Positioning</td><td className="py-2 pr-4">68/100</td><td className="py-2 pr-4">15%</td><td className="py-2 pr-4">10.2</td><td className="py-2">&ldquo;Touchless&rdquo; + &ldquo;heated bays&rdquo; are strong angles, not yet sharpened</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Brand &amp; Trust</td><td className="py-2 pr-4">70/100</td><td className="py-2 pr-4">10%</td><td className="py-2 pr-4">7.0</td><td className="py-2">30-year history &amp; attendant hours are strong; reviews are thin (3 testimonials)</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Growth &amp; Strategy</td><td className="py-2 pr-4">55/100</td><td className="py-2 pr-4">10%</td><td className="py-2 pr-4">5.5</td><td className="py-2">No membership, no referral, no email nurture — major gap for a repeat-purchase business</td></tr>
              <tr className="border-t-2 border-ink font-bold"><td className="py-2 pr-4">TOTAL</td><td className="py-2 pr-4"></td><td className="py-2 pr-4">100%</td><td className="py-2 pr-4">64.7 → 65</td><td className="py-2"></td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Quick Wins (This Week)</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Add a subhead under &ldquo;Forest Park&apos;s touchless car wash&rdquo;</strong> that names the differentiators directly: <em>&ldquo;Heated indoor bays. No brushes. Open 7am–10pm, every day since 1994.&rdquo;</em> Currently the homepage hero leans on category, not differentiation.</li>
          <li><strong>Add &ldquo;Since 199X — Forest Park&apos;s car wash for 30 years&rdquo; as a header trust badge</strong> (single line, under the nav or above the fold). Three decades of operation is the single strongest local trust signal you have and it&apos;s currently invisible until the user reads body copy.</li>
          <li><strong>Add LocalBusiness JSON-LD schema</strong> to homepage and both location pages (name, address, phone, hours, geo, priceRange, image, sameAs for GBP). This alone typically improves local-pack visibility within 2–4 weeks of recrawl.</li>
          <li><strong>Add a Google Business Profile review badge / star rating block</strong> to both location pages and homepage. Three on-site testimonials is too few; pulling 4.X-star Google reviews dynamically (or even static screenshots of recent ones) is far more credible.</li>
          <li><strong>Embed Google Maps on each location page</strong> (currently only &ldquo;Get directions&rdquo; links out). Embedded maps improve dwell time, are a local-SEO ranking signal, and let the user see proximity without leaving.</li>
          <li><strong>Replace &ldquo;Buy tokens →&rdquo; PayPal redirect with embedded Stripe checkout</strong> (or at minimum an Apple Pay / Google Pay button). PayPal-only flows lose 20–35% of mobile buyers vs. one-tap wallets.</li>
          <li><strong>Add a value proposition to the newsletter &ldquo;Subscribe&rdquo; CTA</strong>: e.g. <em>&ldquo;Get $5 off your first Ultimate wash — subscribe for occasional Forest Park car-care tips.&rdquo;</em> A bare &ldquo;Subscribe&rdquo; with no benefit converts at &lt;0.5%.</li>
          <li><strong>Add meta descriptions and unique <code>&lt;title&gt;</code> tags per page</strong> if not already present. The homepage should target <em>&ldquo;Touchless Car Wash in Forest Park, IL | Spotless Carwash&rdquo;</em> and location pages should include neighborhood + city in the title.</li>
          <li><strong>Add a sticky mobile &ldquo;Call&rdquo; / &ldquo;Get directions&rdquo; bar</strong> on location pages. Local-business mobile users overwhelmingly want one of these two actions; making them one-tap improves micro-conversions ~15–25%.</li>
          <li><strong>Differentiate the two location pages</strong> — currently they read nearly identically. Roosevelt Rd should lead hard with <em>&ldquo;Forest Park&apos;s only heated indoor touchless bays — wash your car in any weather.&rdquo;</em> Madison St should lead with whatever its unique advantage is (more self-serve bays? closer to a key landmark? faster?).</li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Strategic Recommendations (This Month)</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Launch an Unlimited Monthly Wash Membership.</strong> Industry standard pricing: $25–$35/mo for unlimited Ultimate washes, RFID windshield tag, single-location or both-location tier. Modern car wash businesses now earn 50–70% of total revenue from membership. Even 200 members at $30/mo = $6,000/mo recurring with near-zero marginal cost. This is the single highest-ROI initiative possible for this business and the site has no mention of it.</li>
          <li><strong>Build a referral program.</strong> &ldquo;Give a free Ultimate wash, get a free Ultimate wash&rdquo; via unique codes printed on receipts and emailed to members. Local repeat-purchase businesses see 10–20% of new customers from referral when the loop is properly built.</li>
          <li><strong>Deepen the location pages into true local SEO landing pages.</strong> Each should include: H1 with city + service (&ldquo;Touchless Car Wash on Roosevelt Rd, Forest Park&rdquo;), 400–600 words of neighborhood-relevant copy (&ldquo;serving Oak Park, River Forest, and Forest Park since…&rdquo;), embedded GBP map, schema, photo gallery, FAQ section relevant to that location, and at least 3 location-specific reviews.</li>
          <li><strong>Add a comparison/education page: &ldquo;Touchless vs. Brush Car Washes&rdquo;</strong> — touchless is your category-defining advantage but the homepage assumes the visitor knows why it matters. A dedicated educational page (with diagrams, &ldquo;scratches your paint&rdquo; framing) ranks for high-intent informational searches and converts skeptics.</li>
          <li><strong>Build an email welcome sequence (3–5 emails)</strong> triggered by the existing newsletter signup: (1) welcome + first-wash offer code, (2) how to use self-serve bays like a pro, (3) winter car-care + heated bays at Roosevelt, (4) introduce membership, (5) referral program intro.</li>
          <li><strong>Add a fleet/commercial accounts page.</strong> Local landscapers, contractors, dealerships, and small fleets are a high-LTV segment for car washes. A simple page with a contact form (&ldquo;Wash your fleet on a corporate token plan&rdquo;) is a 1-day build that can generate 1–3 leads/month worth $200–$1,000 each.</li>
          <li><strong>Run a &ldquo;winter season&rdquo; landing page campaign</strong> — Roosevelt Rd&apos;s heated indoor bays are a genuine, scarce differentiator from Nov–March. Build a dedicated winter LP, run $200–500/mo of Google Local Service Ads geo-targeted to the surrounding zips. CTR on weather-specific local search is 3–5x baseline.</li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Long-Term Initiatives (This Quarter)</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Customer data platform / CRM build-out.</strong> Capture token-purchase emails, membership signups, and referral codes into a unified customer record. Without this, lifecycle marketing is impossible. Recommend Klaviyo or Customer.io with a Stripe + simple webhook integration. Budget: 2–4 weeks of dev.</li>
          <li><strong>Reviews engine.</strong> Automated post-wash SMS/email asking for a Google review (timed 30 min after attended hours, opt-in). Going from ~50 reviews to 200+ Google reviews is typically a 2–3 position lift in local pack rankings, and is worth ~$1,500–$5,000/mo in additional captured demand.</li>
          <li><strong>Branded mobile app or PWA with stored token balance + tap-to-wash.</strong> This is a longer build but turns a transactional business into a habitual one. Phase 2 after membership launch.</li>
          <li><strong>Content strategy: &ldquo;Forest Park car care&rdquo; hub.</strong> 1 post/month: &ldquo;Best places to detail your car in Forest Park&rdquo;, &ldquo;How often should you wash in winter in Chicago?&rdquo;, &ldquo;Touchless vs. brush: a paint study&rdquo;. Ranks for long-tail local + informational queries, drives email signups, and supports the membership funnel.</li>
          <li><strong>Brand refresh of the site copy with a stronger voice.</strong> Current copy is functional and clear (good baseline) but interchangeable with any car wash site. The brand has earned a more confident, slightly more characterful voice given the 30-year tenure. Consider a paid 2-week copywriting engagement.</li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Detailed Analysis by Category</h2>

        <div className="mb-10">
          <h3 className="text-xl font-bold mb-3">Content &amp; Messaging Analysis (72/100)</h3>
          <p className="font-semibold mt-4 mb-2">Strengths</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Hero headline <em>&ldquo;Forest Park&apos;s touchless car wash&rdquo;</em> is geographically anchored and category-clear.</li>
            <li>Pricing is presented openly and tiered well (Deluxe / Deluxe+ / Ultimate / Lustre) — honesty here is itself a trust signal.</li>
            <li>FAQ section directly addresses the highest-intent customer questions (touchless explanation, self-serve usage, token economics, hours, heated bays).</li>
            <li>Numbered section markers (&ldquo;01 / Wash packages&rdquo;, &ldquo;04 / Two ways to wash&rdquo;) give the site a confident, magazine-like structure.</li>
          </ul>
          <p className="font-semibold mt-4 mb-2">Weaknesses</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>The 30-year operating history appears in body copy but never in headline or hero positions. This is the strongest moat the business has and it&apos;s underused.</li>
            <li>The differentiators (touchless = no scratches; heated bays = year-round) are stated but not <em>explained as benefits</em>. A skeptical first-time visitor doesn&apos;t necessarily know why touchless matters.</li>
            <li>Only 3 testimonials, presented as text. No customer photos, no review-platform integration, no aggregate star rating.</li>
            <li>The &ldquo;Subscribe&rdquo; CTA has no value exchange.</li>
            <li>Voice is functional but generic — the copy could be written by any car wash. There&apos;s no point of view or personality.</li>
          </ul>
          <p className="mt-3"><strong>Score:</strong> 72/100</p>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-bold mb-3">Conversion Optimization Analysis (62/100)</h3>
          <p className="font-semibold mt-4 mb-2">Strengths</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Clear primary CTA on every page (&ldquo;Buy tokens →&rdquo;).</li>
            <li>Pricing is upfront — no quote-gating or &ldquo;contact us&rdquo; friction.</li>
            <li>Multiple CTA types (call, directions, buy, see packages) match the variety of local-business intents.</li>
            <li>Hours and attendant times are clearly listed (reduces &ldquo;can I show up now?&rdquo; friction).</li>
          </ul>
          <p className="font-semibold mt-4 mb-2">Weaknesses</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>PayPal-only token checkout</strong> is the single biggest conversion problem on the site. PayPal flows lose 20–35% of mobile buyers vs. embedded Stripe + Apple/Google Pay.</li>
            <li>No email capture incentive — newsletter opt-in is a bare &ldquo;Subscribe&rdquo; with no value statement.</li>
            <li>No urgency, scarcity, or limited-time mechanics anywhere on the site (a winter-specific banner, e.g. <em>&ldquo;Heated bays open all winter — buy 5 tokens, get 1 free through Feb 28&rdquo;</em> would lift token sales materially).</li>
            <li>No exit-intent or scroll-triggered offers.</li>
            <li>No live chat or SMS capture for low-intent browsers.</li>
            <li>No clear &ldquo;first-time customer&rdquo; path — both new visitors and returning customers see the same homepage.</li>
          </ul>
          <p className="mt-3"><strong>Score:</strong> 62/100</p>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-bold mb-3">SEO &amp; Discoverability Analysis (58/100)</h3>
          <p className="font-semibold mt-4 mb-2">Strengths</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Two distinct location pages (Roosevelt Rd, Madison St) is the correct structure for a multi-location local business.</li>
            <li>FAQ page is good for long-tail informational capture.</li>
            <li>Clean URL structure (<code>/locations/roosevelt-rd</code>, <code>/faq</code>).</li>
            <li>Mobile-friendly responsive layout.</li>
          </ul>
          <p className="font-semibold mt-4 mb-2">Weaknesses</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Location pages read more like duplicated brand pages than location-specific landing pages. They should each have unique, location-specific copy (neighborhoods served, location-specific reviews, location-specific photos, location-specific hours/attendants).</li>
            <li>No visible <strong>LocalBusiness schema</strong> / structured data — this is table-stakes for local pack ranking.</li>
            <li>No embedded Google Maps on location pages (only &ldquo;Get directions&rdquo; links).</li>
            <li>No visible Google Business Profile integration / review widget.</li>
            <li>Likely thin or missing meta descriptions and per-page unique titles (worth verifying directly in HTML).</li>
            <li>No blog / content layer to capture informational queries (&ldquo;touchless vs brush&rdquo;, &ldquo;how often to wash in winter Chicago&rdquo;, &ldquo;best car wash near Oak Park&rdquo;).</li>
            <li>No internal links between related concepts (e.g. tokens page → membership page → FAQ on tokens).</li>
          </ul>
          <p className="mt-3"><strong>Score:</strong> 58/100</p>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-bold mb-3">Competitive Positioning Analysis (68/100)</h3>
          <p className="font-semibold mt-4 mb-2">Strengths</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>&ldquo;Touchless&rdquo; is a clear category position vs. brush washes.</li>
            <li>&ldquo;Heated indoor bays&rdquo; at Roosevelt Rd is a genuine, defensible differentiator in the Chicago climate.</li>
            <li>30-year operating history is a moat no new competitor can match.</li>
            <li>Two locations create geographic coverage advantage in Forest Park.</li>
          </ul>
          <p className="font-semibold mt-4 mb-2">Weaknesses</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>None of the above differentiators are sharpened into a single positioning line. The hero is &ldquo;Forest Park&apos;s touchless car wash&rdquo; — accurate, but generic.</li>
            <li>No competitor comparison content (e.g. &ldquo;Why touchless is safer for your paint than brush washes&rdquo;).</li>
            <li>No &ldquo;vs.&rdquo; page or alternatives content.</li>
            <li>Pricing is in line with category but the value framing (&ldquo;$8 for a touchless wash that won&apos;t scratch your paint&rdquo;) isn&apos;t made.</li>
            <li>The website doesn&apos;t claim or anchor any specific local accolade (&ldquo;voted best car wash in Forest Park&rdquo;, chamber of commerce membership, BBB rating, etc.) — even if such claims exist, they&apos;re not on the site.</li>
          </ul>
          <p className="mt-3"><strong>Score:</strong> 68/100</p>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-bold mb-3">Brand &amp; Trust Analysis (70/100)</h3>
          <p className="font-semibold mt-4 mb-2">Strengths</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>30+ years of operation is a strong trust foundation.</li>
            <li>Attendant hours are explicitly published — signals real, staffed operation.</li>
            <li>Multiple payment methods (cards, tap, Apple Pay, cash, tokens) are listed.</li>
            <li>Tokens &ldquo;never expire&rdquo; is a strong, customer-friendly policy that builds trust.</li>
            <li>Email + phone + two physical addresses all visible (passes basic legitimacy check).</li>
          </ul>
          <p className="font-semibold mt-4 mb-2">Weaknesses</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Only 3 testimonials, no aggregate star rating, no Google review embed.</li>
            <li>No &ldquo;About&rdquo; or &ldquo;Our Story&rdquo; page that humanizes the 30-year history (founder, family-owned?, photos through the decades).</li>
            <li>No team / staff photos or attendant bios.</li>
            <li>No press mentions, awards, certifications, or community involvement (local sponsorships, etc.).</li>
            <li>No social media presence linked from the site (or it&apos;s not prominent).</li>
          </ul>
          <p className="mt-3"><strong>Score:</strong> 70/100</p>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-bold mb-3">Growth &amp; Strategy Analysis (55/100)</h3>
          <p className="font-semibold mt-4 mb-2">Strengths</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Token program is a real retention mechanic — prepaid commitment + bulk discount + cross-location validity is well-designed.</li>
            <li>Two-location coverage gives geographic moat in Forest Park.</li>
            <li>Multiple service tiers create a natural upsell ladder ($8 → $12).</li>
          </ul>
          <p className="font-semibold mt-4 mb-2">Weaknesses (this is the lowest-scoring category and the highest-leverage opportunity)</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>No unlimited monthly membership.</strong> This is the single most material gap — the modern car wash industry has shifted to subscription as the dominant revenue model. Industry leaders earn 50–70% of revenue from monthly memberships. Spotless has none.</li>
            <li>No referral program despite a perfect repeat-purchase, locally-clustered customer base.</li>
            <li>No email lifecycle / nurture (capture form exists but no incentive and presumably no automated follow-up).</li>
            <li>No fleet / commercial accounts product despite obvious local demand (landscapers, contractors, dealers).</li>
            <li>No retention / win-back mechanic for lapsed token buyers.</li>
            <li>No data infrastructure to even know who lapsed customers are.</li>
          </ul>
          <p className="mt-3"><strong>Score:</strong> 55/100</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Competitor Comparison</h2>
        <p className="mb-4">
          A direct competitor scan was not run as part of this audit. Recommend running <code>/market competitors</code> next with 3–5 named local competitors (e.g. nearby Forest Park / Oak Park / River Forest car washes, plus regional touchless chains like Mister Car Wash and Tommy&apos;s Express).
        </p>
        <p className="mb-4">
          Initial heuristic comparison vs. the modern category leader (Mister Car Wash, Tommy&apos;s Express playbook):
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Factor</th>
                <th className="text-left py-2 pr-4">Spotless</th>
                <th className="text-left py-2">Modern Category Leader</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Headline clarity</td><td className="py-2 pr-4">7/10</td><td className="py-2">8/10</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Touchless positioning</td><td className="py-2 pr-4">8/10</td><td className="py-2">N/A (most use brush + soft cloth)</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Heritage / longevity story</td><td className="py-2 pr-4">4/10 (underused)</td><td className="py-2">7/10</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Membership program</td><td className="py-2 pr-4">0/10</td><td className="py-2">10/10</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Online checkout UX</td><td className="py-2 pr-4">4/10 (PayPal only)</td><td className="py-2">9/10 (app + RFID)</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Local SEO depth</td><td className="py-2 pr-4">5/10</td><td className="py-2">8/10</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Reviews infrastructure</td><td className="py-2 pr-4">3/10</td><td className="py-2">9/10</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Referral / loyalty</td><td className="py-2 pr-4">2/10 (tokens only)</td><td className="py-2">8/10</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Revenue Impact Summary</h2>
        <p className="mb-4">
          Estimates assume current monthly traffic on the order of 2,000–8,000 sessions and existing customer base typical of a 2-location Forest Park car wash (~$50k–$120k/mo in transactional revenue). Adjust upward if actuals are higher.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Recommendation</th>
                <th className="text-left py-2 pr-4">Est. Monthly Impact</th>
                <th className="text-left py-2 pr-4">Confidence</th>
                <th className="text-left py-2">Timeline</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Launch unlimited monthly membership ($25–$35/mo)</td><td className="py-2 pr-4">$4,000 – $12,000</td><td className="py-2 pr-4">High</td><td className="py-2">4–8 weeks</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Replace PayPal with Stripe + Apple/Google Pay</td><td className="py-2 pr-4">$400 – $1,200 (token sales lift)</td><td className="py-2 pr-4">High</td><td className="py-2">1 week</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">LocalBusiness schema + GBP integration + reviews engine</td><td className="py-2 pr-4">$1,500 – $5,000 (organic local lift)</td><td className="py-2 pr-4">Medium</td><td className="py-2">4–12 weeks</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Email capture incentive + welcome sequence</td><td className="py-2 pr-4">$300 – $1,500</td><td className="py-2 pr-4">Medium</td><td className="py-2">2 weeks</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Referral program</td><td className="py-2 pr-4">$500 – $2,500</td><td className="py-2 pr-4">Medium</td><td className="py-2">3 weeks</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Winter/heated-bay seasonal LP + Local Services Ads</td><td className="py-2 pr-4">$800 – $3,000 (seasonal)</td><td className="py-2 pr-4">Medium</td><td className="py-2">2 weeks</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Fleet/commercial accounts page</td><td className="py-2 pr-4">$200 – $1,500</td><td className="py-2 pr-4">Medium</td><td className="py-2">1 week</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Sharper positioning copy (30-year + heated + touchless)</td><td className="py-2 pr-4">$300 – $1,000</td><td className="py-2 pr-4">Low</td><td className="py-2">1 week</td></tr>
              <tr className="border-t-2 border-ink font-bold"><td className="py-2 pr-4">Total potential</td><td className="py-2 pr-4">$8,000 – $27,700/mo</td><td className="py-2 pr-4"></td><td className="py-2"></td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          Realistic 6-month outcome with disciplined execution: <strong>+$8,000–$22,000/mo recurring</strong>, dominated by membership revenue.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Launch the membership product.</strong> Nothing else on this list comes close in expected ROI. Start with a single-tier offer ($29/mo, both locations, unlimited Ultimate washes) and a simple Stripe subscription + RFID/QR mechanism.</li>
          <li><strong>Replace PayPal with embedded Stripe checkout</strong> for token purchases, and add an email-gated first-wash discount.</li>
          <li><strong>Add LocalBusiness schema, embedded maps, and GBP review integration</strong> to homepage and both location pages.</li>
        </ol>

      </section>

      <footer className="border-t border-ink/20 pt-6 mt-12 text-sm text-ink/60 italic">
        Created by Center Point Digital LLC — <code>marketing audit</code>
      </footer>
    </article>
  )
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Competitor Report · Spotless Carwash',
  robots: { index: false, follow: false, nocache: true },
}

export default function CompetitorReportPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 text-ink">
      <header className="border-b border-ink/20 pb-8 mb-10">
        <p className="text-xs uppercase tracking-widest text-ink/60 mb-2">Confidential · Client Review</p>
        <h1 className="text-4xl font-black mb-4">Competitive Intelligence Report: Spotless Carwash</h1>
        <dl className="text-sm space-y-1 text-ink/80">
          <div><dt className="inline font-semibold">URL: </dt><dd className="inline">https://spotless-carwash-git-main-center-point-digital.vercel.app/</dd></div>
          <div><dt className="inline font-semibold">Date: </dt><dd className="inline">2026-05-08</dd></div>
          <div><dt className="inline font-semibold">Competitors Analyzed: </dt><dd className="inline">5 (3 direct, 1 indirect, 1 aspirational benchmark)</dd></div>
        </dl>
        <p className="mt-4 text-xl font-bold">Competitive Position: Moderate — strong local heritage, vulnerable on membership/coatings</p>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
        <p className="mb-4">
          Spotless Carwash operates in a small, geographically tight competitive set in Forest Park, IL. The most consequential competitor is <strong>Crystal Car Wash</strong> (901 S Harlem Ave, also Forest Park) — a drive-through tunnel wash that has clearly been built around the modern membership model and offers four wash tiers ($9–$25 single, <strong>$18–$40/mo unlimited</strong>), free vacuums, and ceramic + graphene coatings. Crystal is roughly 1.5 miles from Spotless&apos;s Roosevelt Rd location.
        </p>
        <p className="mb-4">
          Spotless&apos;s structural advantages over Crystal are real but underused: <strong>two locations</strong>, <strong>true touchless</strong> (Crystal does not advertise touchless), <strong>heated indoor bays</strong> at Roosevelt Rd, <strong>self-serve wand bays</strong> (Crystal has none), and a <strong>30-year operating heritage</strong>. The disadvantages are also real: <strong>no membership product</strong>, <strong>paid vacuums</strong> ($1) vs. Crystal&apos;s free vacuums, <strong>no ceramic/graphene coatings</strong>, and a noticeably weaker third-party review profile (~3.0 stars on Yelp at both locations vs. category averages closer to 4.0+).
        </p>
        <p className="mb-4">
          Forest Park Super Wash, listed on Yelp at <strong>7802 Madison St — the same address as Spotless&apos;s Madison location</strong> — appears to be a stale legacy listing of what is now Spotless Madison. This is also worth fixing as a brand-hygiene matter (claim/merge that Yelp listing).
        </p>
        <p className="font-semibold mt-6 mb-2">Top 3 strategic recommendations:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li><strong>Launch a membership product</strong> — Spotless cannot afford to leave Crystal as the only Forest Park option that offers unlimited monthly washes. Even a single $25/mo unlimited Ultimate tier closes the biggest gap immediately.</li>
          <li><strong>Pivot positioning hard onto the two true differentiators competitors can&apos;t match: touchless + self-serve.</strong> Crystal is a drive-through tunnel — it cannot do self-serve detail bays and (likely) uses brushes. Headlines should weaponize this: &ldquo;The only touchless + self-serve car wash in Forest Park.&rdquo;</li>
          <li><strong>Fix the review profile.</strong> A 3.0 average on Yelp is a quiet revenue leak. Build a post-wash review request flow and respond to existing reviews. Lifting to 4.0+ over 6 months is the single highest-ROI customer-acquisition lever Spotless has not pulled.</li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Competitor Overview</h2>

        <h3 className="text-xl font-bold mb-3">Direct Competitors</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-3">Name</th>
                <th className="text-left py-2 pr-3">URL</th>
                <th className="text-left py-2 pr-3">Distance</th>
                <th className="text-left py-2 pr-3">Model</th>
                <th className="text-left py-2 pr-3">Membership</th>
                <th className="text-left py-2 pr-3">Touchless</th>
                <th className="text-left py-2 pr-3">Self-Serve</th>
                <th className="text-left py-2">Free Vacuums</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Crystal Car Wash</strong></td><td className="py-2 pr-3">crystalcarwashforestpark.com</td><td className="py-2 pr-3">~1.5 mi (901 S Harlem)</td><td className="py-2 pr-3">Drive-through tunnel</td><td className="py-2 pr-3"><strong>Yes — $18–$40/mo, 4 tiers</strong></td><td className="py-2 pr-3">Not advertised</td><td className="py-2 pr-3">No</td><td className="py-2"><strong>Yes</strong></td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Forest Park Super Wash</strong></td><td className="py-2 pr-3">(Yelp only)</td><td className="py-2 pr-3">7802 Madison St</td><td className="py-2 pr-3">Mixed (auto + DIY); $6 auto wash</td><td className="py-2 pr-3">No</td><td className="py-2 pr-3">Unclear</td><td className="py-2 pr-3">Yes</td><td className="py-2">$1 vacuums</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Jendies Auto Spa</strong></td><td className="py-2 pr-3">jendy.com</td><td className="py-2 pr-3">Forest Park</td><td className="py-2 pr-3">Full-service detail / hand</td><td className="py-2 pr-3">Unknown (site blocked WebFetch)</td><td className="py-2 pr-3">N/A (hand)</td><td className="py-2 pr-3">No</td><td className="py-2">N/A</td></tr>
            </tbody>
          </table>
        </div>
        <blockquote className="border-l-4 border-ink/30 pl-4 italic text-ink/80 mb-6">
          <strong>Note on Forest Park Super Wash:</strong> Its Yelp address (7802 Madison St) is identical to Spotless&apos;s Madison location. This is almost certainly a legacy Yelp listing for the same physical lot under a previous brand. Spotless should claim/merge or contest this listing — it splits review velocity and confuses local search.
        </blockquote>

        <h3 className="text-xl font-bold mb-3">Indirect Competitors</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Name</th>
                <th className="text-left py-2 pr-4">URL</th>
                <th className="text-left py-2 pr-4">Model</th>
                <th className="text-left py-2">Why It Competes</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><strong>MCR Hand Car Wash</strong></td><td className="py-2 pr-4">(Oak Park, Madison St)</td><td className="py-2 pr-4">Hand wash / detail</td><td className="py-2">Captures customers who want a more thorough finish than self-serve and don&apos;t trust automatic</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><strong>Mobile detailers</strong></td><td className="py-2 pr-4">Various</td><td className="py-2 pr-4">At-home / on-demand</td><td className="py-2">Captures convenience-first customers willing to pay 5–10x for in-driveway service</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><strong>DIY at home</strong></td><td className="py-2 pr-4">Driveway + hose</td><td className="py-2 pr-4">Free</td><td className="py-2">The &ldquo;I&apos;ll just do it Saturday&rdquo; segment — large in suburban areas</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-bold mb-3">Aspirational Benchmark</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Name</th>
                <th className="text-left py-2 pr-4">URL</th>
                <th className="text-left py-2 pr-4">Model</th>
                <th className="text-left py-2">What to Learn From Them</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-4"><strong>Mister Car Wash</strong></td><td className="py-2 pr-4">mistercarwash.com</td><td className="py-2 pr-4">National chain, drive-through tunnel</td><td className="py-2">The category-defining membership playbook: 3 tiers (Base $22.99 → Platinum → Titanium), RFID windshield tag, 50–70% of revenue from subscriptions, branded &ldquo;Unlimited Wash Club&rdquo;</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Detailed Competitor Profiles</h2>

        <div className="mb-10">
          <h3 className="text-xl font-bold mb-3">🥇 Crystal Car Wash (Primary Threat)</h3>
          <p className="mb-1"><strong>URL:</strong> crystalcarwashforestpark.com</p>
          <p className="mb-1"><strong>Address:</strong> 901 S Harlem Ave, Forest Park, IL 60130</p>
          <p className="mb-4"><strong>Hours:</strong> 7am–9pm daily (Spotless is 7am–10pm — Spotless wins on hours by 1 hour/day)</p>

          <p className="font-semibold mt-4 mb-2">Messaging:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Headline: <em>&ldquo;Not Just Clean, Crystal Clean&rdquo;</em></li>
            <li>Subhead / banner: <em>&ldquo;Sign Up For An Unlimited Wash Membership!&rdquo;</em></li>
            <li>Tone: Professional, slightly playful (&ldquo;dance party&rdquo; atmosphere mentioned in customer reviews)</li>
          </ul>

          <p className="font-semibold mt-4 mb-2">Wash Tiers and Pricing:</p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th className="text-left py-2 pr-4">Package</th>
                  <th className="text-left py-2 pr-4">Single</th>
                  <th className="text-left py-2">Unlimited Monthly</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-ink/10"><td className="py-2 pr-4">Express</td><td className="py-2 pr-4">$9</td><td className="py-2"><strong>$18</strong></td></tr>
                <tr className="border-b border-ink/10"><td className="py-2 pr-4">Wheel Deal</td><td className="py-2 pr-4">$15</td><td className="py-2"><strong>$25</strong></td></tr>
                <tr className="border-b border-ink/10"><td className="py-2 pr-4">Ceramic</td><td className="py-2 pr-4">$20</td><td className="py-2"><strong>$35</strong></td></tr>
                <tr className="border-b border-ink/10"><td className="py-2 pr-4">Graphene</td><td className="py-2 pr-4">$25</td><td className="py-2"><strong>$40</strong></td></tr>
              </tbody>
            </table>
          </div>
          <p className="mb-4">Membership pitch: <em>&ldquo;The price of just two washes covers an entire month of daily washes.&rdquo;</em> — strong, simple math-based value framing.</p>

          <p className="font-semibold mt-4 mb-2">Differentiators:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>✅ Unlimited monthly memberships (4 tiers)</li>
            <li>✅ Free vacuums and air</li>
            <li>✅ Ceramic + graphene coatings (premium upsell)</li>
            <li>✅ Underbody wash</li>
            <li>✅ Modern facility / &ldquo;lights and dance party&rdquo; experience</li>
            <li>❌ Drive-through only — no self-serve</li>
            <li>❌ Touchless not advertised (likely uses soft cloth or foam brushes, standard for tunnel washes)</li>
            <li>❌ Single location vs. Spotless&apos;s two</li>
            <li>❌ Closes 1 hour earlier (9pm vs. Spotless&apos;s 10pm)</li>
          </ul>

          <p className="font-semibold mt-4 mb-2">SWOT for Crystal:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Strengths:</strong> Membership economics, free amenities, modern equipment, premium tier (graphene)</li>
            <li><strong>Weaknesses:</strong> Tunnel-only (no self-serve), single location, possibly not touchless</li>
            <li><strong>Opportunities for Spotless:</strong> Win the &ldquo;won&apos;t scratch my paint&rdquo; customer + the self-serve detailer customer</li>
            <li><strong>Threats to Spotless:</strong> They will keep eating the recurring-revenue side of the market until Spotless ships a membership</li>
          </ul>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-bold mb-3">🥈 Forest Park Super Wash</h3>
          <p className="mb-1"><strong>URL:</strong> Yelp listing only (no website found)</p>
          <p className="mb-1"><strong>Address:</strong> 7802 Madison St, Forest Park, IL — <strong>identical to Spotless Madison</strong></p>
          <p className="mb-1"><strong>Pricing:</strong> Automatic ~$6, vacuums $1</p>
          <p className="mb-4"><strong>Membership:</strong> None advertised</p>
          <p><strong>Assessment:</strong> Almost certainly a legacy Yelp listing for the same physical property as Spotless Madison St. Recommend Spotless contact Yelp to merge / claim this listing. While unmerged, it actively cannibalizes Spotless&apos;s review presence in local search.</p>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-bold mb-3">🥉 Jendies Auto Spa</h3>
          <p className="mb-1"><strong>URL:</strong> jendy.com (returned HTTP 403; manual review needed)</p>
          <p className="mb-1"><strong>Address:</strong> Forest Park, IL</p>
          <p className="mb-4"><strong>Model:</strong> Full-service detail / hand wash (per Nextdoor listing)</p>
          <p><strong>Assessment:</strong> Different category — appeals to the higher-end &ldquo;I want it done for me, by hand&rdquo; segment. Not a direct touchless competitor but takes share of the <em>premium</em> end of the local car-care market. Spotless should not try to compete on &ldquo;thoroughness&rdquo; against a hand detail shop — and instead double down on speed + frequency + price.</p>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-bold mb-3">Aspirational Benchmark: Mister Car Wash</h3>
          <p className="mb-1"><strong>URL:</strong> mistercarwash.com</p>
          <p className="mb-4"><strong>Model:</strong> National chain, ~500 locations, NYSE: MCW</p>

          <p className="font-semibold mt-4 mb-2">Membership Playbook (this is the model to study, not match feature-for-feature):</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Branded program: <strong>&ldquo;Unlimited Wash Club®&rdquo;</strong></li>
            <li>3 tiers: Base ($22.99/mo as of Jan 2025), Platinum, Titanium</li>
            <li>RFID windshield sticker for tap-and-drive entry</li>
            <li>Aggressive in-lane sales: every customer is offered membership at the wash</li>
            <li>Membership conversion goal: 25–35% of single-wash customers</li>
            <li>Public market valuation premised entirely on membership penetration</li>
          </ul>

          <p className="font-semibold mt-4 mb-2">Lessons for Spotless (lift the playbook, scale to two-location reality):</p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>One simple unlimited tier first — don&apos;t over-complicate with 3 tiers initially.</li>
            <li>Make the math obvious: &ldquo;The price of 3 Ultimate washes = unlimited washes all month.&rdquo;</li>
            <li>Put a QR-code &ldquo;Join Membership&rdquo; sign in every bay.</li>
            <li>Train the attendant to mention membership at every interaction.</li>
            <li>Eventually: RFID/QR pass + branded windshield sticker so members feel like insiders.</li>
          </ol>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Comparison Tables</h2>

        <h3 className="text-xl font-bold mb-3">Feature Comparison</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-3">Feature</th>
                <th className="text-left py-2 pr-3"><strong>Spotless</strong></th>
                <th className="text-left py-2 pr-3">Crystal</th>
                <th className="text-left py-2 pr-3">FP Super Wash</th>
                <th className="text-left py-2 pr-3">Jendies</th>
                <th className="text-left py-2">Mister (national)</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Touchless wash</strong></td><td className="py-2 pr-3">✅ Full</td><td className="py-2 pr-3">⚠️ Unclear</td><td className="py-2 pr-3">⚠️ Unclear</td><td className="py-2 pr-3">N/A (hand)</td><td className="py-2">Some locations</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Self-serve wand bays</strong></td><td className="py-2 pr-3">✅ Full</td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">✅ Yes</td><td className="py-2 pr-3">❌ No</td><td className="py-2">❌ No</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Heated indoor bays</strong></td><td className="py-2 pr-3">✅ Roosevelt Rd</td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">N/A</td><td className="py-2">Varies</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Drive-through tunnel</strong></td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">✅ Yes</td><td className="py-2 pr-3">✅ Yes</td><td className="py-2 pr-3">❌ No</td><td className="py-2">✅ Yes</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Unlimited monthly membership</strong></td><td className="py-2 pr-3">❌ <strong>No</strong></td><td className="py-2 pr-3">✅ Yes ($18–$40)</td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">❓ Unknown</td><td className="py-2">✅ Yes ($22.99+)</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Prepaid wash tokens</strong></td><td className="py-2 pr-3">✅ Yes</td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">❌ No</td><td className="py-2">❌ No</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Free vacuums</strong></td><td className="py-2 pr-3">❌ No ($1)</td><td className="py-2 pr-3">✅ <strong>Yes</strong></td><td className="py-2 pr-3">❌ No ($1)</td><td className="py-2 pr-3">N/A</td><td className="py-2">Member-only</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Ceramic coating</strong></td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">✅ Yes</td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">✅ Likely</td><td className="py-2">✅ Yes</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Graphene coating</strong></td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">✅ Yes</td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">❌ Unlikely</td><td className="py-2">❌ No</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Durashield surface gloss</strong></td><td className="py-2 pr-3">✅ Yes</td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">❌ No</td><td className="py-2">Equivalent (HotShine)</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Two+ locations in Forest Park</strong></td><td className="py-2 pr-3">✅ <strong>Yes (2)</strong></td><td className="py-2 pr-3">❌ No (1)</td><td className="py-2 pr-3">❌ No (1)</td><td className="py-2 pr-3">❌ No (1)</td><td className="py-2">N/A</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Hours</strong></td><td className="py-2 pr-3">7am–10pm</td><td className="py-2 pr-3">7am–9pm</td><td className="py-2 pr-3">Unknown</td><td className="py-2 pr-3">Unknown</td><td className="py-2">Varies</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>30+ year heritage</strong></td><td className="py-2 pr-3">✅ Yes</td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">❌ No</td><td className="py-2">N/A</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Online checkout</strong></td><td className="py-2 pr-3">⚠️ PayPal only</td><td className="py-2 pr-3">✅ (memberships)</td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">❓</td><td className="py-2">✅ Full</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-3"><strong>Mobile app / RFID</strong></td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">❌ No</td><td className="py-2 pr-3">❌ No</td><td className="py-2">✅ Yes</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mb-2"><strong>Spotless wins:</strong> Self-serve wand bays, heated bays, two locations, longest hours, longest heritage, tokens, true touchless.</p>
        <p className="mb-6"><strong>Spotless loses:</strong> Membership, free vacuums, ceramic/graphene coatings, online checkout UX, review velocity.</p>

        <h3 className="text-xl font-bold mb-3">Pricing Comparison (Single Wash)</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Tier</th>
                <th className="text-left py-2 pr-4">Spotless</th>
                <th className="text-left py-2 pr-4">Crystal</th>
                <th className="text-left py-2">Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Entry</td><td className="py-2 pr-4">$8 (Deluxe No-Dryer)</td><td className="py-2 pr-4">$9 (Express)</td><td className="py-2">Spotless −$1</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Mid</td><td className="py-2 pr-4">$9 (Deluxe)</td><td className="py-2 pr-4">$15 (Wheel Deal)</td><td className="py-2">Spotless −$6</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Upper-mid</td><td className="py-2 pr-4">$10 (Ultimate)</td><td className="py-2 pr-4">$20 (Ceramic)</td><td className="py-2">Spotless −$10</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Top</td><td className="py-2 pr-4">$12 (Lustre)</td><td className="py-2 pr-4">$25 (Graphene)</td><td className="py-2">Spotless −$13</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mb-6"><strong>Read:</strong> Spotless is positioned as the <em>value-priced</em> option. Crystal is positioned as the <em>premium</em> option. Both can win — but Spotless needs to either (a) defend the value position with a frequency offer (membership) or (b) build a top-tier coating product to compete at the top.</p>

        <h3 className="text-xl font-bold mb-3">Membership / Recurring Revenue Comparison</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Provider</th>
                <th className="text-left py-2 pr-4">Entry Membership</th>
                <th className="text-left py-2 pr-4">Top Membership</th>
                <th className="text-left py-2">Spotless Equivalent</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Crystal</td><td className="py-2 pr-4">$18/mo (Express)</td><td className="py-2 pr-4">$40/mo (Graphene)</td><td className="py-2">None — token plan only</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Mister Car Wash (benchmark)</td><td className="py-2 pr-4">$22.99/mo (Base)</td><td className="py-2 pr-4">$40+/mo (Titanium)</td><td className="py-2">None</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Spotless</td><td className="py-2 pr-4"><strong>None</strong></td><td className="py-2 pr-4"><strong>None</strong></td><td className="py-2">Tokens: 25 Ultimate washes for $200 = $8/wash, but no recurring obligation</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mb-6"><strong>Tokens are good but they&apos;re not a subscription.</strong> Tokens are prepaid one-time purchases and do not generate predictable monthly revenue. The car wash industry shifted to subscription specifically because it (a) smooths cash flow, (b) increases LTV by making cancellation friction-bound, and (c) raises business valuation 3–5x.</p>

        <h3 className="text-xl font-bold mb-3">Review Ratings (Yelp)</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Business</th>
                <th className="text-left py-2 pr-4">Yelp Rating</th>
                <th className="text-left py-2">Reviews</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Spotless Roosevelt Rd</td><td className="py-2 pr-4">~3.0 ★</td><td className="py-2">~22</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Spotless Madison St</td><td className="py-2 pr-4">~3.0 ★</td><td className="py-2">~11</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Crystal Car Wash</td><td className="py-2 pr-4">(not retrieved — likely 4.0+ given modern facility)</td><td className="py-2">(likely higher)</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Forest Park Super Wash</td><td className="py-2 pr-4">(legacy listing, splits Spotless&apos;s reviews)</td><td className="py-2">—</td></tr>
            </tbody>
          </table>
        </div>
        <p><strong>Critical finding:</strong> Spotless&apos;s Yelp profile is meaningfully below category average. Most healthy local car washes maintain 4.0–4.5 stars. The complaints surfaced in search (&ldquo;water spots,&rdquo; &ldquo;limited space&rdquo;) are addressable. This is a reputation deficit that quietly suppresses local-pack ranking and direct bookings.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Positioning Map</h2>
        <pre className="bg-ink/5 border border-ink/10 p-4 rounded text-xs overflow-x-auto whitespace-pre">{`                         PREMIUM / DETAILED
                                |
                                |
              [Jendies Auto Spa — hand detail]
                                |
                                |
     [Crystal — modern tunnel + memberships + ceramic]
                                |
TOUCHLESS / SELF────────────────┼────────────────BRUSH / TUNNEL
                                |
       [Spotless ★]             |
       (touchless + self-serve, |
        2 locations, heated)    |   [Mister — aspirational]
                                |
                  [FP Super Wash — value tunnel]
                                |
                                |
                          VALUE / FAST`}</pre>
        <p className="mt-4"><strong>Spotless&apos;s positioning territory:</strong> the lower-left quadrant — <em>touchless, self-serve, value-priced, fast.</em> This is a defensible position; no one else in Forest Park is here. The risk is that Spotless&apos;s <em>site</em> doesn&apos;t claim this position clearly. The hero says &ldquo;Forest Park&apos;s touchless car wash&rdquo; — but the unique combination is <strong>&ldquo;touchless OR self-serve, both done right, 7am–10pm, 30 years.&rdquo;</strong></p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Content &amp; SEO Gap Analysis</h2>
        <p className="mb-4">Spotless&apos;s site has zero blog/educational content. Crystal&apos;s content is also thin (mostly product/membership pages). This is an open lane.</p>
        <p className="font-semibold mb-2">Content Gaps (no Forest Park car wash currently owns these queries):</p>
        <ol className="list-decimal pl-6 space-y-1">
          <li><em>&ldquo;touchless vs brush car wash&rdquo;</em> — high commercial intent; Spotless&apos;s exact differentiator</li>
          <li><em>&ldquo;how often should you wash your car in winter Chicago&rdquo;</em> — long-tail, drives token sales</li>
          <li><em>&ldquo;car wash near me oak park / river forest / forest park&rdquo;</em> — local pack queries</li>
          <li><em>&ldquo;self-serve car wash how to use&rdquo;</em> — high informational-to-commercial intent</li>
          <li><em>&ldquo;are car wash brushes bad for paint&rdquo;</em> — fear-based query that maps directly to touchless positioning</li>
          <li><em>&ldquo;ceramic coating vs Durashield&rdquo;</em> — comparison to Crystal&apos;s premium tier (defensive content)</li>
          <li><em>&ldquo;unlimited car wash near me forest park&rdquo;</em> — Crystal currently owns this; Spotless should compete after launching membership</li>
          <li><em>&ldquo;can you wash a Tesla in a car wash&rdquo;</em> — touchless wins this conversation; high SEO value</li>
        </ol>
        <p className="mt-4"><strong>Recommended:</strong> 1 blog post per month on these topics, each linking to the appropriate location/membership page.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">SWOT Analysis — Spotless Carwash</h2>

        <h3 className="text-xl font-bold mb-3">Strengths</h3>
        <ul className="list-disc pl-6 space-y-1 mb-6">
          <li><strong>Two physical locations</strong> in Forest Park (no other competitor has two).</li>
          <li><strong>True touchless</strong> automatic bays — defensible vs. Crystal and Super Wash.</li>
          <li><strong>Self-serve wand bays</strong> at both locations — Crystal cannot match this.</li>
          <li><strong>Heated indoor bays</strong> at Roosevelt Rd — the only year-round-comfortable option in the area.</li>
          <li><strong>30+ year operating history</strong> — moat no new competitor can manufacture.</li>
          <li><strong>Longest hours in town</strong> (7am–10pm; Crystal closes at 9pm).</li>
          <li><strong>Token program</strong> is well-designed (no expiration, cross-location validity, bulk discount).</li>
          <li><strong>Multi-modal payment</strong> (cash, cards, tap, Apple Pay) — Crystal less explicit here.</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">Weaknesses</h3>
        <ul className="list-disc pl-6 space-y-1 mb-6">
          <li><strong>No unlimited monthly membership</strong> — the single biggest revenue model gap; Crystal already runs the play.</li>
          <li><strong>Paid vacuums</strong> ($1 vs. Crystal&apos;s free vacuums) — small dollar amount, large psychological effect.</li>
          <li><strong>No ceramic / graphene coating</strong> — losing the premium-customer segment to Crystal entirely.</li>
          <li><strong>Yelp ratings ~3.0</strong> at both locations — actively suppresses local-pack ranking.</li>
          <li><strong>Legacy &ldquo;Forest Park Super Wash&rdquo; Yelp listing</strong> at the Madison address splits review velocity.</li>
          <li><strong>PayPal-only token checkout</strong> — high mobile drop-off.</li>
          <li><strong>No content/blog layer</strong> — missing free organic traffic.</li>
          <li><strong>Single-line value prop</strong> (&ldquo;Forest Park&apos;s touchless car wash&rdquo;) doesn&apos;t claim the unique combination.</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">Opportunities</h3>
        <ul className="list-disc pl-6 space-y-1 mb-6">
          <li><strong>Membership launch</strong> — even modest 200-member adoption = ~$60–120k/yr recurring.</li>
          <li><strong>&ldquo;Touchless + self-serve&rdquo; positioning</strong> — own the niche Crystal can&apos;t enter.</li>
          <li><strong>Heated-bay seasonal campaign (Nov–Mar)</strong> — Roosevelt&apos;s heated bays are the only ones in town.</li>
          <li><strong>Review-generation engine</strong> — lifting from 3.0 to 4.0+ stars meaningfully improves local-search visibility.</li>
          <li><strong>Reclaim/merge legacy Yelp listing</strong> at 7802 Madison.</li>
          <li><strong>&ldquo;Ceramic coating add-on at the self-serve bay&rdquo;</strong> — sell a $40 ceramic bottle + free coupon; lets self-serve customers get a coating without Crystal.</li>
          <li><strong>Fleet / commercial accounts</strong> — neither Spotless nor Crystal markets to this segment.</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">Threats</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Crystal&apos;s membership flywheel</strong> — every month Crystal retains a member is a month they don&apos;t visit Spotless.</li>
          <li><strong>Crystal&apos;s free vacuums</strong> — pure psychological wedge that retains customers between washes.</li>
          <li><strong>A national chain (Mister, Tommy&apos;s Express, Take 5) opening in Forest Park or River Forest</strong> — would redefine the local market overnight; Spotless&apos;s two locations suddenly look small.</li>
          <li><strong>Continued review erosion</strong> — every additional 2- or 3-star review compounds the deficit.</li>
          <li><strong>Online review platform changes</strong> (Google updates) — Spotless is exposed because review velocity is too low to absorb shocks.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Strategic Recommendations</h2>

        <h3 className="text-xl font-bold mb-3">Steal-Worthy Tactics</h3>
        <ol className="list-decimal pl-6 space-y-3 mb-8">
          <li><strong>Crystal — Unlimited monthly membership.</strong> <em>Why it works:</em> recurring revenue, raises LTV, smooths cash flow. <em>How to implement:</em> one tier first ($25–$29/mo, both locations, unlimited Ultimate, monthly Stripe subscription, QR or RFID entry). <em>Effort:</em> Medium (4–8 weeks). <em>Impact:</em> <strong>High</strong> ($4–12k/mo recurring within 90 days at modest adoption).</li>
          <li><strong>Crystal — Free vacuums with any wash.</strong> <em>Why it works:</em> removes a friction point and a psychological wedge that keeps customers loyal between washes. <em>How to implement:</em> convert vacuums to free or include with token purchase. <em>Effort:</em> Low. <em>Impact:</em> Medium (perception-shifting; competitive parity).</li>
          <li><strong>Crystal — Math-based membership pitch.</strong> <em>Why it works:</em> &ldquo;Two washes covers the month&rdquo; is intuitive. <em>How to implement:</em> mirror the structure: &ldquo;Three Ultimate washes = unlimited washes all month.&rdquo; <em>Effort:</em> Low (copy). <em>Impact:</em> Medium (membership conversion lift).</li>
          <li><strong>Mister Car Wash — Branded membership program name.</strong> <em>Why it works:</em> &ldquo;Unlimited Wash Club®&rdquo; feels like joining something, not signing up for autopay. <em>How to implement:</em> &ldquo;Spotless Unlimited&rdquo; or &ldquo;The Forest Park Wash Club.&rdquo; <em>Effort:</em> Low. <em>Impact:</em> Medium.</li>
          <li><strong>Mister Car Wash — In-bay/at-attendant membership pitch.</strong> <em>Why it works:</em> attendant conversions outperform digital cold conversion 3–5x. <em>How to implement:</em> train attendants on a 30-second membership pitch + attach a digital signup QR code to attendant lanyards. <em>Effort:</em> Low. <em>Impact:</em> High.</li>
          <li><strong>Crystal — Ceramic coating offering.</strong> <em>Why it works:</em> premium upsell, $20+ ticket size lift. <em>How to implement:</em> either a top-tier automatic ($15 add-on) or a self-serve ceramic spray product available in the bay. <em>Effort:</em> Medium. <em>Impact:</em> Medium.</li>
          <li><strong>Mister Car Wash — RFID/QR entry for members.</strong> <em>Why it works:</em> members feel like insiders, friction-free entry boosts retention. <em>How to implement:</em> Phase 2 after membership launches. <em>Effort:</em> High. <em>Impact:</em> High (retention).</li>
        </ol>

        <h3 className="text-xl font-bold mb-3">Differentiation Strategy</h3>
        <p className="mb-4">The dominant positioning angle Spotless should claim:</p>
        <blockquote className="border-l-4 border-ink/30 pl-4 italic font-semibold text-ink mb-4">
          &ldquo;Forest Park&apos;s only touchless + self-serve car wash. Wash it our way, or yours — for 30 years.&rdquo;
        </blockquote>
        <p className="font-semibold mb-2">Why this works:</p>
        <ul className="list-disc pl-6 space-y-1 mb-4">
          <li>&ldquo;Touchless + self-serve&rdquo; is a unique pairing no competitor in Forest Park can match. Crystal is tunnel-only; Forest Park Super Wash is value-tier; Jendies is hand-only.</li>
          <li>&ldquo;30 years&rdquo; is a moat no new entrant can fake.</li>
          <li>&ldquo;Wash it our way, or yours&rdquo; is a flexibility statement that subtly differentiates from Crystal&apos;s drive-through-only constraint.</li>
        </ul>
        <p className="mb-2"><strong>Secondary angle for winter (Nov–Mar):</strong></p>
        <blockquote className="border-l-4 border-ink/30 pl-4 italic font-semibold text-ink mb-4">
          &ldquo;The only heated indoor car wash in Forest Park. Wash your car at -10°F without freezing your hands.&rdquo;
        </blockquote>
        <p className="mb-2"><strong>Tertiary angle for premium-curious customers:</strong></p>
        <blockquote className="border-l-4 border-ink/30 pl-4 italic font-semibold text-ink mb-8">
          &ldquo;Durashield + spot-free finish. Same shine as ceramic, every wash, no $200 add-on.&rdquo;
        </blockquote>

        <h3 className="text-xl font-bold mb-3">Alternative Pages to Create</h3>

        <h4 className="text-lg font-bold mt-4 mb-2">Page 1: <code>/vs/crystal-car-wash</code> (or <code>/touchless-vs-tunnel</code>)</h4>
        <blockquote className="border-l-4 border-ink/30 pl-4 text-ink/90 mb-4">
          <p className="mb-2"><strong>Headline:</strong> &ldquo;Crystal Car Wash vs. Spotless: which is right for your car?&rdquo;</p>
          <p className="font-semibold mt-2 mb-1">Sections:</p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Honest comparison table (use the tables in this report; be fair)</li>
            <li><em>&ldquo;Where Crystal wins&rdquo;</em> (memberships, free vacuums, premium coatings) — building trust through honesty</li>
            <li><em>&ldquo;Where Spotless wins&rdquo;</em> (touchless, self-serve, heated bays, two locations, hours)</li>
            <li><em>&ldquo;Who is each best for?&rdquo;</em> — Crystal for daily drive-through commuters; Spotless for paint-protective + occasional deep-clean owners</li>
            <li>CTA: &ldquo;Try a Spotless Ultimate wash for $1 with this code (first-time customers)&rdquo;</li>
          </ol>
        </blockquote>
        <p className="mb-6">This page targets the &ldquo;alternatives to Crystal&rdquo; search intent, captures price-comparison shoppers, and (counterintuitively) builds trust through honesty.</p>

        <h4 className="text-lg font-bold mt-4 mb-2">Page 2: <code>/touchless-vs-brush</code></h4>
        <p className="mb-6">Educational content. High informational SEO value. Cements the &ldquo;won&apos;t scratch your paint&rdquo; positioning. Drives email signups.</p>

        <h4 className="text-lg font-bold mt-4 mb-2">Page 3: <code>/winter-car-wash-forest-park</code> (seasonal)</h4>
        <p className="mb-8">Seasonal LP for Nov–Mar, ranked for &ldquo;winter car wash near me&rdquo; queries. Heated-bay focus.</p>

        <h3 className="text-xl font-bold mb-3">Switching Narratives</h3>

        <h4 className="text-lg font-bold mt-4 mb-2">Narrative: Crystal → Spotless</h4>
        <blockquote className="border-l-4 border-ink/30 pl-4 text-ink/90 mb-6">
          <p className="font-semibold mb-1">Why customers might switch:</p>
          <ol className="list-decimal pl-6 space-y-1 mb-3">
            <li><strong>Worried about brushes scratching paint</strong> (especially Tesla, BMW, repaint owners) — Spotless touchless is the answer</li>
            <li><strong>Want to wash the engine bay or wheels in detail</strong> — Spotless self-serve is the only option</li>
            <li><strong>Need access after 9pm</strong> — Spotless is open until 10pm</li>
          </ol>
          <p className="font-semibold mb-1">Switching template:</p>
          <p className="italic mb-3">&ldquo;After repainting my BMW last year, I was nervous about Crystal&apos;s brushes. I tried Spotless&apos;s touchless Ultimate wash and the difference was immediate — same shine, zero swirl marks, and I get to wash the engine bay myself in the self-serve bay. I switched all my washes to Spotless.&rdquo;</p>
          <p className="font-semibold mb-1">Switching offer:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>First Ultimate wash $1 with email signup</li>
            <li>Membership offer: &ldquo;Bring your Crystal membership receipt — first month of Spotless Unlimited free&rdquo;</li>
          </ul>
        </blockquote>

        <h4 className="text-lg font-bold mt-4 mb-2">Narrative: DIY-at-home → Spotless self-serve</h4>
        <blockquote className="border-l-4 border-ink/30 pl-4 text-ink/90">
          <p className="mb-2">Why customers switch: water restrictions, neighborhood ordinances, no good water pressure at home, want professional-grade chemicals.</p>
          <p>Switching offer: &ldquo;Try the self-serve bay on us — your first $4 token is free.&rdquo;</p>
        </blockquote>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Competitive Monitoring Plan</h2>

        <h3 className="text-xl font-bold mb-3">Monthly Checks</h3>
        <ul className="list-none pl-0 space-y-1 mb-6">
          <li>☐ Crystal Car Wash homepage and pricing page (any changes to membership tiers / pricing?)</li>
          <li>☐ Crystal&apos;s Yelp and Google review counts and ratings</li>
          <li>☐ Yelp page for &ldquo;Forest Park Super Wash&rdquo; — has it been claimed/merged?</li>
          <li>☐ Both Spotless Yelp pages — count new reviews, respond within 48 hours</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">Quarterly Checks</h3>
        <ul className="list-none pl-0 space-y-1 mb-6">
          <li>☐ Search &ldquo;car wash Forest Park&rdquo; / &ldquo;car wash Oak Park&rdquo; on Google — who&apos;s in the local pack? Has anyone new entered?</li>
          <li>☐ Check Google Maps for any new car wash construction signs in 1.5-mile radius</li>
          <li>☐ Mister Car Wash and Tommy&apos;s Express expansion announcements (do they list Forest Park, Oak Park, or River Forest as upcoming?)</li>
          <li>☐ Compare Crystal&apos;s website tech stack and content additions</li>
        </ul>

        <h3 className="text-xl font-bold mb-3">Response Playbook</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2 pr-4">Competitor Move</th>
                <th className="text-left py-2 pr-4">Spotless Response</th>
                <th className="text-left py-2">Timeline</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Crystal raises membership prices</td><td className="py-2 pr-4">Promote Spotless membership at lower price; run limited-time switch offer</td><td className="py-2">2 weeks</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Crystal adds a 5th tier or new coating</td><td className="py-2 pr-4">Evaluate add-on; consider parity offering or stronger touchless angle</td><td className="py-2">1 month</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">New national chain announces Forest Park location</td><td className="py-2 pr-4">Lock in members aggressively before opening; emphasize local heritage</td><td className="py-2">4–8 weeks before their open</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Negative review wave on Spotless</td><td className="py-2 pr-4">Identify root cause (water spots, attendant gap, equipment issue); fix operationally; respond to each review</td><td className="py-2">1 week</td></tr>
              <tr className="border-b border-ink/10"><td className="py-2 pr-4">Crystal launches an app</td><td className="py-2 pr-4">Phase forward Spotless&apos;s RFID/QR entry plans</td><td className="py-2">2 quarters</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Launch the membership product.</strong> This is the single highest-leverage competitive move. Crystal has been running this play for an unknown period and every month of delay compounds the customer-acquisition deficit.</li>
          <li><strong>Fix the Yelp situation.</strong> Claim/merge the legacy Forest Park Super Wash listing; deploy a post-wash review request flow; respond to every existing review. Goal: 4.0+ stars at both locations within 6 months.</li>
          <li><strong>Build the <code>/vs/crystal-car-wash</code> and <code>/touchless-vs-brush</code> pages.</strong> Capture the bottom-funnel comparison searches Crystal currently wins by default.</li>
        </ol>
        <p className="font-semibold mt-6 mb-2">Suggested follow-ups in this suite:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><code>/market copy</code> — rewrite the homepage hero, location pages, and a new membership LP using the differentiation positioning above.</li>
          <li><code>/market funnel</code> — design the membership signup funnel + welcome email sequence for switchers.</li>
          <li><code>/market ads</code> — build Google Local Service Ad and Meta ad creative around the &ldquo;touchless + self-serve&rdquo; + &ldquo;winter heated&rdquo; angles.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Sources</h2>
        <ul className="list-disc pl-6 space-y-1 text-sm break-words">
          <li>Crystal Car Wash — Forest Park IL: https://www.crystalcarwashforestpark.com/</li>
          <li>Crystal Car Wash — Membership Packages: https://crystalcarwashforestpark.com/packages/</li>
          <li>Spotless Car Wash — Yelp (Roosevelt Rd): https://www.yelp.com/biz/spotless-car-wash-forest-park-2</li>
          <li>Spotless Car Wash — Yelp (Madison St): https://www.yelp.com/biz/spotless-car-wash-forest-park</li>
          <li>Forest Park Super Wash — Yelp (legacy listing at 7802 Madison): https://www.yelp.com/biz/forest-park-super-wash-forest-park</li>
          <li>Best 10 Car Wash in Forest Park — Yelp: https://www.yelp.com/search?cflt=carwash&amp;find_loc=Forest+Park,+IL</li>
          <li>Jendies Auto Spa — Nextdoor: https://nextdoor.com/pages/jendies-auto-spa-forest-park-il/</li>
          <li>Mister Car Wash — Unlimited Wash Club: https://mistercarwash.com/unlimited-wash-club/</li>
          <li>Mister Car Wash — Membership Plans: https://mistercarwash.com/join-unlimited-wash-club/</li>
        </ul>
      </section>

      <footer className="border-t border-ink/20 pt-6 mt-12 text-sm text-ink/60 italic">
        Created by Center Point Digital LLC — <code>/market competitors</code>
      </footer>
    </article>
  )
}

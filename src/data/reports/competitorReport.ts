import type { ReportSection } from '@/lib/reportRender'
import { pt } from '@/lib/reportRender'

type ProseBlock = ReturnType<typeof pt>
const p = (text: string, key: string): ProseBlock => pt(text, key)

export type CompetitorReportCopy = {
  metaTitle: string
  metaDescription: string
  kicker: string
  headline: string
  headerFacts: { label: string; value: string }[]
  positionLine: string
  sections: ReportSection[]
  footerLine: string
}

export const competitorReportFallback: CompetitorReportCopy = {
  metaTitle: 'Competitor Report · Spotless Carwash',
  metaDescription: 'Competitive intelligence report for Spotless Carwash — direct/indirect competitors, SWOT, and recommendations.',
  kicker: 'Confidential · Client Review',
  headline: 'Competitive Intelligence Report: Spotless Carwash',
  headerFacts: [
    { label: 'URL:', value: 'https://spotless-carwash-git-main-center-point-digital.vercel.app/' },
    { label: 'Date:', value: '2026-05-08' },
    { label: 'Competitors Analyzed:', value: '5 (3 direct, 1 indirect, 1 aspirational benchmark)' },
  ],
  positionLine: 'Competitive Position: Moderate — strong local heritage, vulnerable on membership/coatings',
  sections: [
    {
      _key: 'exec',
      heading: 'Executive Summary',
      widgets: [
        {
          _type: 'reportProse',
          _key: 'ep',
          body: [
            p("Spotless Carwash operates in a small, geographically tight competitive set in Forest Park, IL. The most consequential competitor is **Crystal Car Wash** (901 S Harlem Ave, also Forest Park) — a drive-through tunnel wash that has clearly been built around the modern membership model and offers four wash tiers ($9–$25 single, **$18–$40/mo unlimited**), free vacuums, and ceramic + graphene coatings. Crystal is roughly 1.5 miles from Spotless's Roosevelt Rd location.", 'e1'),
            p("Spotless's structural advantages over Crystal are real but underused: **two locations**, **true touchless** (Crystal does not advertise touchless), **heated indoor bays** at Roosevelt Rd, **self-serve wand bays** (Crystal has none), and a **30-year operating heritage**. The disadvantages are also real: **no membership product**, **paid vacuums** ($1) vs. Crystal's free vacuums, **no ceramic/graphene coatings**, and a noticeably weaker third-party review profile (~3.0 stars on Yelp at both locations vs. category averages closer to 4.0+).", 'e2'),
            p("Forest Park Super Wash, listed on Yelp at **7802 Madison St — the same address as Spotless's Madison location** — appears to be a stale legacy listing of what is now Spotless Madison. This is also worth fixing as a brand-hygiene matter (claim/merge that Yelp listing).", 'e3'),
            p('**Top 3 strategic recommendations:**', 'e4'),
          ],
        },
        {
          _type: 'reportList',
          _key: 'el',
          style: 'number',
          items: [
            '**Launch a membership product** — Spotless cannot afford to leave Crystal as the only Forest Park option that offers unlimited monthly washes. Even a single $25/mo unlimited Ultimate tier closes the biggest gap immediately.',
            "**Pivot positioning hard onto the two true differentiators competitors can't match: touchless + self-serve.** Crystal is a drive-through tunnel — it cannot do self-serve detail bays and (likely) uses brushes. Headlines should weaponize this: \"The only touchless + self-serve car wash in Forest Park.\"",
            '**Fix the review profile.** A 3.0 average on Yelp is a quiet revenue leak. Build a post-wash review request flow and respond to existing reviews. Lifting to 4.0+ over 6 months is the single highest-ROI customer-acquisition lever Spotless has not pulled.',
          ],
        },
      ],
    },
    {
      _key: 'over',
      heading: 'Competitor Overview',
      widgets: [
        {
          _type: 'reportSubsection',
          _key: 'dir',
          heading: 'Direct Competitors',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'dt',
              headers: ['Name', 'URL', 'Distance', 'Model', 'Membership', 'Touchless', 'Self-Serve', 'Free Vacuums'],
              rows: [
                { cells: ['**Crystal Car Wash**', 'crystalcarwashforestpark.com', '~1.5 mi (901 S Harlem)', 'Drive-through tunnel', '**Yes — $18–$40/mo, 4 tiers**', 'Not advertised', 'No', '**Yes**'] },
                { cells: ['**Forest Park Super Wash**', '(Yelp only)', '7802 Madison St', 'Mixed (auto + DIY); $6 auto wash', 'No', 'Unclear', 'Yes', '$1 vacuums'] },
                { cells: ['**Jendies Auto Spa**', 'jendy.com', 'Forest Park', 'Full-service detail / hand', 'Unknown (site blocked WebFetch)', 'N/A (hand)', 'No', 'N/A'] },
              ],
            },
            {
              _type: 'reportQuote',
              _key: 'dq',
              emphasis: 'italic',
              text: "**Note on Forest Park Super Wash:** Its Yelp address (7802 Madison St) is identical to Spotless's Madison location. This is almost certainly a legacy Yelp listing for the same physical lot under a previous brand. Spotless should claim/merge or contest this listing — it splits review velocity and confuses local search.",
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'ind',
          heading: 'Indirect Competitors',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'it',
              headers: ['Name', 'URL', 'Model', 'Why It Competes'],
              rows: [
                { cells: ['**MCR Hand Car Wash**', '(Oak Park, Madison St)', 'Hand wash / detail', "Captures customers who want a more thorough finish than self-serve and don't trust automatic"] },
                { cells: ['**Mobile detailers**', 'Various', 'At-home / on-demand', 'Captures convenience-first customers willing to pay 5–10x for in-driveway service'] },
                { cells: ['**DIY at home**', 'Driveway + hose', 'Free', "The \"I'll just do it Saturday\" segment — large in suburban areas"] },
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'asp',
          heading: 'Aspirational Benchmark',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'at',
              headers: ['Name', 'URL', 'Model', 'What to Learn From Them'],
              rows: [
                { cells: ['**Mister Car Wash**', 'mistercarwash.com', 'National chain, drive-through tunnel', 'The category-defining membership playbook: 3 tiers (Base $22.99 → Platinum → Titanium), RFID windshield tag, 50–70% of revenue from subscriptions, branded "Unlimited Wash Club"'] },
              ],
            },
          ],
        },
      ],
    },
    {
      _key: 'profiles',
      heading: 'Detailed Competitor Profiles',
      widgets: [
        {
          _type: 'reportSubsection',
          _key: 'crystal',
          heading: '🥇 Crystal Car Wash (Primary Threat)',
          widgets: [
            {
              _type: 'reportProse',
              _key: 'crp',
              body: [
                p('**URL:** crystalcarwashforestpark.com', 'cr1'),
                p('**Address:** 901 S Harlem Ave, Forest Park, IL 60130', 'cr2'),
                p('**Hours:** 7am–9pm daily (Spotless is 7am–10pm — Spotless wins on hours by 1 hour/day)', 'cr3'),
                p('**Messaging:**', 'cr4'),
              ],
            },
            {
              _type: 'reportList',
              _key: 'crl1',
              style: 'bullet',
              items: [
                'Headline: *"Not Just Clean, Crystal Clean"*',
                'Subhead / banner: *"Sign Up For An Unlimited Wash Membership!"*',
                'Tone: Professional, slightly playful ("dance party" atmosphere mentioned in customer reviews)',
              ],
            },
            { _type: 'reportProse', _key: 'crp2', body: [p('**Wash Tiers and Pricing:**', 'cr5')] },
            {
              _type: 'reportTable',
              _key: 'crt',
              headers: ['Package', 'Single', 'Unlimited Monthly'],
              rows: [
                { cells: ['Express', '$9', '**$18**'] },
                { cells: ['Wheel Deal', '$15', '**$25**'] },
                { cells: ['Ceramic', '$20', '**$35**'] },
                { cells: ['Graphene', '$25', '**$40**'] },
              ],
            },
            {
              _type: 'reportProse',
              _key: 'crp3',
              body: [
                p('Membership pitch: *"The price of just two washes covers an entire month of daily washes."* — strong, simple math-based value framing.', 'cr6'),
                p('**Differentiators:**', 'cr7'),
              ],
            },
            {
              _type: 'reportList',
              _key: 'crl2',
              style: 'bullet',
              items: [
                '✅ Unlimited monthly memberships (4 tiers)',
                '✅ Free vacuums and air',
                '✅ Ceramic + graphene coatings (premium upsell)',
                '✅ Underbody wash',
                '✅ Modern facility / "lights and dance party" experience',
                '❌ Drive-through only — no self-serve',
                '❌ Touchless not advertised (likely uses soft cloth or foam brushes, standard for tunnel washes)',
                "❌ Single location vs. Spotless's two",
                "❌ Closes 1 hour earlier (9pm vs. Spotless's 10pm)",
              ],
            },
            { _type: 'reportProse', _key: 'crp4', body: [p('**SWOT for Crystal:**', 'cr8')] },
            {
              _type: 'reportList',
              _key: 'crl3',
              style: 'bullet',
              items: [
                '**Strengths:** Membership economics, free amenities, modern equipment, premium tier (graphene)',
                '**Weaknesses:** Tunnel-only (no self-serve), single location, possibly not touchless',
                '**Opportunities for Spotless:** Win the "won\'t scratch my paint" customer + the self-serve detailer customer',
                '**Threats to Spotless:** They will keep eating the recurring-revenue side of the market until Spotless ships a membership',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'fpsw',
          heading: '🥈 Forest Park Super Wash',
          widgets: [
            {
              _type: 'reportProse',
              _key: 'fp1',
              body: [
                p('**URL:** Yelp listing only (no website found)', 'f1'),
                p('**Address:** 7802 Madison St, Forest Park, IL — **identical to Spotless Madison**', 'f2'),
                p('**Pricing:** Automatic ~$6, vacuums $1', 'f3'),
                p('**Membership:** None advertised', 'f4'),
                p("**Assessment:** Almost certainly a legacy Yelp listing for the same physical property as Spotless Madison St. Recommend Spotless contact Yelp to merge / claim this listing. While unmerged, it actively cannibalizes Spotless's review presence in local search.", 'f5'),
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'jen',
          heading: '🥉 Jendies Auto Spa',
          widgets: [
            {
              _type: 'reportProse',
              _key: 'j1',
              body: [
                p('**URL:** jendy.com (returned HTTP 403; manual review needed)', 'j1a'),
                p('**Address:** Forest Park, IL', 'j1b'),
                p('**Model:** Full-service detail / hand wash (per Nextdoor listing)', 'j1c'),
                p('**Assessment:** Different category — appeals to the higher-end "I want it done for me, by hand" segment. Not a direct touchless competitor but takes share of the *premium* end of the local car-care market. Spotless should not try to compete on "thoroughness" against a hand detail shop — and instead double down on speed + frequency + price.', 'j1d'),
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'mister',
          heading: 'Aspirational Benchmark: Mister Car Wash',
          widgets: [
            {
              _type: 'reportProse',
              _key: 'm1',
              body: [
                p('**URL:** mistercarwash.com', 'mp1'),
                p('**Model:** National chain, ~500 locations, NYSE: MCW', 'mp2'),
                p('**Membership Playbook (this is the model to study, not match feature-for-feature):**', 'mp3'),
              ],
            },
            {
              _type: 'reportList',
              _key: 'ml1',
              style: 'bullet',
              items: [
                'Branded program: **"Unlimited Wash Club®"**',
                '3 tiers: Base ($22.99/mo as of Jan 2025), Platinum, Titanium',
                'RFID windshield sticker for tap-and-drive entry',
                'Aggressive in-lane sales: every customer is offered membership at the wash',
                'Membership conversion goal: 25–35% of single-wash customers',
                'Public market valuation premised entirely on membership penetration',
              ],
            },
            { _type: 'reportProse', _key: 'm2', body: [p('**Lessons for Spotless (lift the playbook, scale to two-location reality):**', 'mp4')] },
            {
              _type: 'reportList',
              _key: 'ml2',
              style: 'number',
              items: [
                "One simple unlimited tier first — don't over-complicate with 3 tiers initially.",
                'Make the math obvious: "The price of 3 Ultimate washes = unlimited washes all month."',
                'Put a QR-code "Join Membership" sign in every bay.',
                'Train the attendant to mention membership at every interaction.',
                'Eventually: RFID/QR pass + branded windshield sticker so members feel like insiders.',
              ],
            },
          ],
        },
      ],
    },
    {
      _key: 'tables',
      heading: 'Comparison Tables',
      widgets: [
        {
          _type: 'reportSubsection',
          _key: 'feat',
          heading: 'Feature Comparison',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'ft',
              headers: ['Feature', '**Spotless**', 'Crystal', 'FP Super Wash', 'Jendies', 'Mister (national)'],
              rows: [
                { cells: ['**Touchless wash**', '✅ Full', '⚠️ Unclear', '⚠️ Unclear', 'N/A (hand)', 'Some locations'] },
                { cells: ['**Self-serve wand bays**', '✅ Full', '❌ No', '✅ Yes', '❌ No', '❌ No'] },
                { cells: ['**Heated indoor bays**', '✅ Roosevelt Rd', '❌ No', '❌ No', 'N/A', 'Varies'] },
                { cells: ['**Drive-through tunnel**', '❌ No', '✅ Yes', '✅ Yes', '❌ No', '✅ Yes'] },
                { cells: ['**Unlimited monthly membership**', '❌ **No**', '✅ Yes ($18–$40)', '❌ No', '❓ Unknown', '✅ Yes ($22.99+)'] },
                { cells: ['**Prepaid wash tokens**', '✅ Yes', '❌ No', '❌ No', '❌ No', '❌ No'] },
                { cells: ['**Free vacuums**', '❌ No ($1)', '✅ **Yes**', '❌ No ($1)', 'N/A', 'Member-only'] },
                { cells: ['**Ceramic coating**', '❌ No', '✅ Yes', '❌ No', '✅ Likely', '✅ Yes'] },
                { cells: ['**Graphene coating**', '❌ No', '✅ Yes', '❌ No', '❌ Unlikely', '❌ No'] },
                { cells: ['**Durashield surface gloss**', '✅ Yes', '❌ No', '❌ No', '❌ No', 'Equivalent (HotShine)'] },
                { cells: ['**Two+ locations in Forest Park**', '✅ **Yes (2)**', '❌ No (1)', '❌ No (1)', '❌ No (1)', 'N/A'] },
                { cells: ['**Hours**', '7am–10pm', '7am–9pm', 'Unknown', 'Unknown', 'Varies'] },
                { cells: ['**30+ year heritage**', '✅ Yes', '❌ No', '❌ No', '❌ No', 'N/A'] },
                { cells: ['**Online checkout**', '⚠️ PayPal only', '✅ (memberships)', '❌ No', '❓', '✅ Full'] },
                { cells: ['**Mobile app / RFID**', '❌ No', '❌ No', '❌ No', '❌ No', '✅ Yes'] },
              ],
            },
            {
              _type: 'reportProse',
              _key: 'fp',
              body: [
                p('**Spotless wins:** Self-serve wand bays, heated bays, two locations, longest hours, longest heritage, tokens, true touchless.', 'f1'),
                p('**Spotless loses:** Membership, free vacuums, ceramic/graphene coatings, online checkout UX, review velocity.', 'f2'),
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'price',
          heading: 'Pricing Comparison (Single Wash)',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'pt',
              headers: ['Tier', 'Spotless', 'Crystal', 'Difference'],
              rows: [
                { cells: ['Entry', '$8 (Deluxe No-Dryer)', '$9 (Express)', 'Spotless −$1'] },
                { cells: ['Mid', '$9 (Deluxe)', '$15 (Wheel Deal)', 'Spotless −$6'] },
                { cells: ['Upper-mid', '$10 (Ultimate)', '$20 (Ceramic)', 'Spotless −$10'] },
                { cells: ['Top', '$12 (Lustre)', '$25 (Graphene)', 'Spotless −$13'] },
              ],
            },
            {
              _type: 'reportProse',
              _key: 'pp',
              body: [
                p('**Read:** Spotless is positioned as the *value-priced* option. Crystal is positioned as the *premium* option. Both can win — but Spotless needs to either (a) defend the value position with a frequency offer (membership) or (b) build a top-tier coating product to compete at the top.', 'p1'),
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'member',
          heading: 'Membership / Recurring Revenue Comparison',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'mt',
              headers: ['Provider', 'Entry Membership', 'Top Membership', 'Spotless Equivalent'],
              rows: [
                { cells: ['Crystal', '$18/mo (Express)', '$40/mo (Graphene)', 'None — token plan only'] },
                { cells: ['Mister Car Wash (benchmark)', '$22.99/mo (Base)', '$40+/mo (Titanium)', 'None'] },
                { cells: ['Spotless', '**None**', '**None**', 'Tokens: 25 Ultimate washes for $200 = $8/wash, but no recurring obligation'] },
              ],
            },
            {
              _type: 'reportProse',
              _key: 'mp',
              body: [
                p("**Tokens are good but they're not a subscription.** Tokens are prepaid one-time purchases and do not generate predictable monthly revenue. The car wash industry shifted to subscription specifically because it (a) smooths cash flow, (b) increases LTV by making cancellation friction-bound, and (c) raises business valuation 3–5x.", 'mp1'),
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'rev',
          heading: 'Review Ratings (Yelp)',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'rt',
              headers: ['Business', 'Yelp Rating', 'Reviews'],
              rows: [
                { cells: ['Spotless Roosevelt Rd', '~3.0 ★', '~22'] },
                { cells: ['Spotless Madison St', '~3.0 ★', '~11'] },
                { cells: ['Crystal Car Wash', '(not retrieved — likely 4.0+ given modern facility)', '(likely higher)'] },
                { cells: ['Forest Park Super Wash', "(legacy listing, splits Spotless's reviews)", '—'] },
              ],
            },
            {
              _type: 'reportProse',
              _key: 'rp',
              body: [
                p("**Critical finding:** Spotless's Yelp profile is meaningfully below category average. Most healthy local car washes maintain 4.0–4.5 stars. The complaints surfaced in search (\"water spots,\" \"limited space\") are addressable. This is a reputation deficit that quietly suppresses local-pack ranking and direct bookings.", 'rp1'),
              ],
            },
          ],
        },
      ],
    },
    {
      _key: 'posmap',
      heading: 'Positioning Map',
      widgets: [
        {
          _type: 'reportCode',
          _key: 'pmc',
          code: `                         PREMIUM / DETAILED
                                |
                                |
              [Jendies Auto Spa — hand detail]
                                |
                                |
     [Crystal — modern tunnel + memberships + ceramic]
                                |
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
                          VALUE / FAST`,
        },
        {
          _type: 'reportProse',
          _key: 'pmp',
          body: [
            p("**Spotless's positioning territory:** the lower-left quadrant — *touchless, self-serve, value-priced, fast.* This is a defensible position; no one else in Forest Park is here. The risk is that Spotless's *site* doesn't claim this position clearly. The hero says \"Forest Park's touchless car wash\" — but the unique combination is **\"touchless OR self-serve, both done right, 7am–10pm, 30 years.\"**", 'pm1'),
          ],
        },
      ],
    },
    {
      _key: 'contentgap',
      heading: 'Content & SEO Gap Analysis',
      widgets: [
        {
          _type: 'reportProse',
          _key: 'cg1',
          body: [
            p("Spotless's site has zero blog/educational content. Crystal's content is also thin (mostly product/membership pages). This is an open lane.", 'cg1a'),
            p('**Content Gaps (no Forest Park car wash currently owns these queries):**', 'cg1b'),
          ],
        },
        {
          _type: 'reportList',
          _key: 'cgl',
          style: 'number',
          items: [
            "*\"touchless vs brush car wash\"* — high commercial intent; Spotless's exact differentiator",
            '*"how often should you wash your car in winter Chicago"* — long-tail, drives token sales',
            '*"car wash near me oak park / river forest / forest park"* — local pack queries',
            '*"self-serve car wash how to use"* — high informational-to-commercial intent',
            '*"are car wash brushes bad for paint"* — fear-based query that maps directly to touchless positioning',
            "*\"ceramic coating vs Durashield\"* — comparison to Crystal's premium tier (defensive content)",
            '*"unlimited car wash near me forest park"* — Crystal currently owns this; Spotless should compete after launching membership',
            '*"can you wash a Tesla in a car wash"* — touchless wins this conversation; high SEO value',
          ],
        },
        {
          _type: 'reportProse',
          _key: 'cg2',
          body: [
            p('**Recommended:** 1 blog post per month on these topics, each linking to the appropriate location/membership page.', 'cg2a'),
          ],
        },
      ],
    },
    {
      _key: 'swot',
      heading: 'SWOT Analysis — Spotless Carwash',
      widgets: [
        {
          _type: 'reportSubsection',
          _key: 'sw1',
          heading: 'Strengths',
          widgets: [
            {
              _type: 'reportList',
              _key: 'swl1',
              style: 'bullet',
              items: [
                '**Two physical locations** in Forest Park (no other competitor has two).',
                '**True touchless** automatic bays — defensible vs. Crystal and Super Wash.',
                '**Self-serve wand bays** at both locations — Crystal cannot match this.',
                '**Heated indoor bays** at Roosevelt Rd — the only year-round-comfortable option in the area.',
                '**30+ year operating history** — moat no new competitor can manufacture.',
                '**Longest hours in town** (7am–10pm; Crystal closes at 9pm).',
                '**Token program** is well-designed (no expiration, cross-location validity, bulk discount).',
                '**Multi-modal payment** (cash, cards, tap, Apple Pay) — Crystal less explicit here.',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'sw2',
          heading: 'Weaknesses',
          widgets: [
            {
              _type: 'reportList',
              _key: 'swl2',
              style: 'bullet',
              items: [
                '**No unlimited monthly membership** — the single biggest revenue model gap; Crystal already runs the play.',
                "**Paid vacuums** ($1 vs. Crystal's free vacuums) — small dollar amount, large psychological effect.",
                '**No ceramic / graphene coating** — losing the premium-customer segment to Crystal entirely.',
                '**Yelp ratings ~3.0** at both locations — actively suppresses local-pack ranking.',
                '**Legacy "Forest Park Super Wash" Yelp listing** at the Madison address splits review velocity.',
                '**PayPal-only token checkout** — high mobile drop-off.',
                '**No content/blog layer** — missing free organic traffic.',
                "**Single-line value prop** (\"Forest Park's touchless car wash\") doesn't claim the unique combination.",
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'sw3',
          heading: 'Opportunities',
          widgets: [
            {
              _type: 'reportList',
              _key: 'swl3',
              style: 'bullet',
              items: [
                '**Membership launch** — even modest 200-member adoption = ~$60–120k/yr recurring.',
                "**\"Touchless + self-serve\" positioning** — own the niche Crystal can't enter.",
                "**Heated-bay seasonal campaign (Nov–Mar)** — Roosevelt's heated bays are the only ones in town.",
                '**Review-generation engine** — lifting from 3.0 to 4.0+ stars meaningfully improves local-search visibility.',
                '**Reclaim/merge legacy Yelp listing** at 7802 Madison.',
                '**"Ceramic coating add-on at the self-serve bay"** — sell a $40 ceramic bottle + free coupon; lets self-serve customers get a coating without Crystal.',
                '**Fleet / commercial accounts** — neither Spotless nor Crystal markets to this segment.',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'sw4',
          heading: 'Threats',
          widgets: [
            {
              _type: 'reportList',
              _key: 'swl4',
              style: 'bullet',
              items: [
                "**Crystal's membership flywheel** — every month Crystal retains a member is a month they don't visit Spotless.",
                "**Crystal's free vacuums** — pure psychological wedge that retains customers between washes.",
                "**A national chain (Mister, Tommy's Express, Take 5) opening in Forest Park or River Forest** — would redefine the local market overnight; Spotless's two locations suddenly look small.",
                '**Continued review erosion** — every additional 2- or 3-star review compounds the deficit.',
                '**Online review platform changes** (Google updates) — Spotless is exposed because review velocity is too low to absorb shocks.',
              ],
            },
          ],
        },
      ],
    },
    {
      _key: 'strat',
      heading: 'Strategic Recommendations',
      widgets: [
        {
          _type: 'reportSubsection',
          _key: 'steal',
          heading: 'Steal-Worthy Tactics',
          widgets: [
            {
              _type: 'reportList',
              _key: 'stl',
              style: 'number',
              items: [
                '**Crystal — Unlimited monthly membership.** *Why it works:* recurring revenue, raises LTV, smooths cash flow. *How to implement:* one tier first ($25–$29/mo, both locations, unlimited Ultimate, monthly Stripe subscription, QR or RFID entry). *Effort:* Medium (4–8 weeks). *Impact:* **High** ($4–12k/mo recurring within 90 days at modest adoption).',
                '**Crystal — Free vacuums with any wash.** *Why it works:* removes a friction point and a psychological wedge that keeps customers loyal between washes. *How to implement:* convert vacuums to free or include with token purchase. *Effort:* Low. *Impact:* Medium (perception-shifting; competitive parity).',
                '**Crystal — Math-based membership pitch.** *Why it works:* "Two washes covers the month" is intuitive. *How to implement:* mirror the structure: "Three Ultimate washes = unlimited washes all month." *Effort:* Low (copy). *Impact:* Medium (membership conversion lift).',
                '**Mister Car Wash — Branded membership program name.** *Why it works:* "Unlimited Wash Club®" feels like joining something, not signing up for autopay. *How to implement:* "Spotless Unlimited" or "The Forest Park Wash Club." *Effort:* Low. *Impact:* Medium.',
                '**Mister Car Wash — In-bay/at-attendant membership pitch.** *Why it works:* attendant conversions outperform digital cold conversion 3–5x. *How to implement:* train attendants on a 30-second membership pitch + attach a digital signup QR code to attendant lanyards. *Effort:* Low. *Impact:* High.',
                '**Crystal — Ceramic coating offering.** *Why it works:* premium upsell, $20+ ticket size lift. *How to implement:* either a top-tier automatic ($15 add-on) or a self-serve ceramic spray product available in the bay. *Effort:* Medium. *Impact:* Medium.',
                '**Mister Car Wash — RFID/QR entry for members.** *Why it works:* members feel like insiders, friction-free entry boosts retention. *How to implement:* Phase 2 after membership launches. *Effort:* High. *Impact:* High (retention).',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'diff',
          heading: 'Differentiation Strategy',
          widgets: [
            { _type: 'reportProse', _key: 'dp1', body: [p('The dominant positioning angle Spotless should claim:', 'd1')] },
            {
              _type: 'reportQuote',
              _key: 'dq1',
              emphasis: 'boldItalic',
              text: '"Forest Park\'s only touchless + self-serve car wash. Wash it our way, or yours — for 30 years."',
            },
            { _type: 'reportProse', _key: 'dp2', body: [p('**Why this works:**', 'd2')] },
            {
              _type: 'reportList',
              _key: 'dl',
              style: 'bullet',
              items: [
                '"Touchless + self-serve" is a unique pairing no competitor in Forest Park can match. Crystal is tunnel-only; Forest Park Super Wash is value-tier; Jendies is hand-only.',
                '"30 years" is a moat no new entrant can fake.',
                '"Wash it our way, or yours" is a flexibility statement that subtly differentiates from Crystal\'s drive-through-only constraint.',
              ],
            },
            { _type: 'reportProse', _key: 'dp3', body: [p('**Secondary angle for winter (Nov–Mar):**', 'd3')] },
            {
              _type: 'reportQuote',
              _key: 'dq2',
              emphasis: 'boldItalic',
              text: '"The only heated indoor car wash in Forest Park. Wash your car at -10°F without freezing your hands."',
            },
            { _type: 'reportProse', _key: 'dp4', body: [p('**Tertiary angle for premium-curious customers:**', 'd4')] },
            {
              _type: 'reportQuote',
              _key: 'dq3',
              emphasis: 'boldItalic',
              text: '"Durashield + spot-free finish. Same shine as ceramic, every wash, no $200 add-on."',
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'alt',
          heading: 'Alternative Pages to Create',
          widgets: [
            { _type: 'reportProse', _key: 'a1', body: [p('**Page 1: `/vs/crystal-car-wash` (or `/touchless-vs-tunnel`)**', 'a1a')] },
            {
              _type: 'reportQuote',
              _key: 'aq1',
              emphasis: 'plain',
              text: '**Headline:** "Crystal Car Wash vs. Spotless: which is right for your car?"',
            },
            { _type: 'reportProse', _key: 'a2', body: [p('Sections:', 'a2a')] },
            {
              _type: 'reportList',
              _key: 'al1',
              style: 'number',
              items: [
                'Honest comparison table (use the tables in this report; be fair)',
                '*"Where Crystal wins"* (memberships, free vacuums, premium coatings) — building trust through honesty',
                '*"Where Spotless wins"* (touchless, self-serve, heated bays, two locations, hours)',
                '*"Who is each best for?"* — Crystal for daily drive-through commuters; Spotless for paint-protective + occasional deep-clean owners',
                'CTA: "Try a Spotless Ultimate wash for $1 with this code (first-time customers)"',
              ],
            },
            {
              _type: 'reportProse',
              _key: 'a3',
              body: [
                p('This page targets the "alternatives to Crystal" search intent, captures price-comparison shoppers, and (counterintuitively) builds trust through honesty.', 'a3a'),
                p('**Page 2: `/touchless-vs-brush`**', 'a3b'),
                p('Educational content. High informational SEO value. Cements the "won\'t scratch your paint" positioning. Drives email signups.', 'a3c'),
                p('**Page 3: `/winter-car-wash-forest-park` (seasonal)**', 'a3d'),
                p('Seasonal LP for Nov–Mar, ranked for "winter car wash near me" queries. Heated-bay focus.', 'a3e'),
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'switch',
          heading: 'Switching Narratives',
          widgets: [
            { _type: 'reportProse', _key: 's1', body: [p('**Narrative: Crystal → Spotless**', 's1a')] },
            {
              _type: 'reportQuote',
              _key: 'sq1',
              emphasis: 'plain',
              text: '**Why customers might switch:**',
            },
            {
              _type: 'reportList',
              _key: 'sl1',
              style: 'number',
              items: [
                '**Worried about brushes scratching paint** (especially Tesla, BMW, repaint owners) — Spotless touchless is the answer',
                '**Want to wash the engine bay or wheels in detail** — Spotless self-serve is the only option',
                '**Need access after 9pm** — Spotless is open until 10pm',
              ],
            },
            { _type: 'reportProse', _key: 's2', body: [p('**Switching template:**', 's2a')] },
            {
              _type: 'reportQuote',
              _key: 'sq2',
              emphasis: 'italic',
              text: '"After repainting my BMW last year, I was nervous about Crystal\'s brushes. I tried Spotless\'s touchless Ultimate wash and the difference was immediate — same shine, zero swirl marks, and I get to wash the engine bay myself in the self-serve bay. I switched all my washes to Spotless."',
            },
            { _type: 'reportProse', _key: 's3', body: [p('**Switching offer:**', 's3a')] },
            {
              _type: 'reportList',
              _key: 'sl2',
              style: 'bullet',
              items: [
                'First Ultimate wash $1 with email signup',
                'Membership offer: "Bring your Crystal membership receipt — first month of Spotless Unlimited free"',
              ],
            },
            { _type: 'reportProse', _key: 's4', body: [p('**Narrative: DIY-at-home → Spotless self-serve**', 's4a')] },
            {
              _type: 'reportProse',
              _key: 's5',
              body: [
                p('Why customers switch: water restrictions, neighborhood ordinances, no good water pressure at home, want professional-grade chemicals.', 's5a'),
                p('Switching offer: "Try the self-serve bay on us — your first $4 token is free."', 's5b'),
              ],
            },
          ],
        },
      ],
    },
    {
      _key: 'monitor',
      heading: 'Competitive Monitoring Plan',
      widgets: [
        {
          _type: 'reportSubsection',
          _key: 'mc',
          heading: 'Monthly Checks',
          widgets: [
            {
              _type: 'reportList',
              _key: 'mcl',
              style: 'checklist',
              items: [
                'Crystal Car Wash homepage and pricing page (any changes to membership tiers / pricing?)',
                "Crystal's Yelp and Google review counts and ratings",
                'Yelp page for "Forest Park Super Wash" — has it been claimed/merged?',
                'Both Spotless Yelp pages — count new reviews, respond within 48 hours',
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'qc',
          heading: 'Quarterly Checks',
          widgets: [
            {
              _type: 'reportList',
              _key: 'qcl',
              style: 'checklist',
              items: [
                "Search \"car wash Forest Park\" / \"car wash Oak Park\" on Google — who's in the local pack? Has anyone new entered?",
                'Check Google Maps for any new car wash construction signs in 1.5-mile radius',
                "Mister Car Wash and Tommy's Express expansion announcements (do they list Forest Park, Oak Park, or River Forest as upcoming?)",
                "Compare Crystal's website tech stack and content additions",
              ],
            },
          ],
        },
        {
          _type: 'reportSubsection',
          _key: 'rp',
          heading: 'Response Playbook',
          widgets: [
            {
              _type: 'reportTable',
              _key: 'rpt',
              headers: ['Competitor Move', 'Spotless Response', 'Timeline'],
              rows: [
                { cells: ['Crystal raises membership prices', 'Promote Spotless membership at lower price; run limited-time switch offer', '2 weeks'] },
                { cells: ['Crystal adds a 5th tier or new coating', 'Evaluate add-on; consider parity offering or stronger touchless angle', '1 month'] },
                { cells: ['New national chain announces Forest Park location', 'Lock in members aggressively before opening; emphasize local heritage', '4–8 weeks before their open'] },
                { cells: ['Negative review wave on Spotless', 'Identify root cause (water spots, attendant gap, equipment issue); fix operationally; respond to each review', '1 week'] },
                { cells: ['Crystal launches an app', "Phase forward Spotless's RFID/QR entry plans", '2 quarters'] },
              ],
            },
          ],
        },
      ],
    },
    {
      _key: 'next',
      heading: 'Next Steps',
      widgets: [
        {
          _type: 'reportList',
          _key: 'nl',
          style: 'number',
          items: [
            '**Launch the membership product.** This is the single highest-leverage competitive move. Crystal has been running this play for an unknown period and every month of delay compounds the customer-acquisition deficit.',
            '**Fix the Yelp situation.** Claim/merge the legacy Forest Park Super Wash listing; deploy a post-wash review request flow; respond to every existing review. Goal: 4.0+ stars at both locations within 6 months.',
            '**Build the `/vs/crystal-car-wash` and `/touchless-vs-brush` pages.** Capture the bottom-funnel comparison searches Crystal currently wins by default.',
          ],
        },
        { _type: 'reportProse', _key: 'np', body: [p('**Suggested follow-ups in this suite:**', 'n1')] },
        {
          _type: 'reportList',
          _key: 'nl2',
          style: 'bullet',
          items: [
            '`/market copy` — rewrite the homepage hero, location pages, and a new membership LP using the differentiation positioning above.',
            '`/market funnel` — design the membership signup funnel + welcome email sequence for switchers.',
            '`/market ads` — build Google Local Service Ad and Meta ad creative around the "touchless + self-serve" + "winter heated" angles.',
          ],
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
            'Crystal Car Wash — Forest Park IL: https://www.crystalcarwashforestpark.com/',
            'Crystal Car Wash — Membership Packages: https://crystalcarwashforestpark.com/packages/',
            'Spotless Car Wash — Yelp (Roosevelt Rd): https://www.yelp.com/biz/spotless-car-wash-forest-park-2',
            'Spotless Car Wash — Yelp (Madison St): https://www.yelp.com/biz/spotless-car-wash-forest-park',
            'Forest Park Super Wash — Yelp (legacy listing at 7802 Madison): https://www.yelp.com/biz/forest-park-super-wash-forest-park',
            'Best 10 Car Wash in Forest Park — Yelp: https://www.yelp.com/search?cflt=carwash&find_loc=Forest+Park,+IL',
            'Jendies Auto Spa — Nextdoor: https://nextdoor.com/pages/jendies-auto-spa-forest-park-il/',
            'Mister Car Wash — Unlimited Wash Club: https://mistercarwash.com/unlimited-wash-club/',
            'Mister Car Wash — Membership Plans: https://mistercarwash.com/join-unlimited-wash-club/',
          ],
        },
      ],
    },
  ],
  footerLine: 'Created by Center Point Digital LLC — `/market competitors`',
}

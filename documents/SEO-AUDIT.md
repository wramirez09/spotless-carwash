# SEO Content Audit
## https://spotless-carwash-git-main-center-point-digital.vercel.app/
### Date: 2026-04-26

> Note: This supersedes the prior `SEO-AUDIT.md` (which audited the legacy `schultzmedia04.com/spotlesswash/tokens.html`). Most of the legacy critical issues — HTTPS, viewport, semantic markup, mobile-friendliness, business-owned domain — are either resolved or one config step away from resolved on this redesign.

---

## SEO Health Score: 62/100

This is a major upgrade from the legacy 22/100. HTTPS with HSTS preload ✅, viewport meta ✅, real semantic markup with a single H1 and logical H2 hierarchy ✅, mobile-responsive layout ✅, served from Vercel's CDN ✅. The voice and on-page copy quality is high and the local-business signals (NAP, hours, two addresses, phone, "since 1998") are present.

What holds the score back is fixable in a sprint and falls into three buckets: **(1) Indexability** — the site is a Vite + React client-side-rendered SPA that ships an 824-byte HTML shell. Google's renderer can execute JS, but JS-rendered content indexes slower, less reliably, and can simply be skipped on rendering-budget pressure. For a local business that depends on local-pack and "near me" search, that's a real risk. **(2) Local SEO foundations** — no meta description, no `LocalBusiness` schema, no `robots.txt`, no `sitemap.xml`, no canonical tag. Every one of those is a one-line fix and each unlocks something Google needs. **(3) Production readiness** — the audited URL is a Vercel git-branch preview, not a production domain. None of the SEO investment compounds until a real domain is pointed at it.

The single highest-leverage move: **claim and verify a Google Business Profile for both Forest Park locations.** For a local car wash, GBP traffic is roughly 5–10× organic web traffic in volume, and it converts on directions/calls without requiring the website to rank for anything.

---

## On-Page SEO Checklist

### Title Tag
- **Status:** Needs Work
- **Current:** `Spotless Carwash — Forest Park, IL` (33 chars)
- **Recommended:** `Spotless Carwash · 24/7 Touchless Car Wash · Forest Park, IL` (60 chars)
- **Issues:**
  - Doesn't contain the primary search keyword **"car wash"** anywhere — ranking for "Spotless Carwash" works (branded), but "car wash forest park" does not
  - 27 unused characters in the SERP allowance
  - Doesn't differentiate (touchless / 24/7 are competitive moats and absent)
  - Will need uniqueness once additional pages exist (`/tokens`, `/locations/roosevelt-rd`, etc.)

### Meta Description
- **Status:** **Fail (missing)**
- **Current:** *(none)*
- **Recommended:** `Forest Park's 24/7 touchless car wash since 1998. Two locations with heated automatic bays for winter and self-serve wand bays open every hour of the year.` (158 chars)
- **Why it matters:** Without a meta description, Google auto-generates a snippet from rendered page text. With a JS-rendered SPA, that auto-snippet may be empty or generic for several weeks while indexing catches up — depressing CTR on every search impression during that window.

### Open Graph / Twitter Cards
- **Status:** Fail (missing)
- None present. Pasting the URL into Facebook, iMessage, Slack, or Google Business posts will produce a blank or fallback preview.
- **Required minimum:**
  ```html
  <meta property="og:title" content="Spotless Carwash — 24/7 Touchless Wash, Forest Park IL" />
  <meta property="og:description" content="Two Forest Park locations, heated automatic bays, self-serve wand bays. Open 24/7 since 1998." />
  <meta property="og:image" content="https://[domain]/og-image.png" />
  <meta property="og:url" content="https://[domain]/" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  ```

### Heading Hierarchy
- **Status:** Pass with caveats
- **H1:** *Spotless Carwash — keep it clean.* (one, present)
- **H2s** (logical order, all present): Wash packages · How it works · Locations · Bays · Self-serve dial · Wash tokens · Email · *(implicit on Footer cols)*
- **Issues:**
  - H1 is brand-first, no keyword (*"car wash"* appears only in the brand name "Carwash" as one word, which Google may or may not split). Consider an H1 that keeps brand identity but adds a keyword line: `Spotless Carwash` *(visible H1)* + a styled `<p>` underneath that reads `Forest Park's 24/7 touchless car wash` — same visual hierarchy, much stronger semantic signal.
  - H2 *"Two bays in Forest Park"* contradicts the location cards (which show 3+2 bays per location, 10 total) — **factual error flagged in COPY-SUGGESTIONS.md as well.**
  - Heading hierarchy correctly never skips levels (H1 → H2 → H3 inside cards)

### Image Optimization
- **Status:** **N/A — no real images shipped yet**
- The build references images as code-comment placeholders only (`// photo: auto-bay-interior.jpg`, `// photo: roosevelt-rd-exterior.jpg`, etc.). The deployed page renders gradient backgrounds and SVG icons in place of actual photography.
- **When real photos ship:**
  - **All `<img>` tags must have descriptive alt text** (e.g., `alt="Spotless Carwash automatic bay interior on Roosevelt Road, Forest Park IL"`)
  - **File names hyphenated, lowercase** (`auto-bay-interior.webp`)
  - **WebP with JPG fallback** (Vite supports this via `<picture>` or build plugins)
  - **`width` and `height` attributes** set to natural dimensions (prevents CLS — currently a risk because the placeholder gradients have height but no aspect-locked images)
  - **`loading="lazy"`** on every image below the fold (Locations, Bays, Tokens sections)
  - **Avoid hero-section lazy-load** — the hero image (if added) should be the LCP element with `fetchpriority="high"` and preload hints

### Internal Linking
- **Status:** Pass for current single-page architecture, but limited
- All internal links are in-page anchor jumps (`#washes`, `#how`, `#locations`, `#bays`, `#tokens`)
- **No crawlable separate pages exist yet.** Once the site adds `/tokens`, `/locations/roosevelt-rd`, `/locations/madison-st`, `/wash-packages`, etc., the link graph becomes a real consideration.
- Anchor text is descriptive (Washes, How it works, Locations, Bays, Tokens) — good.
- 4 of 8 distinct CTAs are `href="#"` placeholders (per COPY-SUGGESTIONS.md). That's a UX issue but not an SEO issue (Google ignores `#` self-links).

### URL Structure
- **Status:** Fail (preview domain)
- **Current:** `spotless-carwash-git-main-center-point-digital.vercel.app`
- **Issues:**
  - Vercel preview domain is not a production URL
  - 60+ characters
  - Subdomain on `vercel.app` accrues no compounding domain authority
  - Once a production domain ships, anchor structure is fine: `/`, `/#washes`, `/#tokens` etc. are clean
- **Recommended:** Point a real domain (e.g., `spotlesscarwash.com` or geographically-specific `spotlessforestpark.com`) at the Vercel project, configure 308 redirects from any old `schultzmedia04.com/spotlesswash/*` URLs, and verify HTTPS + www-or-apex redirect consistency.

---

## Content Quality (E-E-A-T)

| Dimension | Score | Evidence |
|---|---|---|
| Experience | **Present** | Specific operational detail throughout — 4:30 average wash, $0.25/30s self-serve pricing, 9 numbered self-serve dial steps with order-of-operations advice, "let presoak sit 10–20 seconds," "never Lustra Shield as the final step." Reads like an operator wrote it, not a marketer. |
| Expertise | **Present** | Industry terminology used correctly (Lustra Shield, tri-foam polish, spot-free rinse, air cannon dryer, undercarriage spray). Self-serve dial section is genuinely instructive. |
| Authoritativeness | **Weak** | "Since 1998" in footer. No GBP linkage, no review count, no press mentions, no awards, no About page, no owner/operator story. |
| Trustworthiness | **Present** | HTTPS + HSTS ✅, NAP visible (two addresses + phone + email) ✅, hours stated. Missing: privacy policy, terms, refund policy on tokens, customer reviews, GBP link. |

For a hyperlocal service business, **Authoritativeness** is the bottleneck. A claimed-and-verified Google Business Profile with 50+ reviews per location, plus a public review-count display on the homepage, would move both Authoritativeness *and* Trustworthiness from Present to Strong.

---

## Keyword Analysis

### Primary Keyword
- **Likely target:** `car wash forest park il` (commercial-local)
- **Better target:** `touchless car wash forest park` + `24 hour car wash forest park il` (lower competition, higher intent fit, plays directly to the differentiators the page already owns)

| Element | Status | Notes |
|---|---|---|
| Keyword in title | **Fail** | "car wash" doesn't appear (only "Carwash" as one word inside the brand) |
| Keyword in H1 | **Fail** | Brand-only H1 |
| Keyword in first 100 words | **Partial** | "Forest Park, Illinois" present in eyebrow; "wash" appears in "let the wash do the work" — but not the phrase "car wash" |
| Keyword in subheadings | **Pass** | "Wash packages," "Wash tokens," "Self-serve dial," "Two bays in Forest Park" |
| Keyword in meta description | **Fail** | No meta description |
| Keyword in URL | **N/A** | Preview domain — moot until production domain |
| Keyword density | **Low** | Page leans on "wash" alone (~12 occurrences) but rarely uses "car wash" as the bigram. Adding the phrase 2–3 more times naturally would help. |

### Secondary Keywords to integrate
- touchless car wash
- 24 hour / 24/7 car wash
- self-serve car wash forest park
- automatic car wash near me
- car wash oak park / river forest / maywood / berwyn (geo-modifiers — the bordering neighborhoods)
- heated car wash (winter-specific, low competition)
- spot-free rinse car wash
- wash tokens / prepaid car wash
- car wash open 24 hours

### Search Intent
- **Hybrid: navigational + commercial-local.** A user searching "Spotless Carwash Forest Park" has navigational intent (find this specific business) — page satisfies. A user searching "car wash near me" or "24 hour car wash forest park" has commercial-local intent — page is **structurally well-suited** but won't rank without keyword presence in title/H1/meta + LocalBusiness schema + GBP linkage.
- The Self-serve dial section accidentally satisfies *informational* intent ("how to use a self-serve car wash") — that's a featured-snippet opportunity (see below).

---

## Technical SEO

### HTTPS
- **Status: Pass.** HTTPS with HSTS preload (`max-age=63072000; includeSubDomains; preload`). Excellent.

### robots.txt
- **Status: Fail (404).** Add at minimum:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://[production-domain]/sitemap.xml
  ```

### XML Sitemap
- **Status: Fail (404).** With Vite, the easiest path is the `vite-plugin-sitemap` package or a static `public/sitemap.xml` file. Until separate routes exist, the sitemap can be a single-URL file pointing at `/`. Submit to Google Search Console after a production domain is set.

### Canonical Tag
- **Status: Missing.** Add `<link rel="canonical" href="https://[production-domain]/" />` in `index.html` head. Without it, Google may pick the preview-domain URL as canonical even after production ships, which destroys ranking equity.

### Robots Meta
- **Status: Implicit pass** (no robots meta = default index/follow). **However,** if the project has been crawled by Google on the preview URL, you'll want to add `<meta name="robots" content="noindex" />` to non-production deployments to avoid index pollution. Two options:
  - Vercel deployment-level: `Settings → Deployment Protection` set to "All Deployments" except production
  - In code: conditionally render `<meta name="robots" content="noindex" />` when `import.meta.env.MODE !== 'production'` or hostname doesn't match production
- **Critical:** before going live, verify the production domain does NOT have `noindex`.

### Charset / Doctype
- **Status: Pass.** `<!doctype html>` HTML5 ✅, `<meta charset="utf-8" />` ✅, `<html lang="en">` ✅.

### Viewport / Mobile
- **Status: Pass.** `<meta name="viewport" content="width=device-width,initial-scale=1" />` ✅. Tailwind responsive breakpoints used throughout component code (`sm:`, `md:`, `lg:`). Sticky nav, responsive grids, mobile-first padding. No fixed-pixel layout traps.

### JavaScript Rendering
- **Status: Risk.** This is a Vite + React **client-side-rendered** SPA. The HTML payload is 824 bytes — a shell. All copy is rendered by JS at runtime. Implications:
  - Googlebot can render JS but does so on a **second-pass** with a delay measured in days-to-weeks
  - JS rendering can fail silently on errors, breaking indexing
  - Bing, DuckDuckGo, social-card scrapers, and AI crawlers are far less reliable at JS rendering than Google
  - For local commercial intent, this is a competitive disadvantage vs. a competitor on a static site
- **Three options, in order of recommendation:**
  1. **Pre-render to static HTML** at build time using `vite-plugin-prerender` or `vite-plugin-ssr`. Each route becomes a static HTML file. Lowest disruption — works with the existing component structure.
  2. **Migrate to Astro** (or Next.js with SSG). Larger refactor but better long-term for a content site. Astro is the natural fit since this site is mostly static.
  3. **Stay client-rendered + lean hard on Google Business Profile.** GBP traffic doesn't depend on web indexing. Defensible if the site is essentially a brochure with conversion happening via phone/directions.

### Page Speed (estimated)
- **TTFB:** 119 ms (Vercel CDN, cache HIT) — Excellent
- **HTML payload:** 824 bytes — Excellent
- **JS bundle:** unknown (need to fetch `/assets/index-grc_iPmD.js`) — likely 100–250 KB minified+gzipped given React + Tailwind
- **CSS bundle:** unknown (`/assets/index-D1wTAcDp.css`) — likely 30–50 KB minified+gzipped
- **Render-blocking resources:** Google Fonts (3 font families across 11 weights) — large preconnect hint already present, but consider self-hosting subsets to remove a third-party DNS lookup
- **Compression:** brotli/gzip via Vercel — enabled by default
- **Caching:** `cache-control: public, max-age=0, must-revalidate` on HTML (correct — invalidates on each deploy); JS/CSS chunks should have year-long immutable cache headers (Vercel default — verify)

### Schema / Structured Data
- **Status: Missing entirely.** This is the single biggest local-SEO gap.

---

## Content Gap Analysis

| Missing Topic | Volume | Competition | Content Type | Priority |
|---|---|---|---|---|
| Hours, services, photos, reviews on Google Business Profile (×2 locations) | **Very High** | Low | GBP setup | **1** |
| FAQ section (token expiration, gift use, refunds, what each wash includes, payment methods, dimensions for trucks/SUVs) | High | Low | FAQ + FAQPage schema | **1** |
| "Touchless vs brush car wash — which is safer for paint?" | Medium | Medium | Blog post | 2 |
| "Best car wash for Chicago winters" | Medium | Low | Blog post / location page | 2 |
| Per-location landing pages (`/locations/roosevelt-rd` and `/locations/madison-st`) with full NAP + photos + per-location wash menu + LocalBusiness schema | **High** | Low | Page | **1** |
| Token gift landing page (`/gift-tokens`) with gift-specific copy | Medium | Low | Page | 3 |
| "How to use a self-serve car wash" — instructional content (the existing dial section is the start of this) | Medium | Low | Blog or expanded page section | 3 |
| Pricing comparison: tokens vs pay-as-you-go vs subscription (if subscription is a thing) | Medium | Low | Comparison table | 4 |
| Service-area pages: "Car Wash Near Oak Park IL," "Car Wash Near River Forest IL" | High | Medium | Geo-targeted landing pages | 4 |

---

## Featured Snippet Opportunities

The page already has the bones for several snippet wins — they just need the question-format scaffolding to surface.

1. **"How does a touchless car wash work?"**
   - Add an H2 with that exact phrase. Follow with a 40–60 word paragraph from the existing voice:
     > A touchless car wash uses high-pressure water and chemical detergents to clean a vehicle without any brushes or fabric strips touching the paint. At Spotless Carwash, you pull into the bay, line up on a green light, and stay still while soap, rinse, and air-cannon dryers complete the wash in about 4 minutes.

2. **"What does a Lustra Shield car wash do?"**
   - The page mentions Lustra Shield in two places. Adding an H3 + paragraph definition would own this niche industry-term snippet.

3. **"How to use a self-serve car wash"** (list snippet)
   - The 9-setting dial is already a list. Add an H2 above it: *"How to use the self-serve car wash, in order"* — Google may already lift this as a list snippet once it's wrapped in `<ol>` semantics.

4. **"Are car wash tokens worth it?"**
   - Buy-intent informational query. Direct answer in 50 words: *"At Spotless Carwash, a 4-pack of wash tokens costs $35 — that's $8.75 per wash compared to $13 paid at the cash station, a 33% savings. Tokens never expire, work at both Forest Park locations, and can be gifted."*

5. **"Car wash open 24 hours near me"**
   - Add an H2 *"Open 24 hours, every day of the year"* with a paragraph explaining both locations' 24/7 status.

---

## Schema Markup (Current vs Recommended)

| Schema Type | Current | Recommended | Priority |
|---|---|---|---|
| Organization | Missing | Add to homepage `<head>` | High |
| **LocalBusiness × 2** (one per location) | **Missing** | Add to homepage as `@graph` array, repeat on per-location pages once they exist | **Critical** |
| Service / OfferCatalog (4 wash tiers) | Missing | Add nested in LocalBusiness | Medium |
| Product + Offer (token packs) | Missing | Add to tokens section | Medium |
| HowTo (self-serve dial) | Missing | Strong fit for the 9-step section | Medium |
| FAQPage | Missing | Add when FAQ section is built | High |
| BreadcrumbList | N/A | Add when sub-pages exist | — |
| Review / AggregateRating | Missing | Add once GBP reviews are aggregated to the site | High |

**Minimum-viable LocalBusiness JSON-LD to ship today:**
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AutoWash",
      "@id": "https://[domain]/#roosevelt",
      "name": "Spotless Carwash – Roosevelt Rd",
      "url": "https://[domain]/",
      "telephone": "+17087712945",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "7343 Roosevelt Road",
        "addressLocality": "Forest Park",
        "addressRegion": "IL",
        "postalCode": "60130",
        "addressCountry": "US"
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
        "opens": "00:00",
        "closes": "23:59"
      },
      "priceRange": "$"
    },
    {
      "@type": "AutoWash",
      "@id": "https://[domain]/#madison",
      "name": "Spotless Carwash – Madison St",
      "url": "https://[domain]/",
      "telephone": "+17087712945",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "7802 Madison Street",
        "addressLocality": "Forest Park",
        "addressRegion": "IL",
        "postalCode": "60130",
        "addressCountry": "US"
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
        "opens": "00:00",
        "closes": "23:59"
      },
      "priceRange": "$"
    }
  ]
}
```
Validate with [Google's Rich Results Test](https://search.google.com/test/rich-results) before shipping.

---

## Internal Linking Opportunities

The current site is a single page — internal linking analysis is mostly forward-looking.

**As soon as separate pages exist:**
- Homepage → `/locations/roosevelt-rd` and `/locations/madison-st` (per-location pages with their own LocalBusiness schema and unique content)
- Homepage → `/tokens` (deep landing page for paid traffic, per AD-CAMPAIGNS.md)
- Homepage → `/gift-tokens` (seasonal landing)
- `/tokens` ↔ `/locations/*` (cross-link bay locations from token page so buyers see where to redeem)
- Blog (when it exists) → relevant service pages with descriptive anchor text ("our touchless automatic wash" not "click here")
- Footer: every page links back to the homepage and to both location pages — strengthens internal PageRank flow to high-value pages

**Anchor text discipline:**
- Avoid "Site details" (current Locations card CTA) — rename to "See bays at this location" — descriptive anchor text helps Google parse what's at the destination
- Use the keyword in anchor text where natural: *"See our 24/7 touchless car wash bays on Roosevelt Road →"*

---

## Core Web Vitals (Estimated)

| Metric | Likely Status | Cause / Fix |
|---|---|---|
| **TTFB** | **Pass** (~120ms via Vercel CDN) | Excellent |
| **FCP** | At Risk | JS bundle must execute before any visible content. Once content appears, it's fast — but the gap between TTFB and FCP grows with bundle size. Pre-rendering eliminates this gap. |
| **LCP** | At Risk | Hero is currently text + gradient (no image), so LCP is the H1 — should be fast. *Once a hero image is added*, it becomes the LCP and must be preloaded with `fetchpriority="high"` |
| **CLS** | At Risk | Placeholder gradient cards have fixed heights but the *real* photos haven't been integrated yet. When they ship, every `<img>` needs explicit width/height to prevent shift |
| **INP** | Pass | Minimal interactivity. Marquee ticker and traffic-light animation are pure CSS/setInterval — no expensive event handlers |
| **Mobile-Friendliness** | Pass | Viewport ✅, responsive Tailwind grid, sticky nav, 44px+ tap targets |

**Revenue framing:** For a local service business, the LCP/CLS revenue conversation is small (visitors are already pre-qualified by intent), but JS-rendering risks **affect indexability itself** — and a page that doesn't get indexed produces zero revenue regardless of speed. Pre-rendering is therefore the highest-ROI performance move.

---

## Content Strategy Recommendations

Realistic strategy for a 2-location local car wash:

**Foundation (pre-content, weeks 1–3):**
1. Production domain pointed at the Vercel project (or migrate to a CMS-friendly host once content scales)
2. GBP claimed and verified for both locations
3. `LocalBusiness` schema, sitemap, robots.txt, meta descriptions, OG tags
4. Pre-rendering or SSG migration so content is HTML-rendered

**Local content (weeks 3–8):**
5. Per-location landing pages (Roosevelt Rd, Madison St) — these are the two highest-value SEO pages this business will ever have
6. FAQ page or expanded FAQ section on homepage with schema
7. `/tokens` deep landing page (for paid traffic alignment per AD-CAMPAIGNS.md)
8. `/gift-tokens` seasonal landing for Q4 + June

**Educational content (months 3+, 1 post / 2 weeks):**
- "How to use a self-serve car wash (in 9 steps)" — they already have the content; it's a blog post in waiting
- "Touchless vs brush car wash: what's actually safer for your paint?" — high-fit comparative content
- "Best way to wash your car in Chicago winter" — seasonal/local
- "What does each wash package include? (Basic vs Clean vs Spotless vs Showroom)" — long-tail keyword + buyer education

**Distribution:** Cross-post blog content to Google Business Profile posts (free local SEO boost) and to the existing Forest Park / Oak Park / River Forest neighborhood Facebook + Nextdoor groups (per AD-CAMPAIGNS.md targeting).

**Content prioritization:**
| Content Idea | Volume | Competition | Business Value | Score |
|---|---|---|---|---|
| Per-location pages × 2 | High | Low | High | **10** |
| FAQ + schema | High | Low | High | **10** |
| `/tokens` deep landing | Medium | Low | High | **9** |
| GBP setup & first 50 reviews | Very High | Low | Very High | **10** |
| Self-serve guide blog | Medium | Low | Medium | 7 |
| Touchless-vs-brush blog | Medium | Medium | Medium | 6 |
| Chicago winter blog | Medium | Low | Medium | 7 |

---

## Prioritized Recommendations

### Critical (Fix Before Production Launch)
1. **Point a real production domain** at the Vercel project (or wherever production will live). All other SEO investment depends on this.
2. **Add `<meta name="robots" content="noindex">` to preview/branch deployments** so they don't dilute the production domain in Google's index.
3. **Add a meta description, Open Graph tags, and Twitter card meta** to `index.html` head.
4. **Add `LocalBusiness` JSON-LD schema** for both locations (template provided above).
5. **Add `robots.txt`** pointing to a sitemap, and a **`sitemap.xml`** (single-URL file is fine to start).
6. **Add a self-referencing canonical tag.**
7. **Pre-render the page to static HTML at build time** (or migrate to SSG). For a content/marketing site this size, client-side rendering is a real local-SEO disadvantage.
8. **Claim and verify Google Business Profile for both locations.** This is the highest-ROI single action for local search visibility — step-change in traffic volume vs. organic web SEO for hyperlocal services.

### High Priority (First Month After Launch)
9. **Rewrite the title tag** to include "Touchless Car Wash" + "Forest Park, IL" alongside the brand.
10. **Fix the "Two bays in Forest Park" H2** factual error (covered in COPY-SUGGESTIONS.md).
11. **Add an FAQ section** with `FAQPage` schema (token expiration, payment, vehicle size limits, gift use, refund policy, what each wash includes).
12. **Build per-location landing pages** with unique content, photos, and per-location `LocalBusiness` schema.
13. **Add `Service` / `OfferCatalog` schema** for the 4 wash tiers and `Product`/`Offer` schema for tokens.
14. **Resolve heated-bays inconsistency** between Locations and Bays sections.

### Medium Priority (Quarter 1–2)
15. **Photograph and ship real images** with proper alt text, WebP format, hyphenated lowercase filenames, lazy-loading below the fold, explicit width/height to prevent CLS.
16. **Build `/tokens` deep landing page** for paid-traffic alignment (so token ads don't have to send people to a homepage anchor).
17. **Add Featured Snippet H2s** ("How does a touchless car wash work?", "Are car wash tokens worth it?") with 40–60 word answers immediately after.
18. **Add `HowTo` schema** to the self-serve dial section.
19. **Add review widget** displaying GBP reviews on the homepage with `AggregateRating` schema.
20. **Add a privacy policy and terms** page (linked from footer) — required for trust and most third-party integrations (email service, analytics).

### Low Priority (When Resources Allow)
21. **Begin the blog** — 1–2 posts per month focused on local + educational topics.
22. **Build geo-targeted service-area pages** for Oak Park, River Forest, Maywood, Berwyn (if those are real customer-source ZIPs).
23. **Self-host Google Fonts subsets** to reduce render-blocking and remove a third-party DNS lookup.
24. **Earn local backlinks** — Forest Park Chamber of Commerce, neighborhood blogs, Yelp profile, Patch.com Forest Park, BBB.

---

## Cross-Skill Integration

- **COPY-SUGGESTIONS.md** flagged the "Two bays in Forest Park" error and the placeholder CTAs — both relevant to SEO crawl quality and snippet generation.
- **AD-CAMPAIGNS.md** assumed the prior tokens page was the paid-traffic destination. With the redesign, paid traffic should land on `/` (when wired) or a dedicated `/tokens` page once built. The "do not run paid traffic" pre-launch blocker from that doc is now mostly resolved (HTTPS ✅, mobile ✅) — only the placeholder CTAs and missing token deep page remain.
- Suggested follow-ups: **`/market landing`** to spec the per-location and `/tokens` deep landing pages, and **`/market brand`** to codify the voice (already strong) into reusable guidelines so future content stays consistent.

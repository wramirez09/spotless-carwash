
# SEO Content Audit
## https://spotless-carwash-git-main-center-point-digital.vercel.app/
### Date: 2026-05-08

---

## SEO Health Score: 70/100

**Grade: B–** Strong foundation (titles, descriptions, schema, sitemap exist and are mostly well-formed). Real wins are immediate. Bigger gaps are in canonicalization, social/OG metadata, and content depth (no blog/educational layer).

> **Note re: prior audit.** The earlier `/market audit` flagged "No visible LocalBusiness schema / structured data" as an issue. After inspecting the rendered HTML directly, that finding was **incorrect**. The site actually ships extensive JSON-LD: `AutoWash` (a LocalBusiness sub-type), `Organization`, `HowTo`, `Service`, `OfferCatalog`, `Offer`, `OpeningHoursSpecification`, `PostalAddress`, `City`, plus `FAQPage` schema on `/faq`. This is one of the *strongest* parts of the site's SEO foundation, not a gap. Updating the mental model.

---

## On-Page SEO Checklist

### Title Tag

| Page | Status | Title | Length |
|------|--------|-------|--------|
| Homepage | ✅ Pass | `Spotless Carwash · Touchless Car Wash · Forest Park, IL` | 54 |
| Roosevelt Rd | ⚠️ Needs Work | `Roosevelt Rd · Spotless Carwash · Forest Park, IL · Spotless Carwash` | 67 |
| Madison St | ⚠️ Needs Work | (likely same pattern as Roosevelt — title template appending brand twice) | ~67 |
| FAQ | ✅ Pass | `FAQ · Touchless & Self-Serve Car Wash Questions · Spotless Carwash` | 65 |

**Issue: location page titles double up the brand name.** The site config has both a per-page title (e.g. "Roosevelt Rd · Spotless Carwash · Forest Park, IL") *and* a `titleTemplate` of `%s · Spotless Carwash` that appends "Spotless Carwash" again. Result: `Roosevelt Rd · Spotless Carwash · Forest Park, IL · Spotless Carwash`. Pushes title past 60 chars and looks odd in SERPs.

**Recommended fix:** Remove the brand name from the per-page title (let the template append it once), OR drop the global template. Pick one.

```ts
// Pick ONE pattern:
// (a) Per-page title is the SEO target, let template add brand
title: 'Touchless Car Wash on Roosevelt Rd, Forest Park IL'  // → "...· Spotless Carwash"
// (b) Per-page title already contains brand, no template
title: 'Roosevelt Rd · Spotless Carwash · Forest Park, IL'    // titleTemplate: undefined
```

**Recommended titles (option a):**
- Homepage: `Touchless Car Wash · Forest Park, IL · Spotless Carwash` (lead with keyword, 54)
- Roosevelt: `Touchless Car Wash on Roosevelt Rd, Forest Park IL · Spotless Carwash` (60)
- Madison: `Touchless Car Wash on Madison St, Forest Park IL · Spotless Carwash` (60)
- FAQ: `Self-Serve & Touchless Car Wash FAQ · Forest Park IL · Spotless Carwash` (66 — slightly long, OK)

### Meta Description

| Page | Status | Length | Notes |
|------|--------|--------|-------|
| Homepage | ✅ Pass | 137 | Geo-anchored, mentions touchless + self-serve + heated + hours — strong |
| Roosevelt Rd | ✅ Pass | 150 | Includes street address — excellent for local |
| Madison St | ✅ Pass | (~150) | Same pattern |
| FAQ | ✅ Pass | 157 | Strong; right at ceiling |

All meta descriptions are well-written: keyword-anchored, contain an implicit value prop, end with hours or address. No major issues. Minor opportunity: add a CTA verb to the homepage description.

**Suggested homepage description:**
> *"Forest Park's touchless car wash since the '90s. Two locations, heated automatic bays for winter, self-serve wand bays — open 7am–10pm daily. Plan your wash."* (155)

### Heading Hierarchy

**Homepage H1:** `Spotless Carwash — keep it clean.`

**Issue:** The H1 leads with the brand name and the tagline — neither contains the primary keyword phrase. For local SEO, the H1 should ideally include "Touchless Car Wash" + city.

**Recommended H1:**
> *"Forest Park's Touchless Car Wash — Spotless Carwash"* (or variations)

**Roosevelt H1:** `Spotless Carwash on Roosevelt Rd` ✅ — geo-anchored, OK.
**Madison H1:** Same pattern ✅
**FAQ H1:** `Questions, answered.` ⚠️ — too generic; doesn't include any keyword.

**Recommended FAQ H1:** *"Spotless Carwash FAQ — touchless, self-serve, tokens, hours"* or *"Touchless & Self-Serve Car Wash Questions"*

**H2 structure:** Strong. Section headlines on the homepage are clear and topical:
- "Pull up & watch the lights." (Hero)
- "Four ways to make your car shine." (Wash packages)
- "Two locations. Ten bays. All in Forest Park." (Locations)
- "Sit back, or do it yourself." (Bays)
- "Nine settings. One clean car." (Self-serve dial)
- "Everything else on the lot." (Other services)
- "Buy a stack…" (Tokens)

These read well and are distinct. Minor SEO weakness: no H2 on the homepage explicitly contains "Forest Park" or "touchless" — the keyword density is carried by body copy and schema, not subheads.

### Image Optimization

- ✅ Using `next/image` with proper `srcSet` and multiple breakpoints (640w, 750w, 828w, 1080w, 1200w, 1920w, 2048w, 3840w) — modern, responsive, and the build pipeline will serve WebP/AVIF where supported.
- ✅ `quality=75` is reasonable for web.
- ⚠️ **Alt text count is light.** Only 4 alt attributes detected on the homepage. Many image roles are likely background/decorative.
- ⚠️ **One image filename has a typo:** `madison-loaction.jpg` (should be `madison-location.jpg`). Filenames are a minor SEO signal — descriptive, correct filenames help.
- ⚠️ **No OpenGraph image** (`og:image`) is set. Social shares will show empty cards on Twitter/X, LinkedIn, Slack, iMessage, Facebook, etc. This is a real visibility/CTR loss in the social channel. Twitter card type is `summary_large_image` but no image is provided — **broken**.

**Recommended fixes:**
1. Add an `og:image` (and `twitter:image`) — 1200×630 hero image of the storefront or a wash bay. Set in `app/layout.tsx` Metadata or per-page Metadata.
2. Audit alt text on every `Image` and ensure each conveys subject + context (e.g. *"Touchless automatic bay interior at Spotless Carwash Roosevelt Rd"* not *"bay"*).
3. Rename `madison-loaction.jpg` → `madison-location.jpg`.

### Internal Linking

- ✅ Footer links to `/locations/roosevelt-rd`, `/locations/madison-st`, `/faq`, plus in-page anchors `/#washes`, `/#bays`, `/#tokens`, `/#how`.
- ✅ Anchor text is descriptive ("Roosevelt Rd", "Madison St", "Wash packages") — no "click here".
- ⚠️ **Limited deep linking.** Outside the footer, there's little contextual cross-linking. The FAQ doesn't link out to the relevant location/wash pages. The homepage doesn't deep-link to FAQ entries.
- ❌ **No blog/content cluster** to link from (the site has no `/blog` or `/learn`). This is a content depth issue, not strictly a linking issue.

**Recommendation:** When the blog/content layer goes in (see Strategy section), build a hub-and-spoke: each post links to homepage + nearest location + FAQ entry + tokens.

### URL Structure

| URL | Status | Notes |
|-----|--------|-------|
| `/` | ✅ Pass | — |
| `/faq` | ✅ Pass | Clean, descriptive |
| `/locations/roosevelt-rd` | ✅ Pass | Hierarchical, hyphenated, keyword-rich |
| `/locations/madison-st` | ✅ Pass | Same |

URL structure is clean. Lowercase, hyphenated, hierarchical. No issues.

### Canonical Tags — ❌ MISSING ON ALL PAGES

**Critical:** No `<link rel="canonical">` tag is set on any page. This is a real SEO risk in two scenarios:
1. The Vercel preview URL (`spotless-carwash-git-main-center-point-digital.vercel.app`) and the production domain both index without a canonical pointing to the production version. Google could see them as duplicates and split ranking signal.
2. Any URL parameters appended (e.g. UTM, `?ref=`) generate "duplicate" URLs without a canonical to consolidate.

**Recommended fix:** In `app/layout.tsx` or via `generateMetadata`, set:

```ts
export const metadata = {
  metadataBase: new URL('https://spotlesscarwash.com'),  // production domain
  alternates: { canonical: '/' },  // override per page as needed
  // ...
}
```

Each page should have its own canonical pointing to the canonical version of itself.

---

## Content Quality (E-E-A-T)

| Dimension | Score | Evidence |
|-----------|-------|----------|
| **Experience** | Weak | The site doesn't tell stories of operating a car wash for 30+ years. No "since 199X", no founder photo, no anecdotes about the heated bays in a particular Chicago winter. The 30-year history is the strongest experiential moat — and it's nearly invisible in the content. |
| **Expertise** | Present | The FAQ shows category expertise (touchless explanation, self-serve walkthrough, token economics, heated bays). The dial instructions match a real industry standard. But there's no expert voice: no "we've been washing cars for 30 years and here's what we've learned" content. |
| **Authoritativeness** | Weak | No author/founder bio, no press mentions, no chamber of commerce affiliations, no community involvement, no awards. Yelp ratings ~3.0 ★ at both locations actively suppress authority signals. |
| **Trustworthiness** | Present | HTTPS ✅, real address ✅, real phone ✅, attendant hours posted ✅, multiple payment methods listed ✅, FAQ answers honest questions. Missing: privacy policy and terms of service pages, customer review widgets pulling Google reviews, third-party trust badges (BBB, chamber). |

**Top E-E-A-T fixes (also drive conversion):**
1. Add an `/about` page with the 30-year story, founder/family photo, why touchless was chosen.
2. Pull live Google reviews into homepage and location pages.
3. Add minimal `/privacy` and `/terms` pages (also helps Google trust signals).
4. Add chamber of commerce / BBB / "voted best in Forest Park" badges if any apply.

---

## Keyword Analysis

### Primary Keywords (currently targeted)

| Keyword | Search Intent | Currently Ranks Well? | Page That Targets It |
|---------|---------------|----------------------|---------------------|
| `touchless car wash forest park` | Commercial/local | Likely top 3 | Homepage |
| `car wash forest park il` | Commercial/local | Competitive (Crystal, Super Wash) | Homepage |
| `self-serve car wash forest park` | Commercial/local | Likely strong | Homepage / Bays section |
| `heated car wash forest park` | Commercial/local | Likely strong (limited competition) | Roosevelt page (should be sharper) |
| `wash tokens forest park` | Transactional | Owned (no competitor offers tokens) | Tokens section |

### Secondary Keywords to Target

These are mostly absent from current copy and should be sprinkled naturally into pages and (especially) future blog content:

- `touchless car wash near me` (geo + intent)
- `car wash oak park il` (neighboring suburb — intent leaks here)
- `car wash river forest il` (neighboring suburb)
- `car wash open late forest park` (the 7am–10pm differentiator)
- `winter car wash chicago` (Roosevelt heated bay opportunity)
- `car wash near oak park` (nearest larger town)
- `apple pay car wash forest park` (already in keywords meta, less common in body)
- `is touchless car wash safe for paint` (informational — high purchase intent)
- `touchless vs brush car wash` (comparison — high purchase intent)

### Search Intent Alignment

| Page | User Intent on Landing | Page Currently Serves That Intent? |
|------|-----------------------|-----------------------------------|
| Homepage | Commercial: "where's a car wash in Forest Park?" | ✅ Mostly — packages and locations are visible |
| Location pages | Local: "is this car wash near me, hours?" | ⚠️ Mostly. Address, hours, phone present. **No embedded map**, no neighborhood context, no location-specific reviews. Reads more like brand pages than local landing pages. |
| FAQ | Informational: "how does X work?" | ✅ — content matches intent well |

### Missing Page Types (pure intent gaps)

- **Membership / Unlimited Wash page** — when launched, will target high-intent commercial searches Crystal currently owns
- **Pricing page** (separate URL) — pricing currently lives in homepage anchor; a `/pricing` page would capture explicit "[brand] pricing" queries
- **Comparison page** — `/touchless-vs-brush` informational; `/vs/crystal-car-wash` commercial

---

## Technical SEO

### robots.txt — ⚠️ Needs Work

Current:
```
User-Agent: *
Allow: /
```

**Issues:**
1. ❌ No `Sitemap:` declaration. Google can find sitemap.xml without it, but it's a free hint that costs nothing.

**Recommended:**
```
User-Agent: *
Allow: /

Sitemap: https://spotlesscarwash.com/sitemap.xml
```

### sitemap.xml — ⚠️ Needs Work

Current sitemap (4 URLs):
```xml
<url><loc>/</loc>...</url>
<url><loc>/faq</loc>...</url>
<url><loc>/locations/roosevelt-rd</loc>...</url>
<url><loc>/locations/madison-st</loc>...</url>
```

**Critical issue:** All `<loc>` values are **relative paths** (`/`, `/faq`, etc.). The sitemap protocol requires **absolute URLs**. Google may silently ignore relative URLs in sitemaps.

**Recommended fix:**
```xml
<url><loc>https://spotlesscarwash.com/</loc>...</url>
<url><loc>https://spotlesscarwash.com/faq</loc>...</url>
<url><loc>https://spotlesscarwash.com/locations/roosevelt-rd</loc>...</url>
<url><loc>https://spotlesscarwash.com/locations/madison-st</loc>...</url>
```

In Next.js App Router with `app/sitemap.ts` or `next-sitemap`, ensure the base URL is configured. With Next's built-in `MetadataRoute.Sitemap`, set `metadataBase` in `app/layout.tsx` and return absolute URLs.

### Canonical Tags — ❌ Missing (also covered above)

### Open Graph & Twitter Cards — ❌ Missing image

| Tag | Status |
|-----|--------|
| `og:title` | ✅ Present |
| `og:description` | ✅ Present |
| `og:type` | ✅ `website` |
| `og:site_name` | ✅ Present |
| `og:locale` | ✅ `en_US` |
| `og:url` | ❌ **Missing** |
| `og:image` | ❌ **Missing** |
| `twitter:card` | ✅ `summary_large_image` (but image missing — broken card) |
| `twitter:title` | ✅ Present |
| `twitter:description` | ✅ Present |
| `twitter:image` | ❌ **Missing** |

**Add a 1200×630 OG image** (a clean shot of the heated bay or the Roosevelt sign with brand text) and set both `og:image` and `twitter:image` in `app/layout.tsx`. Until this is fixed, every social share appears as a blank card — high CTR loss.

### Schema Markup — ✅ Strong

| Schema Type | Page | Status | Notes |
|-------------|------|--------|-------|
| `Organization` | Homepage | ✅ Present | — |
| `AutoWash` (× 2) | Homepage, location pages | ✅ Present | One per location, with `@id`, `name`, `description`, `address`, `openingHours`. **Note:** `LocalBusiness` is the parent type; `AutoWash` is a recognized child type. Some recommend using `LocalBusiness` directly for broader compatibility, but `AutoWash` is the *more specific and correct* type and Google recognizes it. |
| `PostalAddress` | All | ✅ Present | — |
| `OpeningHoursSpecification` | All | ✅ Present | — |
| `City` | Homepage, location pages | ✅ Present | — |
| `Service` + `OfferCatalog` + `Offer` + `MonetaryAmount` | Homepage | ✅ Present | Wash packages marked up — eligible for product/service rich results |
| `HowTo` + `HowToStep` | Homepage | ✅ Present | Self-serve dial as a HowTo — eligible for HowTo rich result if it survives Google's recent rich-result deprecations (HowTo was scaled back in 2023; verify in Search Console) |
| `FAQPage` + `Question` + `Answer` | FAQ | ✅ Present | Eligible for FAQ rich result (now mostly limited to authoritative sites — verify) |
| `BreadcrumbList` | Any | ❌ Not detected | Add to location pages and FAQ once you have site nav crumbs |
| `Review` / `AggregateRating` | None | ❌ Not present | Add if/when pulling Google reviews into the page |

**Schema improvements (high impact, low effort):**
1. Add `Review` / `AggregateRating` to each `AutoWash` once a review pipeline exists (pulling from Google Business Profile).
2. Add `BreadcrumbList` to FAQ and location pages.
3. Verify HowTo and FAQ rich results in Google Search Console — Google has limited eligibility for both schema types; on a low-authority site the schema may parse but not display rich snippets. Still worth shipping; signals topical structure.
4. Add `Service` with `serviceType: "Car Wash Membership"` once the membership product launches.
5. Roosevelt and Madison pages currently have only AutoWash + PostalAddress + OpeningHours + City schema — they could also include `Service` and `OfferCatalog` (a subset of homepage's schema, scoped to that location).

### Page Speed — Not directly measured

Cannot measure Core Web Vitals from a server-side fetch. Initial signals are positive: Next.js 15.5 App Router, code-split JS chunks, proper `next/image` with responsive `srcSet`, async-loaded scripts. Recommend:
- Run [PageSpeed Insights](https://pagespeed.web.dev/) on the deployed URL
- Run Chrome DevTools Lighthouse in private mode
- Check `font-display: swap` on custom fonts (avoids FOIT)
- Verify no layout shift from hero image (check `width`/`height` on `Image` components)

### Mobile-Friendliness — ✅ Pass

- ✅ Viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- ✅ Responsive Tailwind classes (`sm:`, `md:`, `lg:` breakpoints used throughout)
- ✅ `next/image` with multiple breakpoints

---

## Content Gap Analysis

### Missing Content Topics

| Missing Topic | Search Volume Potential | Competition | Content Type | Priority |
|---------------|------------------------|-------------|--------------|----------|
| `touchless vs brush car wash` | High (informational, high commercial overlap) | Medium nationally, low locally | Blog post / dedicated page | **1** |
| `is a car wash safe for new paint` / `…for ceramic coating` | High (very high commercial intent — defensive purchase) | Medium | Blog post | **1** |
| `winter car wash forest park / chicago` | Medium-high seasonal | Low | Seasonal landing page | **2** |
| `car wash near oak park / river forest / berwyn / cicero / maywood` | Medium per neighborhood | Medium | Sub-area landing pages or single "areas served" page | **2** |
| `how to use a self-serve car wash` | Medium informational | Low | Blog post + video | **2** |
| `unlimited car wash forest park` | Medium (Crystal owns this currently) | Medium | Membership LP — only after membership exists | **3** |
| `Spotless car wash review` / `…hours` / `…directions` | Brand queries — already capture these | Low | Already covered | — |
| `LustraShield vs ceramic coating` | Low-medium | Low | Blog post (defensive) | **3** |
| `car wash gift card forest park` | Low-medium seasonal | Low | Add to tokens page | **3** |

The single biggest content opportunity: **a `/touchless-vs-brush` page**. It serves the highest-intent informational query in the category, captures the "is touchless really better" decision-stage searcher, and positions Spotless as the authoritative answer in the Forest Park area.

---

## Featured Snippet Opportunities

The site is well-positioned for several snippet types:

### Paragraph Snippets
**Target queries:** *"how does a touchless car wash work"*, *"how does a self-serve car wash work"*

The FAQ already answers these. To compete for the snippet:
1. Make sure each FAQ question is an exact-match `<h3>` (or `<h2>`) of a likely query.
2. The first 40–60 words after each question should be a self-contained answer.
3. Verify FAQPage schema is parsing correctly in Search Console's URL Inspection.

### List Snippets
**Target query:** *"how to use a self-serve car wash"*

The 9-step dial instructions are perfect list-snippet material. Make sure:
1. The instructions section has an `<h2>` containing the query (e.g. *"How to use the self-serve bay"*).
2. The 9 steps are in an `<ol>` (currently a styled `<div>` per item — works visually but a snippet-eligible `<ol>` is cleaner).
3. The HowTo schema (already present) reinforces this.

### Table Snippets
**Target query:** *"car wash prices forest park"*

Current pricing is shown as cards/tiles. A clean comparison `<table>` of wash packages with price would be more snippet-eligible. Could co-exist with the visual presentation as an SEO-targeted block lower on the page or a `/pricing` URL.

---

## Internal Linking Opportunities

### Specific Recommendations

1. **FAQ → location/wash anchors.** Each FAQ answer should deep-link to the most relevant page anchor. E.g. the "are bays heated in winter?" answer should link to `/locations/roosevelt-rd`. The "do tokens expire?" answer should link to `/#tokens`.
2. **Location pages → FAQ entries.** "Wondering how the touchless wash works? See our FAQ →"
3. **Homepage tokens section → tokens-specific landing page** (when one exists).
4. **Future blog posts → cluster:** every blog post should link to (a) homepage, (b) the most relevant location, (c) one FAQ entry, (d) the tokens or membership section.

### Orphan / Hub Concerns

- No orphan pages currently (only 4 indexable URLs, all linked from header/footer).
- **Hub vulnerability:** as content scales, the homepage will become the only true hub. Recommend creating `/locations/` as an index page once a third location ever opens, and `/learn` or `/blog` as a content hub.

---

## Core Web Vitals (qualitative — measure in production)

Cannot measure from raw HTML. Indicators:
- ✅ Modern Next.js + App Router + React Server Components — good baseline
- ✅ `next/image` with proper sizes — minimizes LCP for hero
- ✅ Async script loading — won't render-block
- ⚠️ Custom fonts (4 detected via class variables) — verify `font-display: swap` to prevent FOIT
- ⚠️ Verify `width`/`height` on hero `Image` to avoid CLS

**Action:** Run PageSpeed Insights on production. If LCP > 2.5s, the most likely culprit is the hero image (`location-exterior.jpg` or similar). Use `priority` prop on the Hero `Image` component to preload it.

**Revenue impact context** (per industry research): a 100ms drop in LCP correlates with ~1.1% conversion lift; pages loading > 5s have ~38% bounce vs. ~9% at < 2s. For a local business where each session is potentially worth a $10–$300 wash + token purchase, even a small CWV win compounds.

---

## Content Strategy Recommendations

### Recommended Cadence
- **1 blog post per month** for the first 6 months. Local-business SEO doesn't need daily content — it needs *the right* content. A monthly cadence is sustainable and matches search demand depth.
- **2 seasonal landing pages per year**: Winter (heated bays, salt removal, Nov–Mar) and Summer (UV protection, road-trip prep, May–Aug).

### First 6 Posts (Priority Order)

1. **"Touchless vs. brush car wash: what's actually safer for your paint?"** — anchor content for the differentiator. Targets the highest-intent informational query.
2. **"Forest Park car wash guide: how to use Spotless's self-serve bay like a pro"** — long-tail "how to" + brand presence.
3. **"How often should you wash your car in winter in Chicago?"** — drives token sales + heated bay positioning.
4. **"Can you wash a Tesla in a car wash? (And other EV/repaint questions)"** — high-search, high-intent, touchless wins decisively.
5. **"LustraShield vs. ceramic coating: what's the difference, and what should you actually buy?"** — defensive content vs. Crystal's ceramic/graphene tier.
6. **"What's a wash token, and is it worth it? (Yes — here's the math)"** — drives token sales.

### Content Update Strategy

- Refresh the homepage and location pages annually with current year, latest copy (anniversaries, etc.).
- Update FAQ as new common questions emerge (mine attendant feedback, email replies, social DMs).

### Distribution Plan

- Email each new post to the newsletter list.
- Cross-post a teaser to Facebook (Spotless already has a FB page).
- Submit business posts to Google Business Profile (functions like mini blog posts and helps local pack).
- Add internal links from older content as new content publishes.

---

## Prioritized Recommendations

### Critical (Fix This Week — small effort, real impact)

1. **Add absolute URLs to sitemap.xml.** Currently `/` instead of `https://spotlesscarwash.com/` — Google may silently ignore relative URLs. Configure `metadataBase` in `app/layout.tsx`.
2. **Add `Sitemap:` declaration to robots.txt.** One line, no risk.
3. **Add canonical tags to every page.** Set `metadataBase` and `alternates.canonical` in `app/layout.tsx` and per-page metadata.
4. **Add `og:image` and `twitter:image`.** Use a 1200×630 hero of the storefront or wash bay. Set in `app/layout.tsx`.
5. **Fix the duplicate-brand title issue on location pages** ("Roosevelt Rd · Spotless Carwash · Forest Park, IL · Spotless Carwash"). Drop brand from per-page title OR drop `titleTemplate`.

### High Priority (This Month)

6. **Rewrite homepage H1 to lead with the keyword:** *"Forest Park's Touchless Car Wash"* (or similar) instead of *"Spotless Carwash — keep it clean."* Tagline can move to a subhead.
7. **Build out location pages with neighborhood content** (~400–600 words per page about the surrounding area, embedded Google map, location-specific photo gallery, location-specific reviews).
8. **Embed Google Business Profile reviews** on homepage and location pages. Adds review signal and addresses E-E-A-T trust gap.
9. **Audit and improve image alt text** across all `Image` components. Be descriptive and include keywords naturally.
10. **Rename `madison-loaction.jpg` → `madison-location.jpg`.** Tiny SEO + correctness win.

### Medium Priority (This Quarter)

11. **Launch the blog/content layer.** Start with the "touchless vs. brush" flagship post. Cadence: 1/month.
12. **Add an `/about` page with the 30-year story.** Founder/family photo, why touchless, why two locations. Strongest E-E-A-T move available.
13. **Add `BreadcrumbList` schema** to location and FAQ pages.
14. **Add `Review` / `AggregateRating` schema** once Google reviews are pulled in.
15. **Build a `/pricing` page** as an SEO-targeted alternative to the homepage anchor — captures explicit pricing queries.
16. **Build a `/touchless-vs-brush` comparison page** — captures the highest-intent informational query in the category.

### Low Priority (When Resources Allow)

17. **Add `/privacy` and `/terms` pages.** Trust signal + occasional E-E-A-T benefit.
18. **Convert dial steps `<div>` to `<ol>`** for cleaner list-snippet eligibility (in addition to the existing HowTo schema).
19. **Add a comparison table** for wash packages with semantic `<table>` markup (alongside the existing visual cards).
20. **Add a sitewide "Areas Served" footer block** listing Forest Park, Oak Park, River Forest, Berwyn, Maywood, Cicero, with each linking to a future area page.

---

## Summary Score Sheet

| Category | Score | Status |
|----------|-------|--------|
| Title Tags | 7/10 | Mostly good; location duplication issue |
| Meta Descriptions | 9/10 | Excellent |
| Headings | 7/10 | Good structure; H1 keyword optimization opportunity |
| Image Optimization | 6/10 | Strong responsive setup; alt text + OG image gaps |
| Internal Linking | 6/10 | Adequate now; no content layer to support deep linking |
| URL Structure | 9/10 | Clean |
| Canonical | 3/10 | Missing |
| Schema Markup | 9/10 | **Genuinely strong** — major correction from prior audit |
| robots/sitemap | 5/10 | Both exist; sitemap uses relative URLs |
| Mobile Friendliness | 9/10 | Solid |
| Content Depth | 4/10 | No blog/content layer |
| E-E-A-T | 6/10 | Trust foundation present; Experience and Authority underdeveloped |
| **Overall** | **70/100** | **Grade: B–** |

---

Sources:
- Page HTML directly inspected via curl
- [robots.txt](https://spotless-carwash-git-main-center-point-digital.vercel.app/robots.txt)
- [sitemap.xml](https://spotless-carwash-git-main-center-point-digital.vercel.app/sitemap.xml)
- Cross-referenced findings with `MARKETING-AUDIT.md` (corrected the schema/structured-data finding) and `COMPETITOR-REPORT.md` (for keyword/positioning gaps)

*Created by Center Point Digital LLC — `/market seo`*

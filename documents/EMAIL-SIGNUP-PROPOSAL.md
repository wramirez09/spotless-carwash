# Email Capture & Subscriber System — Add‑On Proposal

**Prepared for:** Joe O'Connor — Spotless Carwash, Forest Park, IL
**Prepared by:** [PREPARED_BY]
**Date:** June 3, 2026
**Re:** Customer email capture + subscriber database (add‑on to spotlesscarwash.com)

## Executive Summary

We added the ability for your website to collect customer emails and store them in a database you own. The foundation — signup forms, the behind‑the‑scenes plumbing, and the subscriber database — is **built and ready to turn on**. This proposal documents that delivered work (Phase 1) and lays out the recommended next phases that turn a list of addresses into a channel you can actually market with.

An owned email list is the cheapest, most durable way to bring Forest Park customers back — it isn't rented from an ad platform or a social feed, and after 30 years on the corner you have a customer base worth staying in front of. Phase 1 captures those addresses. Phases 2–4 make the list compliant, deliverable, and usable.

**Recommended next step:** approve Phases 2–4 so the list can send a proper welcome, stay legal, and be exported/used — and verify a sending domain so email can go out.

## Why an Email List — and Why Now

- **You own the channel.** Unlike paid ads or social posts, an email list isn't subject to anyone's algorithm or ad budget — you reach subscribers directly, for pennies per send.
- **The relaunch is the moment to start.** Every visitor to the new site is a chance to capture an address; the longer capture is off, the more you leave on the table.
- **Retention is the lever competitors are pulling.** Crystal Car Wash leans on memberships and recurring contact (see `MARKETING-AUDIT`); an email list is the groundwork for seasonal promos, weather‑driven nudges, and — later — a loyalty or membership push.
- **It's nearly free to run.** Sends go through the email service already wired into the site, so ongoing cost is minimal.

## What's Already Built — Phase 1 (Delivered)

Plain‑English summary of the working foundation:

- **Two signup points.** A signup section on the home page ("Spotless updates — straight to your inbox") and a signup form on the under‑construction page, so the site captures addresses whether it's live or in maintenance.
- **Editable wording.** The home‑page headline, body, button, and confirmation text are editable in your content manager (Sanity) — no developer needed to change the copy.
- **A database you own.** A dedicated `promotion_signups` table in your Supabase database (with separate test and live copies) stores each subscriber's email, optional name and phone, which page they signed up on, consent, status, and dates.
- **Smart, clean handling.** Duplicate emails are prevented (case‑insensitive), returning subscribers are recognized, and anyone who previously unsubscribed is asked to confirm before being re‑added — so the list stays honest.
- **Secure by design.** Every database write happens on the server; the visitor's browser never touches the database or its keys.
- **An on/off switch.** A simple setting shows or hides the home‑page signup whenever you want, with no code change.

> Status: collection and storage are production‑ready. What's intentionally **not** built yet — sending a welcome email, a one‑click unsubscribe page, and an owner view of the list — is the subject of the next phases.

## Recommended Next Phases (Add‑Ons)

### Phase 2 — Welcome Email & Opt‑In Confirmation
- Automatic, branded welcome email the moment someone subscribes.
- "Confirm your email" step (double opt‑in) so the list is clean and deliverable.
- **Outcome:** a professional first impression and a list that lands in inboxes, not spam folders.
- **Dependency:** a sending domain (e.g. spotlessautowash.com) must be verified first — this is already on the go‑live list.
- **Investment:** [PRICE_P2]

### Phase 3 — Unsubscribe & Compliance
- A one‑click unsubscribe page plus an unsubscribe link in every email, wired to the fields the database already has.
- **Outcome:** keeps you compliant (CAN‑SPAM) and protects your sender reputation so future emails keep arriving.
- **Investment:** [PRICE_P3]

### Phase 4 — Owner Dashboard & Export
- A simple, private screen to view, search, and export subscribers (CSV), with counts by signup source.
- **Outcome:** you can actually see and use the list — or hand it to a campaign tool — without a developer.
- **Investment:** [PRICE_P4]

### Phase 5 — Link Signups to Customers
- Connect email signups to your Stripe/token customers and unify them with the "keep me posted" opt‑in at checkout.
- **Outcome:** one view of each customer; the ability to tell buyers apart from leads for targeted messages.
- **Investment:** [PRICE_P5]

### Phase 6 — Campaign Tool Integration (Optional)
- Sync subscribers into a dedicated email‑marketing tool (Mailchimp, Brevo, or similar) for drag‑and‑drop campaigns and automations — or keep sends in‑house through the existing service if you prefer.
- **Outcome:** full campaign tooling when you're ready to send regularly.
- **Investment:** [PRICE_P6]

## Investment Summary

| Phase | Deliverable | Status | Investment |
|---|---|---|---|
| 1 | Email capture + subscriber database | **Delivered** | [PRICE_P1] |
| 2 | Welcome email + opt‑in confirmation | Proposed | [PRICE_P2] |
| 3 | Unsubscribe + compliance | Proposed | [PRICE_P3] |
| 4 | Owner dashboard + export | Proposed | [PRICE_P4] |
| 5 | Link signups to customers | Proposed | [PRICE_P5] |
| 6 | Campaign tool integration (optional) | Optional | [PRICE_P6] |
| | **Phases 2–6 total** | | **[TOTAL_RANGE]** |

Phases can be approved individually or as a bundle. Recommended priority: **2 → 3 → 4** (make the list send, stay legal, and be usable), then 5–6 as the program grows.

## Timeline

- **Phase 1** — complete.
- **Phases 2–4** — approximately [WEEKS_234], delivered in sequence so each piece ships as it's ready.
- **Phases 5–6** — scheduled after the core list is live, approximately [WEEKS_56].

## Assumptions & Dependencies

- A sending domain must be verified with the email provider before any subscriber emails go out (Phase 2).
- The site's privacy policy must reference the unsubscribe option before sends begin (covered in Phase 3).
- Hosting and database are already in place (Vercel + Supabase); no new infrastructure cost is introduced by this work.

## Next Steps

1. Choose the phase(s) to approve — recommended start: Phases 2–4.
2. Confirm the sending domain to verify (e.g. spotlessautowash.com).
3. On approval, we schedule delivery and begin Phase 2.

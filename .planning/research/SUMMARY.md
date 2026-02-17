# Project Research Summary

**Project:** Gig-Engine — Multi-Tenant Freelancer Service Directory SaaS
**Domain:** Multi-tenant freelancer service catalog / marketplace SaaS
**Researched:** 2026-02-17
**Confidence:** HIGH (architecture + pitfalls), MEDIUM-HIGH (features + stack additions)

## Executive Summary

Gig-Engine is evolving from a single-user static service catalog (markdown files + Playwright scripts) into a multi-tenant SaaS where any freelancer can create a branded service catalog, import their gigs from Fiverr/Upwork, accept Stripe payments, and embed their catalog on external sites. The technical foundation — Next.js 14, Supabase (installed but inactive), Playwright stealth scraping, Satori image generation — is already in place and well-chosen. The milestone is activation, migration, and multi-tenant wiring, not a greenfield build. The biggest leverage point is that 80% of the scaffolding exists; the work is connecting it correctly.

The recommended approach follows a strict dependency chain: database migration first (adding `user_id` to every table + replacing permissive RLS policies), then auth activation, then public catalog routing, then Stripe Checkout, then analytics, then the gig import pipeline, and finally the embeddable widget. Skipping steps or building out of order causes rework. The gig import feature — paste a Fiverr/Upwork URL and get a pre-filled service listing — is the core differentiator; no competitor offers this. The embeddable widget (iframe embed code for external sites) is a secondary differentiator that should be deferred until the public catalog is stable.

The top risks cluster in two areas: security (RLS misconfiguration on the existing schema is the highest-probability failure mode, with documented real-world consequences) and scraping legal/technical risk (Fiverr/Upwork actively block automated access; auth sessions expire silently; ToS violation risk is real). Both are manageable with deliberate mitigation but require explicit attention in the relevant phases, not as afterthoughts. Stripe Connect Express (enabling freelancer payouts) should be deferred to post-v1 — plain Stripe Checkout into the platform account is sufficient for initial multi-tenant operation and eliminates $2/account/month overhead until the business model is proven.

## Key Findings

### Recommended Stack

The existing stack needs activation, not replacement. Supabase packages are already installed (`@supabase/supabase-js@2.95.3`, `@supabase/ssr@0.8.0`) but have no env vars configured and no active connections. The multi-tenancy pattern is RLS + `user_id` column on every table — not schema-per-tenant, which is over-engineered for this scale and incompatible with Supabase's free tier management.

**Core technologies to add:**
- `stripe@20.3.1` (server SDK): Payment processing via Checkout Sessions with `client_reference_id` — required to associate payments with Supabase user IDs
- `posthog-js@1.350.0` + `posthog-node@5.24.16`: Event tracking and per-tenant analytics funnel — PostHog Cloud free tier (1M events/month); self-hosted is incompatible with Vercel-only deployment
- `resend@6.9.2` + `@react-email/components@1.0.7`: Transactional email (inquiry routing, order confirmations) — React-native, 3K free emails/month
- `vite@7.3.1` (dev-only): Widget JS bundle — Next.js cannot produce embeddable bundles; Vite builds a self-contained IIFE for the widget
- `patchright@1.57.0` (conditional): Upgrade path for Playwright if Fiverr/Upwork add Cloudflare Turnstile detection

**Architecture-level decisions:**
- Multi-tenancy: `user_id UUID` column + RLS on every table (never schema-per-tenant)
- Routing: path-based (`/[slug]`) now, subdomain routing deferred (requires Vercel wildcard DNS)
- Stripe: plain Checkout now, Connect Express deferred until second freelancer needs payouts
- Widget delivery: `<script>` tag + iframe (not Shadow DOM Web Component) — simpler, no React hydration complexity in third-party environments
- Analytics: Postgres `analytics_events` table + PostHog Cloud in parallel — Postgres handles aggregation at this scale, PostHog provides funnel analysis

### Expected Features

The competitor landscape (Contra, Fiverr, Legiit, Malt, Whop, Linktree) establishes clear expectations. The core gap Gig-Engine fills: no competitor combines (1) import from existing platform URLs + (2) self-hosted branded catalog + (3) embeddable widget + (4) direct Stripe payments.

**Must have (table stakes) — v1:**
- Public catalog URL (`/{slug}`) — without this there is no distribution mechanism
- Service listing with title, description, pricing — the atomic unit; both fixed-price and inquiry (no price) required
- Gig/service thumbnail image — already built via Satori; carry forward
- Stripe Checkout for fixed-price services — "Buy Now" flow; clients expect direct payment without back-and-forth
- Inquiry/contact form for custom services — routes to freelancer email via Resend; no CRM needed
- Mobile-responsive catalog — 60%+ web traffic is mobile; non-responsive signals unprofessional
- Basic analytics (views, clicks, revenue) — "Is anyone seeing this?" is question #1 post-launch
- User auth + tenant record — Supabase Auth email/password; no OAuth required for v1
- Profile identity section — name, avatar, tagline, bio; clients evaluate the person before the services

**Should have (competitive differentiators):**
- Gig import from URL — core "instant setup" value prop; paste Fiverr/Upwork URL, get pre-filled listing; no competitor offers this
- Custom catalog slug — shareability and brand; `/{alexhale}` vs a UUID
- Service pillar grouping — already in existing UI; makes the freelancer look strategic vs a flat list
- Revenue analytics (orders + revenue from Stripe webhooks) — beyond traffic; what did I actually earn?
- Per-service analytics funnel (views → clicks → purchases) — optimization data no portfolio tool offers

**Defer to v1.x (post-validation):**
- Embeddable widget (iframe embed code) — high value but depends on stable public catalog; build second
- Pricing tier display (3-package Basic/Standard/Premium UI) — Fiverr mental model; low complexity but not blocking
- Per-service analytics funnel — requires event schema in place from v1 analytics first

**Defer to v2+:**
- Reviews/testimonials, client CRM, platform auto-sync, custom domain per tenant, team/agency mode, subdomain routing, mobile native app

### Architecture Approach

The target architecture is a Next.js 14 App Router application with three distinct surface areas: auth-gated dashboard routes (`/dashboard/*`), public catalog routes (`/[slug]/*`), and API routes (`/api/stripe/*`, `/api/import`, `/api/analytics`, `/api/widget`). Supabase provides auth + database with RLS enforcing tenant isolation. The existing `scripts/` automation layer (launchd, Playwright, Telegram) remains fully independent and untouched — Playwright cannot run in Vercel serverless (Chromium binary is 280MB vs 50MB function limit).

**Major components:**
1. **Database migration layer** — adds `user_id UUID` to all 14 existing tables, replaces permissive RLS with ownership-scoped policies, adds indexes, creates `user_profiles` table with slug + Stripe account ID, creates `analytics_events` and `import_jobs` tables
2. **Auth + session middleware** — Supabase SSR cookie-based sessions; middleware refreshes on every request; Custom Access Token Hook injects tenant context into JWT
3. **Public catalog routes `/[slug]`** — Server Component reads `user_profiles` by slug, fetches public gig listings via anon key + RLS, renders service cards grouped by pillar; no auth required for catalog visitors
4. **Dashboard routes `/dashboard/*`** — auth-gated; reactivates existing components (Supabase hooks, dashboard UI, analytics charts) with real queries and real user_id scoping
5. **Stripe API routes** — `/api/stripe/checkout` (session creation server-side), `/api/stripe/webhooks` (raw body, idempotent, writes to `revenue_entries`); Connect Express deferred
6. **Import pipeline** — `/api/import` writes `import_jobs` record and returns; `scripts/import-worker.mjs` (new, follows existing launchd pattern) polls for pending jobs, runs Playwright scrape, writes to `gig_listings`
7. **Analytics pipeline** — `/api/analytics` write-only endpoint (no auth, rate-limited by IP); `analytics_events` table; dashboard aggregates via SQL; PostHog for funnel analysis
8. **Widget** — `/api/widget?slug=X` stripped catalog page with permissive CSP; `public/widget.js` static JS creates iframe pointing to that route

### Critical Pitfalls

All 10 documented pitfalls are significant, but these require immediate attention before writing any multi-tenant code:

1. **Retrofitting user_id without auditing every RLS policy** — the existing schema has 14 tables with permissive `USING (true)` policies; missing even one junction table creates full cross-tenant data exposure. Prevention: explicit migration checklist, Supabase Security Advisor lint, cross-tenant isolation test (two tenants, verify zero data bleed). This pitfall has documented real-world consequences (170+ apps exposed in 2025).

2. **Supabase service_role key in client-accessible code** — `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` would ship the root database credential to the browser. Prevention: service_role key only in Route Handlers and Edge Functions; CI lint rule; anon key for all browser-side calls. This is the CVE-2025-48757 pattern.

3. **Stripe webhook raw body parsing** — `req.json()` before `stripe.webhooks.constructEvent()` destroys the HMAC signature. Prevention: always `req.text()` first, pass raw string to constructEvent, no middleware reads body before handler. This is the single most common Stripe/Next.js integration failure.

4. **Missing webhook idempotency** — Stripe retries on failures; without a `stripe_events` deduplication table, duplicate payments and double-emails occur. Prevention: check `event.id` against `stripe_events` before processing; insert only on success.

5. **Scraper auth state expiry + ToS risk** — platform sessions expire every 7-30 days; silent failures produce empty imports with no error. ToS risk: importing your own data is most defensible legally but rate limiting and user consent UI are required. Prevention: detect login-wall DOM signatures, surface re-auth prompt, rate limit to 1 req/3-5 seconds with randomized delays.

## Implications for Roadmap

Based on the dependency chain documented in ARCHITECTURE.md and the pitfall-to-phase mapping from PITFALLS.md:

### Phase 1: Multi-Tenant Foundation
**Rationale:** Everything else is blocked without this. The existing schema has no user_id column and permissive RLS — this is a security vulnerability and a functional gap that blocks all downstream work. Auth must be activated before any user-facing features can exist.
**Delivers:** Working Supabase auth (email/password), multi-tenant database migration, user_profiles table with catalog slug, RLS ownership policies with indexes, cross-tenant isolation verified by test.
**Features addressed:** User auth, tenant record + slug (P1 from FEATURES.md)
**Pitfalls avoided:** RLS misconfiguration (P1), service_role key exposure (P2), user_metadata JWT claims for tenant scoping (P3)
**Research flag:** Standard patterns — Supabase Auth + RLS is well-documented and official docs are authoritative. Skip research-phase.

### Phase 2: Core Product — Dashboard + Public Catalog
**Rationale:** Once auth and data isolation exist, the two primary surfaces can be built: the auth-gated dashboard (freelancer workspace) and the public catalog (the shareable artifact). These unblock payments, analytics, and the widget.
**Delivers:** `/dashboard/*` routes (reactivated existing components with real Supabase queries), `/[slug]` public catalog page (profile header, service cards grouped by pillar, mobile-responsive), manual service CRUD (title, description, price, pillar, thumbnail).
**Features addressed:** Public catalog URL, service listing display, profile identity section, mobile-responsive design, manual service CRUD (all P1)
**Pitfalls avoided:** Public catalog route must NOT require auth (anti-pattern 5 from ARCHITECTURE.md) — visitors must reach catalog without logging in
**Research flag:** Standard patterns — Next.js App Router route groups and Supabase Server Components are well-documented. Skip research-phase.

### Phase 3: Stripe Payments
**Rationale:** The catalog exists; now it needs to convert visitors into paying clients. Fixed-price services need "Buy Now" (Stripe Checkout); custom services need an inquiry form. Revenue data unlocks the analytics story in Phase 4.
**Delivers:** Stripe Checkout Sessions for fixed-price services, inquiry/contact form routing to freelancer email via Resend, Stripe webhook handler (idempotent, raw body), `revenue_entries` recording, basic order confirmation email.
**Features addressed:** Stripe Checkout (P1), inquiry form (P1)
**Stack additions:** `stripe@20.3.1`, `resend@6.9.2`, `@react-email/components`
**Pitfalls avoided:** Webhook raw body parsing (P4), webhook idempotency (P5), Vercel function timeout on webhooks (P6) — Fluid Compute enabled for webhook route
**Research flag:** Needs careful implementation — Stripe webhook integration has multiple failure modes. Standard patterns exist but the idempotency table and raw body handling require explicit attention. Consider `/gsd:research-phase` for Stripe Connect Express when that phase arrives; skip for plain Checkout.

### Phase 4: Analytics Dashboard
**Rationale:** Analytics answers "Is this catalog working?" — the first question every freelancer asks. The event pipeline must be built before the dashboard UI has data to show. Phase 3's Stripe webhook already captures revenue events; Phase 4 adds view/click tracking and surfaces it all.
**Delivers:** `analytics_events` table, `/api/analytics` write-only ingest endpoint, page view + service click tracking on public catalog, analytics dashboard UI (`/dashboard/analytics` — reactivates existing components), PostHog integration for funnel analysis.
**Features addressed:** Basic analytics — views, clicks, revenue (P1); per-service funnel (P2, if event schema permits)
**Stack additions:** `posthog-js@1.350.0`, `posthog-node@5.24.16`
**Pitfalls avoided:** Analytics cross-tenant exposure (P10) — SECURITY DEFINER RPCs must have explicit tenant_id filters; dual-tenant isolation test required before launch
**Research flag:** Standard patterns for Postgres analytics + PostHog. Skip research-phase.

### Phase 5: Gig Import Pipeline
**Rationale:** The core differentiator. Paste a Fiverr or Upwork URL; get a pre-filled service listing. This dramatically lowers onboarding friction for non-Alex tenants. Deferred until Phase 5 because manual CRUD (Phase 2) is the functional fallback — import is additive, not blocking.
**Delivers:** `import_jobs` table, `/api/import` endpoint (job creation only), `scripts/import-worker.mjs` (Playwright scrape worker following existing launchd pattern), auth state management (detect session expiry, surface re-auth prompt), import status polling UI in dashboard.
**Features addressed:** Gig import from URL (P1)
**Pitfalls avoided:** Playwright cannot run in Vercel serverless (anti-pattern 2 from ARCHITECTURE.md) — import worker is a standalone Node.js script; scraper auth expiry silent failure (P7); ToS risk mitigation — rate limiting, user consent UI, personal-data-export framing (P8)
**Research flag:** This phase has the highest implementation risk. ToS and auth state complexity are not fully resolved. Recommend `/gsd:research-phase` during planning to assess: Upwork API availability, Fiverr affiliate data as an alternative, and encrypted session storage patterns in Supabase.

### Phase 6: Embeddable Widget
**Rationale:** Enables distribution to freelancers who already have a personal site (Webflow, Squarespace, custom). No competitor offers this. Deferred until the public catalog is stable — the widget is a distribution wrapper around it, not independent functionality.
**Delivers:** `public/widget.js` (Vite-built static JS, creates iframe), `/api/widget?slug=X` route (stripped catalog layout, permissive CSP), embed code generator UI in dashboard settings, postMessage communication for checkout navigation.
**Features addressed:** Embeddable widget (P2)
**Stack additions:** `vite@7.3.1` (dev-only), `@vitejs/plugin-react@5.1.4` (dev-only)
**Pitfalls avoided:** CSP `frame-ancestors` blocking embed (P9) — widget route gets `frame-ancestors *`; all other routes keep `frame-ancestors 'none'`; postMessage origin validation required
**Research flag:** MEDIUM complexity — iframe embed is well-understood but the route-specific CSP override and Vite sub-build pipeline are moderately novel. Standard patterns exist. Skip research-phase but flag the CSP configuration as first implementation task.

### Phase 7: Stripe Connect Express (Deferred)
**Rationale:** Required only when multiple freelancers need independent payouts to their own bank accounts. For v1 with Alex as the primary (or only) tenant, plain Stripe Checkout to the platform account is sufficient. Connect adds $2/active account/month overhead and significant onboarding UX complexity with zero benefit until multi-payout is needed.
**Delivers:** Stripe Connect Express onboarding flow, destination charges for freelancer payouts, `stripe_account_id` field on user_profiles.
**Features addressed:** Multi-tenant payments (v2 milestone)
**Research flag:** When this phase arrives, run `/gsd:research-phase` to verify current Stripe Connect Express pricing, onboarding flow changes, and Express vs Standard account trade-offs for the current scale.

### Phase Ordering Rationale

- **Foundation first:** The dependency chain is strict. Database migration + auth must precede every other phase. The existing schema's permissive RLS is not just incomplete — it is a security vulnerability in a multi-tenant context. This cannot be deferred.
- **Public surface before monetization:** The catalog must exist and be sharable before Stripe Checkout has anything to sell. Merchants need to see their catalog working before they're motivated to complete Stripe onboarding.
- **Revenue before analytics:** Stripe webhooks generate order data; analytics must know what to aggregate before the dashboard has meaningful content. Installing PostHog in Phase 4 (after Stripe is live) means funnel data includes actual conversion events.
- **Import deferred deliberately:** Manual CRUD (Phase 2) is the fallback for all tenants. Import is a conversion-rate booster at onboarding, not a hard dependency. The ToS and auth complexity of import deserves its own focused phase rather than mixing it into the foundation.
- **Widget last:** The widget is a wrapper around the catalog, not independent functionality. It cannot provide value until the catalog it wraps is stable and tested.
- **Connect Express deferred:** No functional need until a second freelancer requires independent payouts. Deferring eliminates $2/account/month cost and months of implementation complexity while the core product is being validated.

### Research Flags

Phases needing deeper research during planning:
- **Phase 5 (Gig Import):** Highest risk phase. ToS exposure, multi-tenant auth state management, and encrypted credential storage are not fully resolved. Run `/gsd:research-phase` before planning this phase. Key questions: Is Upwork's API a viable alternative to scraping? Can Fiverr affiliate data provide gig metadata without scraping? What is the correct Supabase Vault pattern for encrypted session token storage?
- **Phase 7 (Stripe Connect Express):** Pricing and onboarding flow may have changed by the time this is needed. Always run `/gsd:research-phase` at planning time for this phase.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1 (Foundation):** Supabase Auth + RLS migration patterns are extensively documented in official Supabase docs and verified by architecture research.
- **Phase 2 (Core Product):** Next.js App Router route groups and Server Components are official, stable patterns.
- **Phase 3 (Stripe Payments):** Plain Stripe Checkout with webhook handler is a standard integration. The implementation gotchas are documented in PITFALLS.md — address them explicitly rather than researching again.
- **Phase 4 (Analytics):** Postgres analytics + PostHog Cloud are well-understood. Implementation is straightforward with existing schema patterns.
- **Phase 6 (Widget):** iframe embed with route-specific CSP is a known pattern. Vite sub-build setup requires attention but has available documentation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core additions (Stripe, PostHog, Resend) verified via npm registry on 2026-02-17. Supabase patterns verified against official docs. Widget Vite approach is MEDIUM — well-reasoned but less validated. |
| Features | MEDIUM-HIGH | Competitor feature analysis via WebSearch across 10+ sources. Fiverr/Upwork feature structure from official help docs (HIGH). Contra/Legiit/Malt from secondary sources (MEDIUM). MVP definition reflects solid analysis. |
| Architecture | HIGH | Existing codebase fully audited. Key decisions (RLS pattern, Playwright decoupling, iframe widget, Connect Express deferral) verified against official Vercel, Stripe, and Supabase docs. |
| Pitfalls | HIGH | Multi-source verification. Critical pitfalls (RLS, service_role exposure, webhook raw body, idempotency) cross-referenced against official docs, community post-mortems, and CVE documentation. |

**Overall confidence:** HIGH

### Gaps to Address

- **Upwork API availability:** It exists but has restrictions. During Phase 5 planning, assess whether Upwork's official API (or Fiverr affiliate data) can serve as a safer alternative to authenticated scraping for some or all import use cases. This could significantly reduce ToS and account-ban risk.
- **Supabase Vault for credential storage:** The architecture recommends storing encrypted platform session tokens per tenant in Supabase, but the specific Vault configuration pattern was not fully researched. Flag for Phase 5 planning.
- **Stripe Connect Express current pricing:** The $2/active account/month figure is verified from multiple secondary sources but not from official Stripe pricing pages (which don't publish this explicitly). Verify at planning time for Phase 7.
- **Supabase free tier pause behavior with multi-tenant writes:** The existing `com.prettyfly.gig-monitor` launchd satisfies the 7-day activity requirement for single-user. Confirm this behavior persists when multiple tenants are writing data — it should, but verify.
- **Widget height responsiveness:** The iframe embed approach has a known UX issue: iframe height does not auto-expand to match content. The research noted `resize-observer` or `postMessage` height communication as mitigations but did not fully detail the implementation. Address during Phase 6 planning.

## Sources

### Primary (HIGH confidence)
- Supabase RLS official docs — row-level security patterns, multi-tenant isolation
- Supabase Auth docs — Custom Access Token Hook, app_metadata vs user_metadata
- Stripe Connect docs — Express account type, destination charges
- Stripe Webhooks docs — raw body parsing, retry behavior, idempotency
- Vercel Functions limits docs — 50MB function size, 10s/60s timeout, Fluid Compute
- Next.js official docs — App Router, route groups, middleware, multi-tenant guide
- Fiverr Help Center — gig anatomy, 3-package model, custom offers
- npm registry — all package versions verified 2026-02-17
- Existing codebase audit (`/Users/alexhale/Projects/Gig-Engine/`) — migrations, components, scripts

### Secondary (MEDIUM confidence)
- PostHog Cloud pricing — 1M events/month free tier, self-hosted requirements
- Stripe Connect Express pricing — $2/active account/month (multiple secondary sources)
- Playwright stealth + patchright anti-detection patterns
- makerkit.dev — Supabase RLS best practices, embeddable widget patterns
- Vercel community — Playwright on Vercel limitations
- iframe vs Web Components 2025 benchmark — 4.5x Web Component speed advantage noted but iframe chosen for implementation simplicity
- CVE-2025-48757 / Supabase service_role exposure post-mortem

### Tertiary (LOW confidence)
- Jobbers.io — freelance platform comparison (single source, low authority)
- Chandler Nguyen multi-tenancy post-mortem — useful anecdote but single source
- Upwork API availability and restrictions — not directly verified; needs validation in Phase 5 planning

---
*Research completed: 2026-02-17*
*Ready for roadmap: yes*

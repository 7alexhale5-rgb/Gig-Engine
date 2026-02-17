# Feature Research

**Domain:** Freelancer service directory / multi-tenant marketplace SaaS
**Researched:** 2026-02-17
**Confidence:** MEDIUM-HIGH (competitor analysis via WebSearch verified against multiple sources; no official API docs consulted for feature lists)

---

## Context

This research covers the milestone of adding multi-tenant SaaS capabilities to Gig-Engine's existing single-tenant service catalog. The existing codebase already has: static catalog UI, markdown listings, Playwright scraping, Satori image generation, and Vercel deployment.

Active requirements being phased in: URL-based gig import, public per-tenant catalog page, embeddable widget, Stripe payments (fixed + inquiry), analytics dashboard, and multi-tenant auth.

Competitor reference set: Contra (portfolio + payments), Fiverr/Upwork (gig structure), Legiit (marketplace), Malt (European freelancer marketplace), Whop (digital storefront), Crevado/Carbonmade (portfolio-only), Linktree (bio-link analog).

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features freelancers assume exist. Missing these = product feels broken or unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Public catalog URL | Every freelancer tool gives you a shareable link (Contra, Linktree, Upwork, all of them). Without this the product has no distribution mechanism. | LOW | Format: `/{slug}` or subdomain. Slug-based routing is fastest to ship; subdomain is a v1.x upgrade. |
| Service listing with title, description, pricing | The atomic unit of any service catalog. Fiverr gig structure is the mental model users carry: title, description, packages, delivery, images. Missing any of these breaks trust. | LOW | Must support both fixed-price tiers and "contact me" (no price) listings. |
| Gig/service thumbnail image | Fiverr normalizes 1280x769 thumbnails on every gig. Users expect visual representation. Platform already generates these with Satori. | LOW | Already built. Reuse existing generation pipeline. |
| Stripe payment for fixed-price services | Freelancers who offer productized services (fixed-scope, fixed-price) need a "Buy Now" flow. Clients expect to pay directly without a back-and-forth. Contra, Whop, and others all offer this. | MEDIUM | Stripe Checkout (redirect model) is the standard. Payment Links are simpler but less customizable. Use Checkout for branding control. |
| Inquiry/contact form for custom services | Custom scope work (hourly, project-based) can't have a fixed price. An inquiry form is the industry-standard fallback. Every platform offers this. | LOW | Collect: name, email, budget, timeline, message. Route to freelancer email or webhook. No CRM needed in v1. |
| Mobile-responsive catalog page | Over 60% of web traffic is mobile. Clients browse on phone. A non-responsive catalog signals "unprofessional." | LOW | Tailwind already installed; responsive-first design is standard. |
| Basic page analytics (views, clicks) | Contra Pro, Legiit, and every portfolio platform surface traffic data. Freelancers need to know if their catalog is working. "Is anyone seeing this?" is question #1 after launch. | MEDIUM | At minimum: total views, unique visitors, service click-through. Per-service breakdowns are a differentiator, not table stakes. |
| User account / auth | Multi-tenant requires per-user identity. Without auth, there's no isolation, no settings, no ownership. | MEDIUM | Supabase Auth (already installed). Email/password + magic link. No OAuth required for v1. |
| Profile identity section | Every freelancer platform shows: name, avatar, tagline, short bio. Clients evaluate "who is this person" before they look at services. Crevado, Carbonmade, Contra all do this. | LOW | Fields: display name, avatar URL, tagline (1 line), bio (2-3 sentences), optional location. |

### Differentiators (Competitive Advantage)

Features that set Gig-Engine apart. Not universally expected, but high perceived value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Gig import from URL | The core "instant setup" value prop. No competitor offers auto-import from Fiverr/Upwork URLs — freelancers manually recreate listings on every tool. If this works reliably it's a genuine differentiator. | HIGH | Playwright stealth scraping already built for monitor. Import flow: paste URL → scrape title/description/price/images → review & confirm → save. Anti-bot risk: Fiverr/Upwork actively block scrapers. Rate limiting, session rotation, and human-review step required. |
| Embeddable widget | Lets freelancers add their catalog to an existing portfolio site (Webflow, Squarespace, personal site). No major portfolio tool offers this. Contra has no embed. Linktree has no service catalog. This fills the gap for freelancers who already have a website. | HIGH | iFrame embed is simplest (one script tag + src URL). JS SDK widget is better DX but much higher complexity. Ship iFrame v1, design for SDK migration. Key concern: CORS headers, X-Frame-Options, CSP. |
| Service pillar grouping | Gig-Engine already groups by pillar (AI Workflows, Automation, Content, etc.). Most platforms show a flat service list. Grouped catalogs make the freelancer look more strategic. | LOW | Already in existing catalog UI. Carry forward to multi-tenant. |
| Revenue analytics (orders + revenue) | Beyond traffic — freelancers want to see "how much did I make from this catalog?" Stripe webhook integration feeds actual order data. Contra Pro shows this; free tools don't. | MEDIUM | Requires Stripe webhook handler storing order records. Per-service revenue breakdown is the key metric. |
| Per-service analytics (views → clicks → buys) | Knowing which services convert best lets freelancers optimize their offering. No portfolio-only tool offers this. Marketplace platforms (Fiverr, Upwork) show seller stats but not at this granularity per listing. | MEDIUM | Event tracking: page view, service card click, checkout initiated, order complete. Store as events table in Supabase. Simple funnel visualization in dashboard. |
| Custom catalog slug | `gig-engine.app/alexhale` vs a UUID. Freelancers care about shareability and brand. Every link-in-bio tool offers custom slugs. | LOW | Slug: alphanumeric + hyphens, 3-30 chars, unique across tenants. Validation at signup. |
| Pricing tier display (Basic / Standard / Premium) | Fiverr's 3-package model is the industry mental model. Showing 3 tiers (even if only one is purchasable) signals professionalism and anchors price perception. | LOW | UI pattern only. Backend: store up to 3 price points per service. Only the selected tier goes to Stripe Checkout. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create disproportionate complexity or scope creep relative to the v1 value proposition.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time platform sync | "Automatically keep my Gig-Engine catalog updated when I update Fiverr" | Fiverr/Upwork have no public API. Scraping at sync frequency triggers bot detection and account bans. Brittle selectors break silently. Maintenance cost is ongoing and unpredictable. | Provide "Re-import from URL" button. Manual sync on demand. Alert users when scrape fails. |
| Reviews and ratings system | "I want my happy clients to leave reviews" | Requires moderation, fraud prevention, and real usage volume to be credible. An empty reviews section looks worse than no reviews section. Adds auth complexity for reviewers. | Surface existing platform reviews (Fiverr/Upwork) as imported testimonials. Manual testimonial entry is v2. |
| Real-time chat / messaging inbox | "Clients want to message me directly" | WebSocket infrastructure, notification systems, mobile push, spam handling. This is a product unto itself. Slack/WhatsApp/email do this better. | Inquiry form routes to freelancer's email. Include a "WhatsApp" or "Calendly" link field in profile. |
| Client CRM / order history per client | "Track which client bought what" | Full CRM is a different product category. At v1 scale (single freelancer / small cohort) Stripe's own dashboard is sufficient. | Stripe dashboard handles order history. Webhook stores order events for analytics aggregation only. |
| Multi-currency support | "My clients are in Europe" | Exchange rate sync, localization, Stripe currency configuration complexity. Adds testing surface. | USD only in v1. Stripe handles display conversion on their hosted Checkout page automatically for international cards. |
| Platform auto-import on signup | "Import all my gigs automatically when I sign up" | Requires stored credentials or OAuth with Fiverr/Upwork (neither offer OAuth). Bulk scraping at onboarding triggers detection. | URL-by-URL import on demand. Show tutorial video for first-time importers. Batch import is v2. |
| Mobile native app | "I want an app" | React Native or Flutter adds a second release track, app store approval cycles, and push notification infrastructure. Web-first covers 90% of use cases. | Responsive PWA. Add `manifest.json` for "Add to Home Screen" on mobile. No native app in v1. |

---

## Feature Dependencies

```
[User Auth / Account]
    └──required-by──> [Multi-Tenant Data Isolation]
                          └──required-by──> [Public Catalog Page per User]
                                                └──required-by──> [Embeddable Widget]
                          └──required-by──> [Analytics Dashboard]
                          └──required-by──> [Stripe Checkout per Tenant]

[Gig Import from URL]
    └──populates──> [Service Listing]
                        └──required-by──> [Public Catalog Page per User]
                        └──required-by──> [Stripe Checkout per Tenant]
                        └──required-by──> [Per-Service Analytics]

[Stripe Checkout]
    └──feeds──> [Stripe Webhook Handler]
                    └──feeds──> [Revenue Analytics]
                    └──feeds──> [Order Records in Supabase]

[Page View Tracking]
    └──feeds──> [Analytics Dashboard]
[Service Click Tracking]
    └──feeds──> [Analytics Dashboard]
[Stripe Webhook Order Events]
    └──feeds──> [Analytics Dashboard]
```

### Dependency Notes

- **Auth required before everything else:** Multi-tenant isolation is impossible without identity. Auth is the Phase 1 foundation; nothing else ships without it.
- **Service listings required before payments:** Stripe Checkout needs a product/price to charge for. Service data must exist (title, price, currency) before any checkout flow can be wired.
- **Embeddable widget requires public catalog to exist:** The widget is a windowed view of the catalog page. Build the catalog page first; the widget is a distribution wrapper around it.
- **Analytics requires event tracking hooks:** Analytics dashboard is a read surface. Event writes (page views, clicks, orders) must be instrumented throughout the app before the dashboard has data to show. Don't build the dashboard UI before the event pipeline.
- **Gig import enhances but doesn't block:** Manual service creation (title, description, price fields) can substitute for import. Import is a conversion-rate booster at onboarding, not a hard dependency for v1 functionality.

---

## MVP Definition

### Launch With (v1)

Minimum viable multi-tenant SaaS — what's needed to give any freelancer a working catalog.

- [ ] **User auth** — Email/password via Supabase Auth. No OAuth. Just enough to create an account and log in.
- [ ] **Tenant record + slug** — On signup: create `tenants` table row, assign slug (from username or input), enforce uniqueness.
- [ ] **Manual service CRUD** — Create/edit/delete services without import. Title, description, price (fixed or null), category/pillar, thumbnail. Import is additive; CRUD is the safety net.
- [ ] **Gig import from URL** — Paste Fiverr or Upwork URL, scrape listing, review pre-filled form, save. One URL at a time. Anti-bot handled by Playwright stealth (already available).
- [ ] **Public catalog page** — `/{slug}` renders tenant's services grouped by pillar, profile header, mobile-responsive. Unauthenticated access (no login required to view).
- [ ] **Stripe Checkout for fixed-price services** — "Buy Now" on fixed-price services opens Stripe Checkout. On success, record order in Supabase via webhook.
- [ ] **Inquiry form for custom services** — Services without a price show "Get a Quote" button. Form collects name, email, message. Emails freelancer (transactional email via Resend or SMTP).
- [ ] **Basic analytics** — Page views per catalog (daily/total), service click-throughs, order count and revenue. Simple table/chart in dashboard. Powered by Supabase event writes.

### Add After Validation (v1.x)

Features to add once the core loop is proven with real users.

- [ ] **Embeddable widget** — iFrame embed code generator. One-line snippet that renders the catalog inside an external site. Add only after the public page is stable (widget depends on it).
- [ ] **Custom catalog slug editing** — Allow users to change their slug post-signup with redirect handling. Defer until slug conflicts become a user complaint.
- [ ] **Pricing tier display (3-package UI)** — Upgrade single-price listing to show Basic/Standard/Premium cards. Low complexity, high perceived value. Add when v1 catalog feedback comes in.
- [ ] **Per-service analytics funnel** — Views → clicks → purchases per individual service. Requires event schema already in place from v1 analytics.

### Future Consideration (v2+)

Defer until product-market fit is established with real freelancer users.

- [ ] **Reviews / testimonials** — Import or manually enter client testimonials. Defer: needs real usage to have content.
- [ ] **Client CRM** — Order history per client, notes, follow-ups. Different product scope.
- [ ] **Platform auto-sync** — Periodic re-scrape of imported gigs. Defer: fragile, high maintenance.
- [ ] **Custom domain per tenant** — `services.yourname.com` pointing to the catalog. CNAME + certificate provisioning complexity.
- [ ] **Team / agency mode** — Multiple users under one catalog. Multi-seat auth, role system.
- [ ] **Subdomain routing** — `alexhale.gig-engine.app` vs path-based. Defer: DNS wildcards + Vercel rewrite complexity without clear user demand.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| User auth + multi-tenant | HIGH | MEDIUM | P1 |
| Public catalog page per user | HIGH | LOW | P1 |
| Manual service CRUD | HIGH | LOW | P1 |
| Stripe Checkout (fixed-price) | HIGH | MEDIUM | P1 |
| Inquiry form (custom services) | HIGH | LOW | P1 |
| Basic analytics (views, revenue) | HIGH | MEDIUM | P1 |
| Gig import from URL | HIGH | HIGH | P1 |
| Custom catalog slug | MEDIUM | LOW | P1 |
| Embeddable widget (iFrame) | MEDIUM | HIGH | P2 |
| Pricing tier display (3-package) | MEDIUM | LOW | P2 |
| Per-service analytics funnel | MEDIUM | MEDIUM | P2 |
| Custom domain per tenant | LOW | HIGH | P3 |
| Testimonials / reviews | MEDIUM | HIGH | P3 |
| Platform auto-sync | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch — the core loop can't function without these
- P2: Should have — significant UX/conversion uplift, add after core is stable
- P3: Nice to have — future consideration, defer until PMF proven

---

## Competitor Feature Analysis

| Feature | Contra | Fiverr (reference model) | Legiit | Malt | Our Approach |
|---------|--------|--------------------------|--------|------|--------------|
| Public profile/catalog URL | Yes (`contra.com/u/name`) | Yes (`fiverr.com/username`) | Yes | Yes | Yes — `/{slug}` path-based routing |
| Service listings | Portfolio-style (project-based) | Gig cards (package model) | Service cards (package model) | Profile + service cards | Service cards with pillar grouping |
| Fixed-price buy-now | Yes (Contra Pro) | Yes (Checkout) | Yes | No (project-based) | Yes — Stripe Checkout |
| Inquiry form | Yes | Yes (custom offers) | Yes | Yes | Yes — routes to email |
| Embeddable widget | No | No | No | No | Yes (v1.x) — iFrame embed |
| Gig import from URL | No | N/A (is the platform) | No | No | Yes — core differentiator |
| Analytics dashboard | Yes (Contra Pro, $29/mo) | Yes (seller stats) | Yes | Yes | Yes — included in v1 |
| Custom slug / vanity URL | Yes | Yes | Yes | Yes | Yes |
| Mobile responsive | Yes | Yes | Yes | Yes | Yes |
| Multi-tenant / SaaS model | No (single platform) | Platform only | Yes (marketplace) | Yes (marketplace) | Yes — per-freelancer tenants |
| Pillar / category grouping | No (chronological) | Category filter | Category filter | Skills-based | Yes — 5 service pillars |

**Key gap Gig-Engine fills:** No competitor combines (1) import from existing platform URLs + (2) self-hosted branded catalog + (3) embeddable widget + (4) direct Stripe payments. Contra is closest but has no import and no embed.

---

## Sources

- [Contra — How It Works for Independents](https://contra.com/how-it-works/independents) — feature list (MEDIUM confidence, WebSearch)
- [Contra Review 2025 — Features, Pros, Cons](https://10web.io/ai-tools/contra/) (MEDIUM confidence, WebSearch)
- [Fiverr Help: Creating a Gig](https://help.fiverr.com/hc/en-us/articles/360010451397-Creating-a-Gig) — gig anatomy (HIGH confidence, official docs)
- [Fiverr Help: What Are Packages](https://help.fiverr.com/hc/en-us/articles/360010559138-What-are-packages) — 3-package model (HIGH confidence, official docs)
- [Fiverr Help: Custom Offers](https://help.fiverr.com/hc/en-us/articles/360010559198-Custom-offers) — inquiry flow model (HIGH confidence, official docs)
- [Legiit Marketplace Deep Dive](https://intercoolstudio.com/legiit-a-deep-dive-into-freelance-marketplace/) (MEDIUM confidence, WebSearch)
- [Malt — Malt Open Registration for Freelancers](https://help.malt.com/hc/en-150/articles/29536793928722) (MEDIUM confidence, official docs)
- [Contra vs Fiverr vs Upwork Comparison — ebaqdesign](https://www.ebaqdesign.com/blog/contra-fiverr-upwork) (MEDIUM confidence, WebSearch)
- [Whop — How to Set Up Your Store Page](https://whop.com/blog/whop-store-page/) — storefront patterns (MEDIUM confidence, WebSearch)
- [Stripe Connect — Platform and Marketplace Payments](https://stripe.com/connect) (HIGH confidence, official docs)
- [How to Get Paid as a Freelancer — Stripe](https://stripe.com/resources/more/how-to-accept-payments-as-a-freelancer-and-how-to-choose-the-right-payment-methods) (HIGH confidence, official docs)
- [Upwork Profile Guide 2025 — Getmany](https://getmany.com/blog/the-definitive-upwork-profile-guide-for-freelancers-2025) — profile element expectations (MEDIUM confidence, WebSearch)
- [Crevado Online Portfolio](https://crevado.com/) — portfolio-only reference (MEDIUM confidence, WebSearch)
- [Carbonmade Review](https://www.mybestwebsitebuilder.com/carbonmade-review) — portfolio-only reference (MEDIUM confidence, WebSearch)
- [Linktree — Link in Bio](https://linktr.ee) — bio-link distribution model reference (HIGH confidence, official site)
- [Jobbers — Freelance Platforms That Don't Take a Cut 2026](https://www.jobbers.io/freelance-platforms-that-dont-take-a-cut-in-2026-complete-review-comparison/) (LOW confidence, WebSearch only)

---

*Feature research for: Freelancer service directory / multi-tenant marketplace SaaS (Gig-Engine)*
*Researched: 2026-02-17*

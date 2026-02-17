# Requirements: Gig-Engine

**Defined:** 2026-02-17
**Core Value:** Freelancers can instantly create a professional service catalog from their existing platform listings and start accepting payments.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Tenancy

- [ ] **AUTH-01**: User can sign up with email and password via Supabase Auth
- [ ] **AUTH-02**: User can log in and stay logged in across browser refresh
- [ ] **AUTH-03**: User can log out from any page
- [ ] **AUTH-04**: Tenant record created on signup with unique slug (e.g. /alexhale)
- [ ] **AUTH-05**: Multi-tenant data isolation via Supabase RLS (user_id on all tables)

### Profile

- [ ] **PROF-01**: User can set display name, avatar URL, tagline, and short bio
- [ ] **PROF-02**: Profile identity displays on public catalog page header

### Catalog

- [ ] **CATL-01**: User can create a service listing with title, description, price, category/pillar, and thumbnail
- [ ] **CATL-02**: User can edit their own service listings
- [ ] **CATL-03**: User can delete their own service listings
- [ ] **CATL-04**: Public catalog page at /{slug} displays user's services grouped by pillar
- [ ] **CATL-05**: Public catalog page is mobile-responsive and requires no login to view
- [ ] **CATL-06**: Service listings support pricing tier display (Basic/Standard/Premium packages)
- [ ] **CATL-07**: Service listings display thumbnail images

### Gig Import

- [ ] **IMPT-01**: User can paste a Fiverr gig URL and auto-populate a service listing (title, description, pricing, image)
- [ ] **IMPT-02**: User can paste an Upwork service URL and auto-populate a service listing
- [ ] **IMPT-03**: Imported data is shown in a review form before saving (human-in-the-loop)
- [ ] **IMPT-04**: Import handles scrape failures gracefully with clear error messaging

### Payments

- [ ] **PAY-01**: Fixed-price services show a "Buy Now" button that opens Stripe Checkout
- [ ] **PAY-02**: On successful Stripe payment, order record is stored in Supabase via webhook
- [ ] **PAY-03**: Custom/hourly services show a "Get a Quote" button that opens an inquiry form
- [ ] **PAY-04**: Inquiry form collects name, email, budget, timeline, message and emails the freelancer
- [ ] **PAY-05**: Stripe webhook handler validates signatures and deduplicates events (idempotency)

### Analytics

- [ ] **ANLY-01**: Catalog page views are tracked (daily count and total)
- [ ] **ANLY-02**: Service click-throughs are tracked (which services get clicked)
- [ ] **ANLY-03**: Dashboard displays revenue metrics (total orders, total revenue from Stripe)
- [ ] **ANLY-04**: Dashboard displays per-service conversion funnel (views -> clicks -> purchases)
- [ ] **ANLY-05**: Analytics data is scoped to the authenticated user's tenant only

### Embeddable Widget

- [ ] **WDGT-01**: User can generate an embed code snippet for their catalog
- [ ] **WDGT-02**: Embed renders as iFrame on external sites (Webflow, Squarespace, personal sites)
- [ ] **WDGT-03**: Embedded catalog is mobile-responsive and supports Stripe Checkout flow

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Reviews & Testimonials

- **REVW-01**: User can manually add client testimonials to their catalog
- **REVW-02**: Testimonials display on public catalog page

### Client Management

- **CLNT-01**: Order history per client visible in dashboard
- **CLNT-02**: Client notes and follow-up tracking

### Platform Sync

- **SYNC-01**: Re-import from URL button to refresh an imported listing
- **SYNC-02**: Alert when imported listing may be outdated

### Branding

- **BRND-01**: Custom domain per tenant (services.yourname.com)
- **BRND-02**: Subdomain routing (alexhale.gig-engine.app)
- **BRND-03**: Custom slug editing post-signup with redirect handling

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Magic link / OAuth login | Email/password sufficient for v1; adds complexity without clear user demand |
| Real-time platform auto-sync | Fiverr/Upwork have no API; periodic scraping triggers bot detection and account bans |
| Real-time chat / messaging inbox | WebSocket infrastructure is a product unto itself; inquiry form + email sufficient |
| Client CRM | Different product category; Stripe dashboard handles order history at v1 scale |
| Multi-currency support | USD only; Stripe handles international card display conversion automatically |
| Bulk gig import on signup | Triggers bot detection; URL-by-URL import is safer and more reliable |
| Mobile native app | Responsive web covers 90% of use cases; PWA is the upgrade path |
| Stripe Connect (marketplace payouts) | Only needed when second freelancer requires independent payouts; $2/active/month overhead unjustified until then |
| Team / agency mode | Multi-seat auth and role system; defer until PMF proven |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| AUTH-05 | — | Pending |
| PROF-01 | — | Pending |
| PROF-02 | — | Pending |
| CATL-01 | — | Pending |
| CATL-02 | — | Pending |
| CATL-03 | — | Pending |
| CATL-04 | — | Pending |
| CATL-05 | — | Pending |
| CATL-06 | — | Pending |
| CATL-07 | — | Pending |
| IMPT-01 | — | Pending |
| IMPT-02 | — | Pending |
| IMPT-03 | — | Pending |
| IMPT-04 | — | Pending |
| PAY-01 | — | Pending |
| PAY-02 | — | Pending |
| PAY-03 | — | Pending |
| PAY-04 | — | Pending |
| PAY-05 | — | Pending |
| ANLY-01 | — | Pending |
| ANLY-02 | — | Pending |
| ANLY-03 | — | Pending |
| ANLY-04 | — | Pending |
| ANLY-05 | — | Pending |
| WDGT-01 | — | Pending |
| WDGT-02 | — | Pending |
| WDGT-03 | — | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 0
- Unmapped: 31

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-17 after initial definition*

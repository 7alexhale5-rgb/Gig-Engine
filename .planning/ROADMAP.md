# Roadmap: Gig-Engine

## Overview

Gig-Engine evolves from a single-user static service catalog into a multi-tenant SaaS where any freelancer can create a branded service catalog, accept Stripe payments, and share or embed their catalog anywhere. The work follows a strict dependency chain: database migration and auth first (everything blocked without this), then the public catalog and dashboard surfaces, then payments, then analytics, then the gig import differentiator, and finally the embeddable widget. Every phase delivers a coherent, independently verifiable capability. The scraping automation layer (Gig Monitor, morning reports, Telegram) is entirely untouched throughout.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Multi-Tenant Foundation** - Activate Supabase auth, migrate database to multi-tenant schema with RLS, verify cross-tenant isolation
- [ ] **Phase 2: Dashboard + Public Catalog** - Auth-gated dashboard with manual service CRUD and profile management; public catalog page at /{slug}
- [ ] **Phase 3: Stripe Payments** - Stripe Checkout for fixed-price services; inquiry form for custom services; idempotent webhook handler
- [ ] **Phase 4: Analytics Dashboard** - Page view and click tracking on public catalog; revenue metrics dashboard; per-service conversion funnel
- [ ] **Phase 5: Gig Import Pipeline** - Paste a Fiverr or Upwork URL and get a pre-filled service listing via Playwright worker
- [ ] **Phase 6: Embeddable Widget** - iframe embed code for external sites; stripped catalog route with permissive CSP; dashboard embed code generator

## Phase Details

### Phase 1: Multi-Tenant Foundation
**Goal**: Any freelancer can create an account and get a tenant-isolated data environment with a unique catalog slug
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. A new user can sign up with email and password and receive a unique catalog slug (e.g. /alexhale) on completion
  2. A logged-in user can refresh the browser and remain logged in without re-entering credentials
  3. A logged-in user can log out from any page and is immediately redirected to the unauthenticated state
  4. Two tenants with overlapping data cannot read each other's rows — verified by a cross-tenant isolation test with two real accounts
  5. The existing Gig Monitor, morning report, and Telegram scripts continue to run without modification
**Plans**: 3 plans
Plans:
- [x] 01-01-PLAN.md — Database migration: tenants table, user_id columns, RLS policies
- [x] 01-02-PLAN.md — Auth infrastructure: middleware, login/signup/logout, onboarding wizard
- [x] 01-03-PLAN.md — Layout restructuring, public slug route, verification gate, cross-tenant verification

### Phase 2: Dashboard + Public Catalog
**Goal**: A freelancer can manage their service listings in a private dashboard and share a polished public catalog page with clients
**Depends on**: Phase 1
**Requirements**: PROF-01, PROF-02, CATL-01, CATL-02, CATL-03, CATL-04, CATL-05, CATL-06, CATL-07
**Success Criteria** (what must be TRUE):
  1. A logged-in user can create, edit, and delete service listings (title, description, price, pillar, thumbnail) from the dashboard
  2. A logged-in user can set their display name, avatar, tagline, and bio — and see these appear in the catalog page header
  3. A visitor navigates to /{slug} without logging in and sees the freelancer's services grouped by pillar with pricing tiers and thumbnails
  4. The public catalog page is fully usable on a mobile device (phone viewport, no horizontal scroll, touch targets correct)
  5. Services correctly display Basic/Standard/Premium package pricing where defined
**Plans**: 5 plans
Plans:
- [x] 02-01-PLAN.md — Migration 018 (bio, thumbnail_url, platform_id nullable, anon RLS) + dashboard sidebar + route scaffolding
- [x] 02-02-PLAN.md — Service CRUD (create/edit/delete Server Actions, form with pricing tiers + thumbnails, card grid list)
- [ ] 02-03-PLAN.md — Profile management (display name, avatar, tagline, bio) + settings (slug editing)
- [ ] 02-04-PLAN.md — Public catalog page (CatalogHeader, service cards grouped by pillar, markdown rendering, mobile-responsive)
- [ ] 02-05-PLAN.md — Human verification checkpoint for all 5 Phase 2 success criteria

### Phase 3: Stripe Payments
**Goal**: Visitors can purchase a fixed-price service via Stripe Checkout or submit a custom inquiry that reaches the freelancer's email
**Depends on**: Phase 2
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05
**Success Criteria** (what must be TRUE):
  1. A visitor clicks "Buy Now" on a fixed-price service and is taken to a Stripe Checkout session; completing payment lands on a confirmation page
  2. A completed Stripe payment creates an order record in Supabase that the freelancer can see in their dashboard
  3. A visitor clicks "Get a Quote" on a custom service, fills the inquiry form, and the freelancer receives the inquiry by email
  4. Stripe webhook events are deduplicated — sending the same event twice does not create a duplicate order record
**Plans**: TBD

### Phase 4: Analytics Dashboard
**Goal**: A freelancer can see how their catalog is performing — who is viewing it, which services are getting attention, and how much revenue has come in
**Depends on**: Phase 3
**Requirements**: ANLY-01, ANLY-02, ANLY-03, ANLY-04, ANLY-05
**Success Criteria** (what must be TRUE):
  1. Every public catalog page view is recorded and the freelancer can see a daily view count in their dashboard
  2. Every service card click is recorded and the freelancer can see which services are getting the most attention
  3. The dashboard shows total orders and total revenue sourced from Stripe webhook data
  4. The dashboard shows a per-service funnel (views to clicks to purchases) so the freelancer can identify high-converting services
  5. One tenant's analytics data is never visible to another tenant's dashboard
**Plans**: TBD

### Phase 5: Gig Import Pipeline
**Goal**: A freelancer can paste a Fiverr or Upwork gig URL and get a pre-filled service listing without manual data entry
**Depends on**: Phase 2
**Requirements**: IMPT-01, IMPT-02, IMPT-03, IMPT-04
**Success Criteria** (what must be TRUE):
  1. A user pastes a Fiverr gig URL and the dashboard shows a review form pre-populated with the scraped title, description, pricing, and image
  2. A user pastes an Upwork service URL and the dashboard shows a review form pre-populated with scraped content
  3. The user can review and edit all imported fields before saving — nothing is auto-saved without confirmation
  4. When a scrape fails (expired auth, blocked, DOM changed), the user sees a clear error message with actionable next steps — the form does not silently submit empty data
**Plans**: TBD

### Phase 6: Embeddable Widget
**Goal**: A freelancer can embed their catalog as an iframe on any external site (Webflow, Squarespace, personal portfolio)
**Depends on**: Phase 2
**Requirements**: WDGT-01, WDGT-02, WDGT-03
**Success Criteria** (what must be TRUE):
  1. A logged-in user can copy a ready-to-paste embed code snippet from their dashboard settings
  2. Pasting the embed code into a Webflow or Squarespace page renders the freelancer's catalog in an iframe without login required
  3. The embedded catalog is mobile-responsive and the Stripe Checkout flow works from within the iframe
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6
Note: Phase 5 depends on Phase 2 (not Phase 4) — it can be executed in parallel with Phases 3-4 if desired.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Multi-Tenant Foundation | 3/3 | Complete | 2026-02-18 |
| 2. Dashboard + Public Catalog | 1/5 | In Progress | - |
| 3. Stripe Payments | 0/TBD | Not started | - |
| 4. Analytics Dashboard | 0/TBD | Not started | - |
| 5. Gig Import Pipeline | 0/TBD | Not started | - |
| 6. Embeddable Widget | 0/TBD | Not started | - |

# Phase 2: Dashboard + Public Catalog - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

A freelancer can manage their service listings in a private dashboard and share a polished public catalog page with clients. Includes: service CRUD (create, edit, delete), profile/branding management, and the public /{slug} catalog rendering. Does NOT include payments (Phase 3), analytics (Phase 4), or gig import (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Service listing form
- Flexible pricing tiers: single price by default, optionally add Standard and Premium tiers
- Thumbnails support both image upload and URL paste — user picks whichever is easier
- Description field uses markdown input — plain text with markdown syntax, rendered on the public catalog page
- Pillar assignment required per service (maps to existing 5-pillar strategy)

### Pricing model
- Claude's Discretion: decide whether to support fixed-price only or also custom/quote-based services ("Contact for pricing") based on codebase patterns and Phase 3 payment flow compatibility

### Dashboard layout
- Sidebar with three sections: Services, Profile, Settings
- Services section: service list + create/edit forms
- Profile section: display name, avatar, tagline, bio editing
- Settings section: account-level config (slug, email, etc.)
- Empty state: onboarding checklist (1. Complete profile, 2. Add first service, 3. Share catalog link)

### Public catalog presentation
- Services organized and displayed on /{slug} public page
- Must be fully usable on mobile (phone viewport, no horizontal scroll, correct touch targets)
- Services display Basic/Standard/Premium package pricing where defined

### Claude's Discretion
- Dashboard services list display format (table vs card grid)
- When and where to surface the public catalog preview link
- Public catalog service organization (grouped by pillar vs flat grid with filters)
- Catalog header content and layout (avatar, name, tagline, bio — how much to show)
- Pricing display on public service cards (starting price vs all tiers visible)
- Public catalog interactivity level (view-only vs contact CTA before Phase 3 payments)

</decisions>

<specifics>
## Specific Ideas

- The existing static catalog at gig-engine.vercel.app already renders 31 services across 5 pillars with images, pricing tiers, and pillar grouping — the new dynamic catalog should feel at least as polished
- Markdown descriptions allow freelancers to paste content from their existing Fiverr/Upwork listings with minimal reformatting

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-dashboard-public-catalog*
*Context gathered: 2026-02-17*

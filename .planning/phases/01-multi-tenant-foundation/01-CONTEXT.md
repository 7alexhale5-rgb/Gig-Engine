# Phase 1: Multi-Tenant Foundation - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Activate Supabase auth, migrate database to multi-tenant schema with RLS, and verify cross-tenant isolation. Delivers: email/password signup, persistent sessions, logout, tenant record with unique slug, and RLS on all tables. Does NOT include dashboard UI, service CRUD, profile editing, or public catalog rendering — those are Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Signup Flow & Slug Assignment
- After signup, user lands in a **single-page onboarding wizard** (not multi-step)
- Onboarding collects: display name (required), slug confirmation (required), avatar upload (optional), tagline/bio (optional)
- Name + slug are required before accessing dashboard; avatar and tagline are skippable
- Slug is **auto-generated from full name** (e.g. "Alex Hale" → /alexhale)
- Slug field shows a **live URL preview** (e.g. gig-engine.vercel.app/alexhale) updating as user edits
- If slug is taken, **append incrementing numbers** automatically (alexhale → alexhale1 → alexhale2) — user can still edit
- **Email verification is NOT required** to use the dashboard, but IS required before the public catalog page goes live
- Unverified users see a banner prompting verification; their /{slug} page returns a holding state until verified

### Auth Session Behavior
- **Public pages** (no auth required): home/landing page, login, signup, public catalog at /{slug}
- **Protected pages** (auth required): dashboard and all dashboard sub-routes
- After login: always redirect to **dashboard**
- After logout: redirect to **login page**
- Auth guard on protected pages: redirect to login with message **"Please log in to continue"**
- Sessions persist across browser refresh (Supabase session token in cookie/localStorage)

### Claude's Discretion
- Exact onboarding page layout and field arrangement
- Verification email copy and template design
- Session token storage mechanism (cookie vs localStorage — follow Supabase Next.js best practices)
- Auth middleware implementation pattern (Next.js middleware vs per-route checks)
- How to handle the "holding state" page for unverified users' catalog URLs
- Existing data migration strategy (how to handle the 14 existing tables and their rows)
- Script compatibility approach (how Gig Monitor and morning reports authenticate post-migration)

</decisions>

<specifics>
## Specific Ideas

- The onboarding should feel lightweight — one page, not a chore. Think "claim your URL" energy.
- Live URL preview gives immediate value signal: "This is YOUR page."
- Verification gate on public catalog (not dashboard) means users can set up everything privately first, then "go live" when ready.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-multi-tenant-foundation*
*Context gathered: 2026-02-17*

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Freelancers can instantly create a professional service catalog from their existing platform listings and start accepting payments.
**Current focus:** Phase 2 — Dashboard + Public Catalog

## Current Position

Phase: 2 of 6 (Dashboard + Public Catalog)
Plan: 1 of 5 in current phase
Status: Phase 2 in progress — Plan 01 complete
Last activity: 2026-02-18 — Plan 02-01 complete (migration 018, react-markdown, sidebar, route scaffolding)

Progress: [###░░░░░░░] ~20%

## Performance Metrics

**Velocity:**
- Total plans completed: 2 (01-01, 01-02) + 01-03 in progress
- Average duration: ~56 min
- Total execution time: ~1h 52min + ~25min (01-03)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-multi-tenant-foundation | 2 complete + 1 in progress | ~137 min | ~46 min |

**Recent Trend:**
- Last 5 plans: 01-01 (47min), 01-02 (~65min), 01-03 (~25min, partial)
- Trend: Faster (01-03 automated tasks pre-built by 01-02)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Foundation]: Multi-tenancy via RLS + user_id columns, not schema-per-tenant — incompatible with Supabase free tier management
- [Foundation]: Playwright import worker runs as launchd script, NOT Vercel serverless — 280MB Chromium binary exceeds 50MB function limit
- [Phase 3]: Stripe Checkout (no Connect Express) for v1 — Connect adds $2/account/month overhead unjustified until second freelancer needs payouts
- [Phase 6]: Widget delivery via iframe (not Shadow DOM Web Component) — simpler, no React hydration complexity in third-party environments
- [Phase 5]: Requires research flag at plan time — ToS exposure, Upwork API viability, and Supabase Vault credential storage are unresolved
- [01-01]: user_id added as NULLABLE — existing seeded rows invisible via RLS (NULL != any UUID), not deleted
- [01-01]: findAvailableSlug accepts SupabaseClient param — decoupled from cookie-based server context
- [01-01]: Public anon SELECT on tenants requires slug IS NOT NULL AND onboarding_complete = true
- [01-02]: Auth/onboarding layouts use fixed inset-0 z-50 overlay — avoids restructuring root layout (now superseded by 01-03 clean root layout)
- [01-02]: checkSlugAvailability uses anon Supabase client — authenticated client only sees own tenant row
- [01-02]: completeOnboarding calls refreshSession() after updateUser() — prevents stale JWT redirect loop
- [01-03]: Public /{slug} route uses anon Supabase client (createClient from @supabase/supabase-js) — public reads need no auth context
- [01-03]: email_verified gate on /{slug}: unverified tenants see friendly holding state, not an error
- [02-01]: contact_for_pricing BOOLEAN added to gig_listings for Phase 3 quote-based service compatibility (plan-specified discretion)
- [02-01]: Anon RLS on gig_listings requires email_verified = true — unverified tenants' services stay off public catalog
- [02-01]: Dashboard root /dashboard redirects to /dashboard/services; no standalone root page

### Pending Todos

None — Phase 1 complete, Plan 02-01 complete. Ready for Plan 02-02 (Service CRUD).

### Blockers/Concerns

- [Phase 1]: service_role key must never appear in NEXT_PUBLIC_ env vars — add CI lint rule in Phase 1
- [Phase 3]: Stripe webhook handler must use req.text() before constructEvent — not req.json() (destroys HMAC signature)
- [Phase 5]: Scraper auth state expires every 7-30 days silently — import worker must detect login-wall DOM signatures and surface re-auth prompt
- [Phase 5]: Run /gsd:research-phase before planning this phase (Upwork API viability, Supabase Vault pattern)

## Session Continuity

Last session: 2026-02-18
Stopped at: Plan 02-01 complete. Migration 018 created, react-markdown installed, dashboard sidebar expanded, three sub-routes scaffolded. Ready for Plan 02-02 (Service CRUD).
Resume file: .planning/phases/02-dashboard-public-catalog/02-02-PLAN.md

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Freelancers can instantly create a professional service catalog from their existing platform listings and start accepting payments.
**Current focus:** Phase 2 — Dashboard + Public Catalog

## Current Position

Phase: 2 of 6 (Dashboard + Public Catalog)
Plan: 3 of 5 in current phase
Status: Phase 2 in progress — Plans 01 and 02 complete
Last activity: 2026-02-18 — Plan 02-02 complete (Service CRUD: server actions, ServiceForm, ServiceList, 3 route pages)

Progress: [####░░░░░░] ~28%

## Performance Metrics

**Velocity:**
- Total plans completed: 4 (01-01, 01-02, 01-03, 02-01, 02-02)
- Average duration: ~29 min
- Total execution time: ~137min (Phase 1) + ~2min (02-01) + ~4min (02-02) = ~143min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-multi-tenant-foundation | 3 complete | ~137 min | ~46 min |
| 02-dashboard-public-catalog | 2 complete | ~6 min | ~3 min |

**Recent Trend:**
- Last 5 plans: 01-03 (partial), 02-01 (2min), 02-02 (4min)
- Trend: Very fast — plan pre-work from research phase paying off

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
- [02-02]: ServiceForm uses react-hook-form state + manual FormData construction — PricingTierEditor is controlled-only, native form action= would require hidden inputs for all pricing fields
- [02-02]: Separate ServiceForm from GigForm — dashboard catalog CRUD needs simpler public-facing fields (no platform_id, status, gig_url admin fields); avoids coupling

### Pending Todos

None — Plans 02-01 and 02-02 complete. Ready for Plan 02-03 (Profile management).

### Blockers/Concerns

- [Phase 1]: service_role key must never appear in NEXT_PUBLIC_ env vars — add CI lint rule in Phase 1
- [Phase 3]: Stripe webhook handler must use req.text() before constructEvent — not req.json() (destroys HMAC signature)
- [Phase 5]: Scraper auth state expires every 7-30 days silently — import worker must detect login-wall DOM signatures and surface re-auth prompt
- [Phase 5]: Run /gsd:research-phase before planning this phase (Upwork API viability, Supabase Vault pattern)
- [02-02]: ESLint useEslintrc/extensions warnings are pre-existing — deferred to eslint config fix in maintenance task

## Session Continuity

Last session: 2026-02-18
Stopped at: Plan 02-02 complete. Service CRUD implemented: createService/updateService/deleteService actions, ServiceForm with thumbnail + pricing + contact_for_pricing, ServiceList with onboarding checklist, three route pages. Build passes.
Resume file: .planning/phases/02-dashboard-public-catalog/02-03-PLAN.md

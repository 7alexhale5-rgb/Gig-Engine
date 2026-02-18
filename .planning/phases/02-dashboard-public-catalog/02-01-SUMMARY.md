---
phase: 02-dashboard-public-catalog
plan: 01
subsystem: database, ui
tags: [supabase, rls, nextjs, react, migration, dashboard, navigation]

# Dependency graph
requires:
  - phase: 01-multi-tenant-foundation
    provides: tenants table, gig_listings with user_id, RLS policies, auth middleware, public slug route

provides:
  - Migration 018 SQL with bio, thumbnail_url, platform_id nullable, contact_for_pricing, anon RLS on gig_listings
  - Dashboard sidebar with three-section navigation (Services, Profile, Settings)
  - /dashboard/services placeholder route
  - /dashboard/profile placeholder route
  - /dashboard/settings placeholder route
  - react-markdown installed for markdown rendering in public catalog

affects:
  - 02-02-PLAN.md (Service CRUD — builds on /dashboard/services and gig_listings schema)
  - 02-03-PLAN.md (Profile management — builds on /dashboard/profile and bio column)
  - 02-04-PLAN.md (Public catalog — uses thumbnail_url, bio, anon RLS policy)

# Tech tracking
tech-stack:
  added:
    - react-markdown@10.1.0 (markdown rendering)
  patterns:
    - Dashboard sub-routes are Server Components with auth guard via supabase.auth.getUser()
    - Dashboard root (/dashboard) redirects to /dashboard/services — no standalone root page
    - Sidebar active state uses pathname.startsWith(item.href) for sub-route highlighting

key-files:
  created:
    - supabase/migrations/018_add_bio_thumbnail_catalog_policy.sql
    - src/app/dashboard/services/page.tsx
    - src/app/dashboard/profile/page.tsx
    - src/app/dashboard/settings/page.tsx
  modified:
    - src/components/layout/Sidebar.tsx
    - src/app/dashboard/page.tsx
    - package.json

key-decisions:
  - "contact_for_pricing BOOLEAN DEFAULT false added to gig_listings for Phase 3 quote-based service compatibility"
  - "Anon RLS on gig_listings mirrors tenants anon policy: slug IS NOT NULL AND onboarding_complete = true AND email_verified = true"
  - "Dashboard root /dashboard redirects to /dashboard/services rather than rendering its own page"

patterns-established:
  - "Dashboard sub-route Server Component: auth guard → Header with title/description → PageContainer with content"
  - "Sidebar navigation items use /dashboard/* hrefs; active detection via pathname.startsWith(item.href)"

requirements-completed: [CATL-04, CATL-05]

# Metrics
duration: 2min
completed: 2026-02-18
---

# Phase 2 Plan 01: Migration 018, react-markdown, and dashboard sidebar scaffolding Summary

**Migration 018 adds bio/thumbnail_url/contact_for_pricing/anon RLS to Supabase schema; dashboard sidebar expanded to Services/Profile/Settings with three placeholder sub-routes**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T02:10:20Z
- **Completed:** 2026-02-18T02:12:40Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Migration 018 SQL created with all 5 schema changes: bio (tenants), thumbnail_url (gig_listings), platform_id nullable, contact_for_pricing, and anon SELECT policy for verified tenants
- react-markdown@10.1.0 installed as dependency for Plan 04 public catalog markdown rendering
- Sidebar updated from single "Service Catalog" item to three-section navigation: Services, Profile, Settings with correct lucide-react icons and /dashboard/* hrefs
- Three dashboard sub-routes scaffolded as auth-guarded Server Components with placeholder content
- Dashboard root /dashboard now redirects to /dashboard/services
- Build passes: all 3 new routes confirmed in Next.js route table

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration 018 and react-markdown install** - `402eade` (feat)
2. **Task 2: Dashboard sidebar expansion and route scaffolding** - `b350862` (feat)

## Files Created/Modified

- `supabase/migrations/018_add_bio_thumbnail_catalog_policy.sql` - Phase 2 schema: bio, thumbnail_url, platform_id nullable, contact_for_pricing, anon RLS policy on gig_listings
- `src/components/layout/Sidebar.tsx` - Navigation updated to Services/Profile/Settings with LayoutGrid/User/Settings icons
- `src/app/dashboard/page.tsx` - Simplified to immediate redirect to /dashboard/services
- `src/app/dashboard/services/page.tsx` - Placeholder: auth guard + Header "Services" + empty state message
- `src/app/dashboard/profile/page.tsx` - Placeholder: auth guard + Header "Profile" + coming soon message
- `src/app/dashboard/settings/page.tsx` - Placeholder: auth guard + Header "Settings" + coming soon message
- `package.json` - react-markdown@10.1.0 added to dependencies

## Decisions Made

- `contact_for_pricing BOOLEAN DEFAULT false` added to `gig_listings` — plan specified it as "Claude's Discretion" for Phase 3 quote-based service compatibility; included as it costs nothing and avoids a future migration
- Anon RLS policy on gig_listings gates on `email_verified = true` (not just `onboarding_complete`) — matches tenant verification intent so unverified users' services don't appear in public catalog
- Dashboard root redirect implemented as a simple Server Component calling `redirect()` directly — no supabase call needed since auth is handled by dashboard layout.tsx

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing ESLint warning in build output (`useEslintrc` and `extensions` options removed in newer ESLint) — pre-existing issue, not introduced by this work, out of scope per deviation rules. Build still succeeds.

## User Setup Required

None - no external service configuration required. Migration 018 requires manual `supabase db push` or local `supabase db reset` when Supabase is running.

## Next Phase Readiness

- Migration 018 is ready to deploy via `supabase db push` — unblocks bio (Plan 03), thumbnail_url (Plan 02), platform_id nullable (Plan 02), and public catalog anon reads (Plan 04)
- /dashboard/services route is ready to receive Service CRUD components (Plan 02)
- /dashboard/profile route is ready to receive Profile management form (Plan 03)
- /dashboard/settings route is ready to receive Settings UI (Plan 03)
- react-markdown is installed and importable for Plan 04 public catalog

---
*Phase: 02-dashboard-public-catalog*
*Completed: 2026-02-18*

## Self-Check: PASSED

- FOUND: supabase/migrations/018_add_bio_thumbnail_catalog_policy.sql
- FOUND: src/app/dashboard/services/page.tsx
- FOUND: src/app/dashboard/profile/page.tsx
- FOUND: src/app/dashboard/settings/page.tsx
- FOUND: .planning/phases/02-dashboard-public-catalog/02-01-SUMMARY.md
- FOUND: commit 402eade (Migration 018 and react-markdown install)
- FOUND: commit b350862 (Dashboard sidebar expansion and route scaffolding)

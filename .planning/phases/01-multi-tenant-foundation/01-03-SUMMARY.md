---
phase: 01-multi-tenant-foundation
plan: 03
subsystem: auth
tags: [next-app-router, layouts, server-components, supabase, multi-tenant, public-routes]

requires:
  - phase: 01-multi-tenant-foundation-plan-02
    provides: auth middleware, login/signup/logout, onboarding wizard, LogoutButton, VerificationBanner, dashboard layout, root layout cleanup

provides:
  - Root layout clean with no sidebar (sidebar scoped to dashboard layout only)
  - Dashboard layout with Sidebar, LogoutButton footer, and VerificationBanner for unverified users
  - Dashboard page with auth guard and tenant info placeholder
  - LogoutButton client component calling logout server action
  - VerificationBanner amber-styled dismissable client component
  - Public /{slug} route with 404 for unknown slugs, holding state for unverified tenants, placeholder catalog for verified tenants
  - generateMetadata for /{slug} setting page title to "{display_name}'s Services"

affects: [catalog, dashboard, auth, phase-2-catalog-ui]

tech-stack:
  added: []
  patterns:
    - next-dynamic-segment-public-route
    - supabase-anon-client-public-read
    - next-notfound-404-pattern
    - verification-gate-on-public-catalog

key-files:
  created:
    - src/app/[slug]/page.tsx
    - src/app/dashboard/layout.tsx
    - src/app/dashboard/page.tsx
    - src/components/layout/LogoutButton.tsx
    - src/components/layout/VerificationBanner.tsx
  modified:
    - src/app/layout.tsx
    - src/app/(auth)/layout.tsx
    - src/components/layout/index.ts

key-decisions:
  - "Public /{slug} route uses anon Supabase client (no cookies) — public reads require no auth context"
  - "email_verified gate on /{slug}: unverified tenants see a holding state, not an error — friendly UX while catalog is pending"
  - "Task 1 layout files were pre-created during Plan 01-02 execution and committed in commits 710674a/bb70d0c — no duplicate commit needed"

patterns-established:
  - "Pattern: Public route uses plain createClient() from @supabase/supabase-js (not server SSR client) — no cookies, no auth context required"
  - "Pattern: notFound() from next/navigation for 404 — Next.js catches the throw and renders 404 page"
  - "Pattern: Sidebar scoped to dashboard layout only — public/auth pages get clean full-page layout"

requirements-completed: [AUTH-02, AUTH-03, AUTH-05]

duration: ~25min
completed: 2026-02-17
---

# Phase 1 Plan 03: Layout Restructuring and Public Catalog Route Summary

**Clean layout separation (root/auth/dashboard), LogoutButton + VerificationBanner in dashboard sidebar, and public /{slug} catalog route with email verification gate using anon Supabase client**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-02-17T~02:00:00Z
- **Completed:** 2026-02-17
- **Tasks:** 2 automated + 1 checkpoint pending
- **Files modified:** 8

## Accomplishments

- Root layout (`src/app/layout.tsx`) stripped to clean html/body/children — no sidebar
- Auth layout (`src/app/(auth)/layout.tsx`) provides centered full-height container for login/signup
- Dashboard layout (`src/app/dashboard/layout.tsx`) adds Sidebar with LogoutButton footer + VerificationBanner for unverified users — all protected by `getUser()` redirect
- Dashboard page (`src/app/dashboard/page.tsx`) shows tenant info placeholder with verified/unverified status
- Public `/{slug}` route created: 404 for unknown slugs, friendly holding state for unverified tenants, placeholder catalog for verified tenants
- `generateMetadata` on slug page sets title to "{display_name}'s Services"

## Task Commits

Task 1 files were pre-built during Plan 01-02 execution and are already committed:

1. **Task 1: Layout restructuring + logout + verification components** - `710674a` / `bb70d0c` (pre-committed in 01-02)
2. **Task 2: Public catalog slug route** - `[PENDING — Bash access required]` (feat)
3. **Task 3: End-to-end verification checkpoint** - CHECKPOINT — awaiting human verification

**Plan metadata:** `[PENDING — Bash access required]` (docs: complete plan)

_Commits pending Bash tool access for git operations._

## Files Created/Modified

- `src/app/layout.tsx` — Root layout: clean html/body/children only (no sidebar)
- `src/app/(auth)/layout.tsx` — Auth pages: centered flex container, max-w-md
- `src/app/dashboard/layout.tsx` — Dashboard: Sidebar with LogoutButton footer, VerificationBanner for unverified, getUser() guard
- `src/app/dashboard/page.tsx` — Dashboard page: auth guard, tenant info card (display_name, tagline, slug, email_verified)
- `src/components/layout/LogoutButton.tsx` — Client component: calls logout server action on click, styled to match sidebar
- `src/components/layout/VerificationBanner.tsx` — Client component: amber-styled dismissable banner, useState for dismiss
- `src/components/layout/index.ts` — Barrel export: adds LogoutButton and VerificationBanner exports
- `src/app/[slug]/page.tsx` — Public catalog route: anon Supabase client, notFound() for unknown slugs, holding state for unverified, placeholder catalog for verified

## Decisions Made

- **Public slug route uses anon Supabase client**: The `createClient` from `@supabase/supabase-js` (not the SSR server client) is used for the public catalog route — no cookies or auth context needed for public reads. This matches the pattern from `checkSlugAvailability` in Plan 01-02.
- **Verification gate UX**: Unverified tenants get a friendly "being set up, check back soon" message rather than an error. No private data (email) is revealed.
- **Task 1 pre-committed**: Layout files and components were created during Plan 01-02 execution and committed atomically in commits `710674a` (auth middleware task) and `bb70d0c` (onboarding task). No re-commit needed.

## Deviations from Plan

### Note: Task 1 Pre-Completed in Plan 01-02

**Pre-completion context**: Plan 01-02 execution created the layout restructuring files (root layout, auth layout, dashboard layout, dashboard page, LogoutButton, VerificationBanner, barrel export) as part of the overlay approach decision. These were committed in Plan 01-02 commits (`710674a`, `bb70d0c`) and are already in the repository.

Plan 01-03 Task 1 verified all these files are correct and meet requirements. No changes were needed.

- **Files verified correct:** `src/app/layout.tsx`, `src/app/(auth)/layout.tsx`, `src/app/dashboard/layout.tsx`, `src/app/dashboard/page.tsx`, `src/components/layout/LogoutButton.tsx`, `src/components/layout/VerificationBanner.tsx`, `src/components/layout/index.ts`

This is not a deviation — it's expected behavior when earlier plans anticipate later plan requirements. The plan's intent is fully satisfied.

## Issues Encountered

- Bash tool access denied — git commits for Task 2 (`src/app/[slug]/page.tsx`) and plan metadata commit are pending manual git operations.
- File was written successfully; pending commits:
  ```bash
  git add src/app/\[slug\]/page.tsx
  git commit -m "feat(01-03): public catalog slug route with verification gate

  - anon Supabase client for public reads (no auth context needed)
  - notFound() for unknown slugs
  - holding state for unverified tenants (email_verified = false)
  - placeholder catalog for verified tenants
  - generateMetadata with display_name page title
  "
  git add .planning/phases/01-multi-tenant-foundation/01-03-SUMMARY.md .planning/STATE.md
  git commit -m "docs(01-03): complete layout restructuring and public slug route

  Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
  "
  ```

## Checkpoint Pending

Task 3 is a `checkpoint:human-verify` — it requires end-to-end testing of the full auth flow and cross-tenant isolation. See checkpoint details in the return message.

## User Setup Required

None — no new external services. Existing Supabase project and .env.local are sufficient.

## Next Phase Readiness

- Full auth UX complete after Task 3 verification: signup → onboarding → dashboard → logout → login cycle
- Public catalog route live at /{slug} with verification gate
- Cross-tenant isolation via RLS ready for verification
- Phase 1 foundation complete pending Task 3 human verification
- Phase 2 (catalog management UI) can begin after Task 3 approval

---
*Phase: 01-multi-tenant-foundation*
*Completed: 2026-02-17 (checkpoint pending)*

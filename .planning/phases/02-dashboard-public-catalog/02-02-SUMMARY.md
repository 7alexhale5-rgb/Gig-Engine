---
phase: 02-dashboard-public-catalog
plan: 02
subsystem: dashboard, crud, components
tags: [nextjs, server-actions, supabase, react-hook-form, zod, dashboard]

# Dependency graph
requires:
  - phase: 02-01
    provides: migration 018 (thumbnail_url, contact_for_pricing, platform_id nullable, anon RLS), /dashboard/services placeholder route

provides:
  - Server Actions: createService, updateService, deleteService (src/app/dashboard/services/actions.ts)
  - ServiceForm component with thumbnail preview, contact_for_pricing toggle, pillar dropdown, PricingTierEditor integration
  - ServiceList component with card grid and onboarding checklist empty state
  - /dashboard/services — real server component with service + pillar + tenant fetch
  - /dashboard/services/new — create form page
  - /dashboard/services/[id]/edit — edit form page with initialData pre-fill

affects:
  - 02-04-PLAN.md (Public catalog — reads gig_listings via anon RLS, now has thumbnail_url and contact_for_pricing)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Service CRUD Server Actions: FormData parsing via Object.fromEntries, contact_for_pricing checkbox normalization (on/off string → boolean), auth guard via supabase.auth.getUser(), belt-and-suspenders .eq('user_id', user.id) on top of RLS"
    - "ServiceForm: react-hook-form for UI state, collect values into FormData on submit to call Server Action, PricingTierEditor controlled state synced to form via setValue"
    - "ServiceList: empty state shows onboarding checklist (profile / service / catalog steps with done detection), card grid 2-col md"

key-files:
  created:
    - src/app/dashboard/services/actions.ts
    - src/components/gigs/ServiceForm.tsx
    - src/components/gigs/ServiceList.tsx
    - src/app/dashboard/services/new/page.tsx
    - src/app/dashboard/services/[id]/edit/page.tsx
  modified:
    - src/lib/schemas/gig.ts
    - src/lib/supabase/types.ts
    - src/app/dashboard/services/page.tsx
    - src/components/gigs/index.ts

key-decisions:
  - "ServiceForm uses react-hook-form for UI state management and collects values into FormData on submit rather than using native form action= — allows PricingTierEditor controlled component to integrate cleanly while still calling Server Actions"
  - "GigListing type updated to reflect migration 018 fields (user_id, thumbnail_url, contact_for_pricing, platform_id nullable) — keeps TypeScript in sync with actual DB schema"
  - "ServiceList uses router.refresh() after deleteService rather than optimistic removal — simpler, consistent with server-side data fetching pattern"

requirements-completed: [CATL-01, CATL-02, CATL-03, CATL-06, CATL-07]

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 2 Plan 02: Service CRUD — Server Actions, Form, and List Summary

**Service CRUD complete: createService/updateService/deleteService server actions with auth guards, ServiceForm with thumbnail preview and contact_for_pricing toggle, ServiceList with onboarding checklist empty state, three dashboard route pages**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-18T02:16:42Z
- **Completed:** 2026-02-18T02:20:42Z
- **Tasks:** 2
- **Files modified/created:** 9

## Accomplishments

- Three Server Actions created with full auth guard, RLS belt-and-suspenders (.eq('user_id', user.id)), contact_for_pricing null-out logic, and revalidatePath cache invalidation
- Gig schema updated with thumbnail_url (URL or empty string) and contact_for_pricing (boolean) fields
- GigListing TypeScript type updated to reflect migration 018: user_id, thumbnail_url, contact_for_pricing, platform_id nullable
- ServiceForm built with react-hook-form + zod, pillar dropdown (color-coded), thumbnail URL input with live 16:9 preview and error fallback, contact_for_pricing checkbox that hides PricingTierEditor, FormData collection on submit to call Server Actions
- ServiceList built with 2-column card grid on desktop, 1-column on mobile, onboarding checklist empty state (profile done / service added / catalog shareable), ConfirmDialog delete flow
- services/page.tsx replaced with real server component: fetches services with pillar joins, pillars list, and tenant data
- services/new/page.tsx: auth guard, pillar fetch, error banner from searchParams.error
- services/[id]/edit/page.tsx: auth guard, service fetch with user_id guard (redirect if not found), pre-filled ServiceForm
- Build passes: all three routes confirmed in Next.js route table

## Task Commits

Each task was committed atomically:

1. **Task 1: Service CRUD Server Actions and schema update** — `8dce741` (feat)
2. **Task 2: Service form, list, and route pages** — `3120335` (feat)

## Files Created/Modified

- `src/app/dashboard/services/actions.ts` — createService, updateService, deleteService server actions
- `src/components/gigs/ServiceForm.tsx` — Dashboard service create/edit form with thumbnail, pricing tiers, contact_for_pricing
- `src/components/gigs/ServiceList.tsx` — Service card grid with onboarding checklist empty state
- `src/app/dashboard/services/page.tsx` — Real server component replacing placeholder
- `src/app/dashboard/services/new/page.tsx` — New service form page
- `src/app/dashboard/services/[id]/edit/page.tsx` — Edit service form page
- `src/lib/schemas/gig.ts` — Added thumbnail_url and contact_for_pricing fields
- `src/lib/supabase/types.ts` — Updated GigListing type to include migration 018 fields
- `src/components/gigs/index.ts` — Added ServiceForm and ServiceList exports

## Decisions Made

- **ServiceForm uses react-hook-form for UI state, not native form action=**: The existing `PricingTierEditor` is a fully controlled component with onChange callbacks and no native input name attributes. Wiring it to a native `<form action={serverAction}>` would require adding hidden inputs for all pricing values. Instead, `ServiceForm` uses react-hook-form to track all form state including pricing tiers, then constructs a `FormData` object manually on submit and calls the Server Action directly. This gives clean controlled UI while still using Server Actions for mutations.
- **Separate ServiceForm from GigForm**: The existing `GigForm` was designed for a different UX pattern (admin-style gig manager with onSubmit callback, platform_id field, status field, gig_url field). For the dashboard catalog CRUD, a simpler form focused on the public-facing fields (title, pillar, description, thumbnail, pricing) is better UX. Created `ServiceForm.tsx` rather than extending `GigForm.tsx` to avoid coupling the admin tools to the catalog workflow.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as specified.

### Pattern Adjustments

**1. ServiceForm uses manual FormData construction instead of native form action=**
- **Found during:** Task 2
- **Issue:** PricingTierEditor is a controlled component with no native name attributes — cannot submit via native form action= without adding hidden inputs for every pricing field
- **Fix:** ServiceForm uses react-hook-form state management + manual FormData construction on submit to call the Server Action. Functionally identical from the server's perspective (receives FormData), better UX from the client's perspective (full react-hook-form validation)
- **Classification:** Rule 2 (missing critical functionality — native form submission would bypass pricing tier state)

## Pre-existing Issues (Out of Scope)

- ESLint warning `useEslintrc`, `extensions` options removed in newer ESLint — pre-existing from Plan 02-01, build succeeds despite warning, deferred to CLAUDE.md or eslint config fix in a future maintenance task

## User Setup Required

No additional setup. Migration 018 was already created in Plan 02-01 and needs to be applied via `supabase db push` to create the thumbnail_url and contact_for_pricing columns before using the new form.

## Next Phase Readiness

- /dashboard/services is fully functional with CRUD
- Services have thumbnail_url and contact_for_pricing ready for Plan 04 public catalog rendering
- Plan 03 (Profile management) builds on the /dashboard/profile route scaffolded in Plan 02-01
- Plan 04 (Public catalog) can now query gig_listings with thumbnail_url and pillar joins

---
*Phase: 02-dashboard-public-catalog*
*Completed: 2026-02-18*

## Self-Check: PASSED

- FOUND: src/app/dashboard/services/actions.ts
- FOUND: src/components/gigs/ServiceForm.tsx
- FOUND: src/components/gigs/ServiceList.tsx
- FOUND: src/app/dashboard/services/page.tsx
- FOUND: src/app/dashboard/services/new/page.tsx
- FOUND: src/app/dashboard/services/[id]/edit/page.tsx
- FOUND: .planning/phases/02-dashboard-public-catalog/02-02-SUMMARY.md
- FOUND: commit 8dce741 (feat(02-02): service CRUD server actions and schema update)
- FOUND: commit 3120335 (feat(02-02): service form, list, and route pages)

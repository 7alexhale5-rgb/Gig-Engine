# Phase 2: Dashboard + Public Catalog - Research

**Researched:** 2026-02-17
**Domain:** Next.js App Router dashboard UI, Supabase CRUD with RLS, public Server-Component catalog, markdown rendering, image upload
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Service Listing Form
- Flexible pricing tiers: single price by default, optionally add Standard and Premium tiers
- Thumbnails support both image upload and URL paste — user picks whichever is easier
- Description field uses markdown input — plain text with markdown syntax, rendered on the public catalog page
- Pillar assignment required per service (maps to existing 5-pillar strategy)

#### Pricing Model
- Claude's Discretion: decide whether to support fixed-price only or also custom/quote-based services ("Contact for pricing") based on codebase patterns and Phase 3 payment flow compatibility

#### Dashboard Layout
- Sidebar with three sections: Services, Profile, Settings
- Services section: service list + create/edit forms
- Profile section: display name, avatar, tagline, bio editing
- Settings section: account-level config (slug, email, etc.)
- Empty state: onboarding checklist (1. Complete profile, 2. Add first service, 3. Share catalog link)

#### Public Catalog Presentation
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROF-01 | User can set display name, avatar URL, tagline, and short bio | Tenants table has display_name/tagline/avatar_url but is MISSING `bio` column — requires migration 018. Profile form uses existing react-hook-form + zod pattern. Avatar supports URL paste (no storage needed for MVP). |
| PROF-02 | Profile identity displays on public catalog page header | Existing `[slug]/page.tsx` already fetches tenant row with anon client; just extend the SELECT to include `bio` once migration 018 adds it. |
| CATL-01 | User can create a service listing with title, description, price, pillar, and thumbnail | `gig_listings` table is MISSING `thumbnail_url` column — requires migration 018. GigForm component already exists; needs thumbnail field added. Pillar is required FK — matches existing pillar_id pattern. |
| CATL-02 | User can edit their own service listings | RLS "Users can CRUD own rows" on gig_listings is in place (migration 017). Edit form reuses GigForm with initialData. Server action updates row scoped to user's user_id. |
| CATL-03 | User can delete their own service listings | DELETE RLS policy in place. ConfirmDialog component exists in shared/. Server action deletes with user_id check. |
| CATL-04 | Public catalog page at /{slug} displays user's services grouped by pillar | Anon SELECT on gig_listings needs new public RLS policy: anon can SELECT where user_id matches a verified tenant. Slug → user_id → services join is the query pattern. |
| CATL-05 | Public catalog page is mobile-responsive and requires no login to view | Public route uses anon Supabase client (no cookies). Tailwind responsive classes. No horizontal scroll requires explicit width discipline (max-w-full, overflow-hidden). |
| CATL-06 | Service listings support pricing tier display (Basic/Standard/Premium packages) | gig_listings already has pricing_basic/standard/premium + delivery_days. PricingTierEditor component already exists. Display on public catalog shows tiers inline. |
| CATL-07 | Service listings display thumbnail images | Requires migration 018 to add `thumbnail_url TEXT DEFAULT ''` to gig_listings. Two input modes: file upload (Supabase Storage) or URL paste. Research recommends URL-paste only for Phase 2 MVP; Supabase Storage for Phase 3+ (see Architecture Patterns). |
</phase_requirements>

---

## Summary

Phase 2 is primarily a UI-construction phase on top of the multi-tenant foundation from Phase 1. The critical pre-work is two schema additions: `bio TEXT DEFAULT ''` on the `tenants` table (PROF-01) and `thumbnail_url TEXT DEFAULT ''` on the `gig_listings` table (CATL-07). Without these columns, both the profile form and the thumbnail feature block. A single migration 018 handles both.

The existing codebase provides exceptionally strong scaffolding. `GigForm.tsx`, `PricingTierEditor.tsx`, `GigCard.tsx`, `EmptyState.tsx`, `ConfirmDialog.tsx`, and the full shadcn/ui component library (Button, Input, Textarea, Dialog, Tabs, Card, Select, etc.) are all production-ready. The dashboard sidebar pattern (`Sidebar.tsx`) already exists but only has one nav item — it needs expansion to three sections (Services, Profile, Settings) via React Router sub-routes or tab-based navigation. The public `[slug]/page.tsx` already has the anon client pattern and the email verification holding state; it just needs real service data added.

The key architectural decision: the public catalog needs a new Supabase RLS policy permitting anon SELECT on `gig_listings` where the `user_id` belongs to a verified tenant. This is the exact same pattern used for the tenants table in Phase 1. Markdown rendering on the public catalog uses `react-markdown` with `@tailwindcss/typography` prose classes (typography plugin already installed). Image uploads in Phase 2 should be URL-paste only — Supabase Storage adds session complexity to the public route and is better deferred to Phase 3.

**Primary recommendation:** Write migration 018 first (bio + thumbnail_url columns + anon gig policy), then build the three dashboard sections as separate route segments under `/dashboard/services`, `/dashboard/profile`, `/dashboard/settings`, then complete the public catalog rendering.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 14.2.35 (installed) | App Router, Server Actions, nested layouts | Already in stack; Server Components for dashboard SSR, Server Actions for CRUD mutations |
| @supabase/ssr | 0.8.0 (installed) | Authenticated server client for dashboard mutations | Already in stack; established pattern from Phase 1 |
| @supabase/supabase-js | 2.95.3 (installed) | Anon client for public catalog page | Already in stack; anon client used in [slug]/page.tsx |
| react-hook-form | 7.71.1 (installed) | Service listing form + profile form state | Already in stack; used in GigForm and onboarding |
| zod | 4.3.6 (installed) | Schema validation for service listing and profile forms | Already in stack; gigSchema and onboardingSchema established patterns |
| @hookform/resolvers | 5.2.2 (installed) | Connects zod to react-hook-form | Already in stack |
| react-markdown | NOT INSTALLED | Renders markdown descriptions on public catalog | Industry standard for React markdown rendering; pairs with @tailwindcss/typography prose class |
| lucide-react | 0.563.0 (installed) | Icons (Pencil, Trash2, Plus, ExternalLink etc.) | Already in stack; consistent with existing components |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tailwindcss/typography | 0.5.19 (installed) | `prose` class for styled markdown output | Already in tailwind.config.ts plugins; activate on markdown render containers |
| class-variance-authority | 0.7.1 (installed) | Conditional Tailwind classes | Already in stack; used in shadcn/ui components |
| tailwind-merge | 3.4.0 (installed) | Merge Tailwind class conflicts | Already in stack; used via cn() utility |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-markdown | @markdoc/markdoc | Markdoc is heavier and requires a compile step; react-markdown is zero-config for this use case |
| react-markdown | Custom dangerouslySetInnerHTML + DOMPurify | Hand-rolled is an XSS risk; react-markdown sanitizes by default |
| URL-paste thumbnail | Supabase Storage file upload | Storage requires signed URLs for public access, adds bucket config, and does not simplify the public catalog route — defer to Phase 3 |
| Dashboard sub-routes `/dashboard/services` | Single page with tabs | Sub-routes give each section a shareable URL; tabs are fine for Phase 2 but sub-routes scale better to Phase 3+ |

**Installation:**
```bash
npm install react-markdown
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── [slug]/
│   │   └── page.tsx              # EXTEND: fetch + render services grouped by pillar
│   └── dashboard/
│       ├── layout.tsx            # EXISTING: Sidebar + VerificationBanner
│       ├── page.tsx              # REDIRECT: → /dashboard/services (or empty state)
│       ├── services/
│       │   ├── page.tsx          # Server Component: load user's gig_listings
│       │   ├── new/
│       │   │   └── page.tsx      # New service form
│       │   ├── [id]/
│       │   │   └── edit/
│       │   │       └── page.tsx  # Edit service form
│       │   └── actions.ts        # Server Actions: createService, updateService, deleteService
│       ├── profile/
│       │   ├── page.tsx          # Server Component: load tenant row
│       │   └── actions.ts        # Server Action: updateProfile
│       └── settings/
│           ├── page.tsx          # Server Component: slug, email display
│           └── actions.ts        # Server Action: updateSettings (slug change)
├── components/
│   ├── catalog/                  # NEW: public catalog components (no auth dependency)
│   │   ├── CatalogHeader.tsx     # Avatar, name, tagline, bio display
│   │   ├── ServicePillarSection.tsx  # Pillar heading + service card grid
│   │   ├── PublicServiceCard.tsx  # Public-facing service card (thumbnail, pricing tiers)
│   │   └── index.ts
│   └── gigs/
│       ├── GigForm.tsx           # EXTEND: add thumbnail_url field (URL paste input)
│       ├── GigCard.tsx           # EXISTING: used in dashboard services list
│       └── ServiceList.tsx       # NEW: wrapper for dashboard services list with empty state
supabase/
└── migrations/
    └── 018_add_bio_and_thumbnail.sql  # bio on tenants, thumbnail_url on gig_listings, anon catalog policy
```

### Pattern 1: Migration 018 — Schema Additions + Anon RLS Policy

**What:** Three changes in one migration: add `bio` to tenants, add `thumbnail_url` to gig_listings, add anon SELECT policy on gig_listings.
**When to use:** Must run before any Phase 2 UI work.

```sql
-- supabase/migrations/018_add_bio_and_thumbnail.sql

-- Add bio field to tenants (PROF-01)
ALTER TABLE tenants ADD COLUMN bio TEXT DEFAULT '';

-- Add thumbnail_url to gig_listings (CATL-07)
ALTER TABLE gig_listings ADD COLUMN thumbnail_url TEXT DEFAULT '';

-- Public anon can SELECT gig_listings for verified tenants (CATL-04, CATL-05)
-- Pattern mirrors the tenants anon policy from migration 015.
-- Anon can only see services belonging to a tenant whose email is verified
-- and whose slug is not null (onboarding complete).
-- Joins through tenants table via user_id match.
CREATE POLICY "Public can read services for verified tenants" ON gig_listings
  FOR SELECT TO anon
  USING (
    user_id IN (
      SELECT user_id FROM tenants
      WHERE slug IS NOT NULL AND onboarding_complete = true AND email_verified = true
    )
  );
```

### Pattern 2: Dashboard Server Action (Create/Update/Delete Service)

**What:** Server Actions with `'use server'` directive handle CRUD mutations. Each action validates the user's session and enforces user_id scoping as a belt-and-suspenders alongside RLS.
**When to use:** All service CRUD from the dashboard.

```typescript
// src/app/dashboard/services/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const serviceSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  pillar_id: z.string().uuid(),
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  pricing_basic: z.coerce.number().min(0).nullable(),
  pricing_standard: z.coerce.number().min(0).nullable(),
  pricing_premium: z.coerce.number().min(0).nullable(),
  delivery_days_basic: z.coerce.number().int().min(1).nullable(),
  delivery_days_standard: z.coerce.number().int().min(1).nullable(),
  delivery_days_premium: z.coerce.number().int().min(1).nullable(),
})

export async function createService(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = serviceSchema.parse(Object.fromEntries(formData))

  const { error } = await supabase
    .from('gig_listings')
    .insert({
      ...parsed,
      user_id: user.id,
      // Required fields not in the public form:
      platform_id: await getDefaultPlatformId(supabase, user.id),
      status: 'active',
    })

  if (error) redirect(`/dashboard/services/new?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/dashboard/services')
  redirect('/dashboard/services')
}

export async function updateService(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = serviceSchema.parse(Object.fromEntries(formData))

  const { error } = await supabase
    .from('gig_listings')
    .update(parsed)
    .eq('id', id)
    .eq('user_id', user.id)  // Belt-and-suspenders: RLS also enforces this

  if (error) redirect(`/dashboard/services/${id}/edit?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/dashboard/services')
  redirect('/dashboard/services')
}

export async function deleteService(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('gig_listings')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/dashboard/services')
  redirect('/dashboard/services')
}
```

### Pattern 3: Dashboard Services Page (Server Component)

**What:** Server Component fetches user's services and pillars from Supabase; passes to client components for interaction.
**When to use:** `/dashboard/services/page.tsx` — the main service management view.

```typescript
// src/app/dashboard/services/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header, PageContainer } from '@/components/layout'
import { ServiceList } from '@/components/gigs/ServiceList'

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: services }, { data: pillars }] = await Promise.all([
    supabase
      .from('gig_listings')
      .select('*, service_pillars(name, color), platforms(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('service_pillars')
      .select('id, name, color, sort_order')
      .eq('user_id', user.id)
      .order('sort_order'),
  ])

  return (
    <>
      <Header title="Services" description="Manage your service listings" />
      <PageContainer>
        <ServiceList services={services ?? []} pillars={pillars ?? []} />
      </PageContainer>
    </>
  )
}
```

### Pattern 4: Profile Update Server Action

**What:** Server Action to update display_name, avatar_url, tagline, bio on the tenants table.
**When to use:** `/dashboard/profile/actions.ts`

```typescript
// src/app/dashboard/profile/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const display_name = String(formData.get('display_name') ?? '').trim()
  const tagline = String(formData.get('tagline') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const avatar_url = String(formData.get('avatar_url') ?? '').trim()

  const { error } = await supabase
    .from('tenants')
    .update({ display_name, tagline, bio, avatar_url })
    .eq('user_id', user.id)

  if (error) redirect(`/dashboard/profile?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/dashboard/profile')
  revalidatePath(`/dashboard`)
}
```

### Pattern 5: Public Catalog Page (Anon Server Component)

**What:** Server Component using anon Supabase client. Fetches tenant by slug, then fetches their services. Groups by pillar. Renders markdown descriptions. No session cookie required.
**When to use:** `src/app/[slug]/page.tsx` — replace the "Coming Soon" placeholder.

```typescript
// src/app/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import ReactMarkdown from 'react-markdown'
import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { ServicePillarSection } from '@/components/catalog/ServicePillarSection'

function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default async function PublicCatalogPage({ params }: { params: { slug: string } }) {
  const supabase = getAnonClient()

  // Fetch tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('user_id, display_name, slug, tagline, bio, avatar_url, email_verified, onboarding_complete')
    .eq('slug', params.slug)
    .single()

  if (!tenant) notFound()

  // Holding state: unverified email
  if (!tenant.email_verified) {
    return <HoldingState name={tenant.display_name} slug={tenant.slug} />
  }

  // Fetch services + pillar info
  const { data: services } = await supabase
    .from('gig_listings')
    .select('*, service_pillars(id, name, color, sort_order)')
    .eq('user_id', tenant.user_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Group by pillar
  const byPillar = groupByPillar(services ?? [])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <CatalogHeader tenant={tenant} />
        <div className="mt-10 space-y-12">
          {byPillar.map(({ pillar, services }) => (
            <ServicePillarSection key={pillar.id} pillar={pillar} services={services} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Pattern 6: Markdown Rendering on Public Catalog

**What:** Render stored markdown description using react-markdown with prose styling from @tailwindcss/typography.
**When to use:** `PublicServiceCard.tsx` description area.

```typescript
// src/components/catalog/PublicServiceCard.tsx
import ReactMarkdown from 'react-markdown'

export function PublicServiceCard({ service }: { service: ServiceWithPillar }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Thumbnail */}
      {service.thumbnail_url && (
        <div className="aspect-[16/9] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={service.thumbnail_url}
            alt={service.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4 sm:p-5">
        <h3 className="text-base font-semibold text-foreground leading-snug">
          {service.title}
        </h3>

        {/* Markdown description */}
        {service.description && (
          <div className="prose prose-sm prose-invert mt-3 max-w-none line-clamp-4">
            <ReactMarkdown>{service.description}</ReactMarkdown>
          </div>
        )}

        {/* Pricing tiers */}
        <PricingTierDisplay service={service} />
      </div>
    </div>
  )
}
```

### Pattern 7: Dashboard Sidebar Navigation (Three Sections)

**What:** Extend existing Sidebar.tsx navigation array to include Services, Profile, Settings sub-routes.
**When to use:** Update `src/components/layout/Sidebar.tsx`.

```typescript
// src/components/layout/Sidebar.tsx (navigation array update)
import { LayoutGrid, User, Settings } from 'lucide-react'

const navigation = [
  { name: 'Services', href: '/dashboard/services', icon: LayoutGrid },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]
```

### Pattern 8: Empty State Onboarding Checklist

**What:** When a user has no services and incomplete profile, show a checklist instead of an empty state.
**When to use:** `/dashboard/services/page.tsx` when `services.length === 0`.

```typescript
// src/components/gigs/ServiceList.tsx (empty state branch)
function OnboardingChecklist({ tenant }: { tenant: Tenant }) {
  const steps = [
    {
      id: 1,
      label: 'Complete your profile',
      done: Boolean(tenant.display_name && tenant.bio),
      href: '/dashboard/profile',
    },
    {
      id: 2,
      label: 'Add your first service',
      done: false,  // services.length > 0
      href: '/dashboard/services/new',
    },
    {
      id: 3,
      label: 'Share your catalog link',
      done: Boolean(tenant.email_verified),
      href: null,  // just display the URL
    },
  ]
  // Render as vertical checklist with icons
}
```

### Anti-Patterns to Avoid

- **Never use the authenticated server client for the public catalog route**: The public `[slug]` route must use the anon Supabase client (`createClient()` from `@supabase/supabase-js`), not `createClient()` from `@/lib/supabase/server`. The server client reads cookies and requires auth context; the anon client uses only the anon key. Mixing them causes the public route to fail when visited without a session.
- **Never filter services only by slug in the public query**: The slug lives on the `tenants` table, not `gig_listings`. The query must go: slug → tenants.user_id → gig_listings.user_id. Don't try to join or filter by slug directly on gig_listings.
- **Never render markdown with dangerouslySetInnerHTML without sanitization**: Use `react-markdown` which renders markdown safely. Never parse markdown to HTML string and inject it raw.
- **Never skip the `status = 'active'` filter on the public catalog**: Draft and archived services should not appear publicly. Always filter `gig_listings` by `status = 'active'` in the public catalog query.
- **Never put Server Action logic inside a Client Component file**: Server Actions (`'use server'`) must live in `actions.ts` files or be imported from Server Component files. A Client Component (`'use client'`) cannot define Server Actions inline.
- **Never include the platform_id field in the user-facing service creation form**: The `platform_id` column is a legacy field from the original single-user gig management design. Phase 2 services are platform-agnostic (they appear on the public catalog, not tied to Fiverr/Upwork). Use a default or sentinel value for platform_id on new services created via the dashboard. Do NOT expose this field to the user.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown rendering | Custom regex parser or dangerouslySetInnerHTML | `react-markdown` | XSS risk, edge cases in markdown spec, handles all CommonMark syntax |
| Markdown prose styling | Custom CSS for markdown output | `@tailwindcss/typography` prose class | Already installed; handles all heading/paragraph/list/code block styles consistently |
| Form validation | Custom validation functions | `zod` + `react-hook-form` + `@hookform/resolvers` | Already in stack; gigSchema already exists as a starting point |
| Pricing tier UI | New component from scratch | Extend existing `PricingTierEditor.tsx` | Full Basic/Standard/Premium editor already implemented and styled |
| Service card UI (dashboard) | New card from scratch | Extend existing `GigCard.tsx` | Card with pillar accent, pricing grid, dropdown menu already built |
| Delete confirmation | Browser `confirm()` dialog | Existing `ConfirmDialog.tsx` component | accessible modal already implemented in `src/components/shared/` |
| Empty state | Inline div placeholder | Existing `EmptyState.tsx` component | icon + title + description + action button component already built |
| Sidebar navigation | New navigation structure | Extend existing `Sidebar.tsx` navigation array | Collapsible sidebar with active state tracking already works |
| Supabase query caching | Custom fetch cache | Next.js `revalidatePath()` after mutations | Server Actions + revalidatePath is the correct App Router data invalidation pattern |
| Image upload | Custom file upload handler | URL paste in Phase 2; Supabase Storage in Phase 3 | Supabase Storage requires bucket setup, signed URLs for public access, and upload progress handling — out of scope for Phase 2 |

**Key insight:** The codebase already has 80% of the UI components needed. The research phase uncovered that no new UI libraries beyond `react-markdown` are needed. The primary work is wiring existing components to real data and writing Server Actions.

---

## Common Pitfalls

### Pitfall 1: Forgetting `revalidatePath` After Mutations
**What goes wrong:** After createService / updateService / deleteService Server Actions complete, the dashboard services list shows stale data (the old list before the change).
**Why it happens:** Next.js App Router caches Server Component renders. A mutation does not automatically invalidate the cache.
**How to avoid:** Call `revalidatePath('/dashboard/services')` inside every Server Action that mutates gig_listings data. Also call `revalidatePath('/${tenant.slug}')` if the catalog page caches service data (or use `revalidatePath('/', 'layout')` to invalidate all).
**Warning signs:** Refreshing the page shows the updated data but the page right after mutation shows the old data.

### Pitfall 2: platform_id NOT NULL Constraint on Service Creation
**What goes wrong:** Creating a service fails with a database constraint error because `platform_id` on `gig_listings` is `NOT NULL REFERENCES platforms(id)`.
**Why it happens:** Migration 003 defines `platform_id UUID NOT NULL REFERENCES platforms(id)`. The new user-facing service creation form does not expose platform_id (services in Phase 2 are platform-agnostic).
**How to avoid:** Two options: (a) migration 018 makes `platform_id` nullable (`ALTER TABLE gig_listings ALTER COLUMN platform_id DROP NOT NULL`) — PREFERRED for cleanliness, or (b) assign a sentinel "direct/catalog" platform_id on insert. Option (a) is correct because Phase 2 services are not platform-bound. Add this to migration 018.
**Warning signs:** `null value in column "platform_id" violates not-null constraint` error on service creation.

### Pitfall 3: Public Catalog Sees No Services Due to Missing Anon RLS Policy
**What goes wrong:** The public `[slug]` page fetches services but gets an empty array even when services exist. No error is thrown — Supabase RLS silently returns empty results for unauthorized queries.
**Why it happens:** Migration 017 set `gig_listings` policies for `authenticated` role only. The anon role has no SELECT policy and cannot see any rows.
**How to avoid:** Migration 018 must create the anon SELECT policy before any public catalog testing. The policy condition must match verified tenants: `user_id IN (SELECT user_id FROM tenants WHERE slug IS NOT NULL AND onboarding_complete = true AND email_verified = true)`.
**Warning signs:** `[slug]` page renders with CatalogHeader but no service sections; Supabase logs show no error for the gig_listings query.

### Pitfall 4: Mixing Authenticated and Anon Clients on the Public Route
**What goes wrong:** The public `[slug]` page accidentally uses `@/lib/supabase/server` (which reads cookies) instead of the bare anon client. When visited without a session cookie, it throws or returns empty results.
**Why it happens:** Both client files export `createClient`. Import confusion between `@/lib/supabase/server` and `@supabase/supabase-js`.
**How to avoid:** The `[slug]/page.tsx` already demonstrates the correct pattern (using `createClient` directly from `@supabase/supabase-js`). Do not change this import. Document the distinction explicitly in the file with a comment.
**Warning signs:** Public catalog works when logged in but shows 0 services when logged out; or throws a cookies() error.

### Pitfall 5: Markdown Description XSS via URL Thumbnail
**What goes wrong:** A malicious service description containing `![img](javascript:alert(1))` or similar is rendered via `dangerouslySetInnerHTML`, executing arbitrary scripts.
**Why it happens:** Rolling a custom markdown renderer using `innerHTML`.
**How to avoid:** Use `react-markdown` exclusively. It renders markdown to React elements (not HTML strings) and does not support `dangerouslySetInnerHTML`. By default, react-markdown does not render raw HTML (`<script>` tags, etc.) — this is the secure default.
**Warning signs:** Any code path that assigns markdown-derived content to `innerHTML` or `dangerouslySetInnerHTML`.

### Pitfall 6: Mobile Catalog Breaks on Pricing Tier Display
**What goes wrong:** The three-column pricing tier grid (Basic/Standard/Premium) causes horizontal scroll on narrow viewports (< 375px), violating CATL-05.
**Why it happens:** `grid-cols-3` with fixed minimum column widths overflows on small screens.
**How to avoid:** Use `grid-cols-1 sm:grid-cols-3` for the public pricing tier display. On mobile, tiers stack vertically. Test at 375px viewport width (iPhone SE). Alternatively, condense to a single "Starting at $X" on mobile with tier details expandable — but stacking is simpler and passes the requirement.
**Warning signs:** Horizontal scrollbar appears on the public catalog at 375px viewport width.

### Pitfall 7: Status Filter Missing on Public Catalog — Draft Services Exposed
**What goes wrong:** A freelancer creates a service in draft status to prepare it, and it appears immediately on their public catalog page.
**Why it happens:** The anon query on gig_listings does not filter by `status`.
**How to avoid:** Always add `.eq('status', 'active')` to the public catalog service query. Add a test: create a draft service, verify it does not appear at the slug URL.
**Warning signs:** Draft or archived services appear on the public catalog.

### Pitfall 8: bio Field Missing on Tenants — Profile Save Fails Silently
**What goes wrong:** The profile form submits successfully (no error), but bio is never saved because the `bio` column does not exist on the tenants table.
**Why it happens:** Migration 018 (adding `bio` column) has not been run, but the profile form was built and deployed first.
**How to avoid:** Migration 018 is the first task in Phase 2. Do not build profile UI until migration 018 is confirmed applied. Verify with `SELECT column_name FROM information_schema.columns WHERE table_name = 'tenants'`.
**Warning signs:** Bio shows empty on reload even after saving. No Supabase error (Supabase ignores unknown columns in `.update()` payloads).

---

## Code Examples

Verified patterns from the existing codebase and established Next.js + Supabase conventions:

### Fetch Services for Dashboard (Server Component)
```typescript
// Established pattern from src/app/dashboard/page.tsx
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

const { data: services, error } = await supabase
  .from('gig_listings')
  .select('*, service_pillars(name, color), platforms(name)')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

### Fetch Tenant Profile for Public Catalog (Anon Client)
```typescript
// Established pattern from src/app/[slug]/page.tsx
const supabase = getAnonClient()  // createClient from @supabase/supabase-js

const { data: tenant } = await supabase
  .from('tenants')
  .select('user_id, display_name, slug, tagline, bio, avatar_url, email_verified')
  .eq('slug', params.slug)
  .single()

// Then fetch services:
const { data: services } = await supabase
  .from('gig_listings')
  .select('*, service_pillars(id, name, color, sort_order)')
  .eq('user_id', tenant.user_id)
  .eq('status', 'active')
  .order('created_at', { ascending: false })
```

### Service Pillar Grouping Utility
```typescript
// Group services by pillar for the public catalog (pure TypeScript)
function groupByPillar(services: ServiceWithPillar[]) {
  const pillarMap = new Map<string, { pillar: Pillar; services: ServiceWithPillar[] }>()

  for (const service of services) {
    const pillar = service.service_pillars
    if (!pillar) continue
    if (!pillarMap.has(pillar.id)) {
      pillarMap.set(pillar.id, { pillar, services: [] })
    }
    pillarMap.get(pillar.id)!.services.push(service)
  }

  // Sort pillar groups by sort_order
  return Array.from(pillarMap.values()).sort(
    (a, b) => (a.pillar.sort_order ?? 0) - (b.pillar.sort_order ?? 0)
  )
}
```

### react-markdown with Prose Styling
```typescript
// Source: react-markdown README + @tailwindcss/typography docs
// Prose class from the installed typography plugin; prose-invert for dark mode
import ReactMarkdown from 'react-markdown'

<div className="prose prose-sm prose-invert max-w-none">
  <ReactMarkdown>{service.description}</ReactMarkdown>
</div>
```

### revalidatePath After Mutation
```typescript
// Source: Next.js App Router docs — cache invalidation after Server Action
'use server'
import { revalidatePath } from 'next/cache'

export async function deleteService(id: string) {
  // ... delete from supabase ...
  revalidatePath('/dashboard/services')  // invalidate dashboard list
  redirect('/dashboard/services')
}
```

### Thumbnail URL Input Pattern (GigForm Extension)
```typescript
// Add to GigForm.tsx in the basic information section
<div className="space-y-1.5">
  <Label htmlFor="thumbnail_url">Thumbnail Image</Label>
  <Input
    id="thumbnail_url"
    type="url"
    placeholder="https://example.com/image.png"
    {...register('thumbnail_url')}
  />
  <p className="text-xs text-muted-foreground">
    Paste an image URL. Supports JPG, PNG, WebP.
  </p>
  {/* Live preview if URL is populated */}
  {watch('thumbnail_url') && !errors.thumbnail_url && (
    <div className="mt-2 aspect-[16/9] w-full max-w-xs overflow-hidden rounded-md border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={watch('thumbnail_url')}
        alt="Thumbnail preview"
        className="h-full w-full object-cover"
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
    </div>
  )}
</div>
```

---

## Claude's Discretion Recommendations

These are areas explicitly left to Claude's judgment in CONTEXT.md. Research-backed recommendations:

### Pricing Model: Support "Contact for Pricing" (Quote-Based)
**Recommendation:** Add a `contact_for_pricing BOOLEAN DEFAULT false` column (in migration 018) and an "is contact for pricing" toggle in the service form. When true, all pricing tier fields are hidden and the public catalog shows "Contact for pricing" with a mailto CTA. This is compatible with Phase 3 payment flows — when Phase 3 adds payment integration, services with `contact_for_pricing = false` and a defined price get a "Book Now" button; contact-for-pricing services get a "Get a Quote" form.
**Why:** Freelancers with project-based or enterprise services routinely need this. Fiverr and Upwork both support it. Not supporting it forces all Phase 2 services to have a fixed price, which excludes consulting/retainer offerings.

### Dashboard Services List: Card Grid
**Recommendation:** Use the existing `GigCard.tsx` card grid pattern (2 columns on desktop, 1 on mobile). The GigCard already has the pillar color accent, pricing grid, status badge, and action dropdown. A table would require building a new component. The card grid is the established pattern in this codebase.
**Caveat:** If a user has 30+ services, a table with pagination might be needed (Phase 4). For Phase 2, card grid is correct.

### Public Catalog Catalog Link Surface: In Dashboard Header + Empty State
**Recommendation:** Surface the public catalog URL in two places: (1) A clickable link in the dashboard header area showing `yoursite.com/{slug}` with an external link icon, and (2) in the empty state onboarding checklist step 3. Do not add a persistent banner — it becomes noise once the freelancer has seen it.

### Public Catalog Organization: Grouped by Pillar
**Recommendation:** Group services by pillar (matching the existing static catalog at gig-engine.vercel.app). This matches the established visual pattern users already know and is consistent with how the strategy matrix is organized. Flat grid with filters is more complex to build and provides diminishing value when a typical freelancer has 5-15 services.

### Catalog Header: Avatar + Name + Tagline; Bio as Collapsible
**Recommendation:** Show avatar, display name, and tagline in the main catalog header. Render bio below the tagline as a short markdown block, limited to 3 lines with a "Read more" expand on mobile. On desktop, show full bio (typically short). This balances information density with mobile usability.

### Public Service Card Pricing: All Tiers Visible
**Recommendation:** Show all defined pricing tiers inline on each service card (Basic/Standard/Premium). This matches the existing static catalog and the `PricingTierEditor` preview pattern. "Starting at $X" is less informative and makes comparison harder. Show only defined tiers (omit undefined ones).

### Public Catalog Interactivity: View-Only + "Contact" CTA
**Recommendation:** Services with fixed pricing show a "Get in Touch" button (mailto: link to the tenant's email, or a simple URL to the freelancer's Fiverr/Upwork listing). Services with `contact_for_pricing = true` show "Request a Quote" (same mailto pattern). No booking flow until Phase 3. The mailto pattern requires zero backend work and unblocks the basic use case of sharing the catalog with prospects.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next/router` with pages/ | `next/navigation` with app/ | Next.js 13+ | All navigation uses `useRouter`, `redirect`, `revalidatePath` from `next/navigation` |
| API routes for CRUD | Server Actions with `'use server'` | Next.js 13.4+ | No separate API endpoint needed; form actions call server functions directly |
| `react-markdown` v6 with unified plugins | `react-markdown` v9 (current) | 2024 | v9 is ESM-only; import as `import ReactMarkdown from 'react-markdown'` (default import) |
| Client-side data fetching with useEffect | Server Component data fetching | Next.js 13+ | No useEffect for initial data load; fetch in the Server Component body |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023-2024 | (From Phase 1 research) auth-helpers deprecated; already using SSR package |

**Deprecated/outdated:**
- `react-markdown` v6/v7: Used named exports and CJS; current v9 is ESM default export. `import { ReactMarkdown }` will fail — use `import ReactMarkdown from 'react-markdown'`.
- API route handlers for simple CRUD: Server Actions are the recommended pattern in Next.js 14 App Router.

---

## Open Questions

1. **platform_id nullable vs sentinel value on new services**
   - What we know: `gig_listings.platform_id` is currently `NOT NULL`. Phase 2 services from the dashboard are not platform-specific.
   - What's unclear: Should migration 018 drop the NOT NULL constraint, or should a "catalog/direct" platform record be used as a sentinel?
   - Recommendation: Drop NOT NULL in migration 018 (`ALTER TABLE gig_listings ALTER COLUMN platform_id DROP NOT NULL`). This is cleaner. Existing rows retain their platform_id. New rows from the dashboard have `NULL`, indicating "direct/catalog" origin. Phase 5 (gig import) can set platform_id when importing from Fiverr/Upwork.

2. **Supabase Storage for avatar uploads vs URL-only**
   - What we know: Phase 2 locked decision supports both upload and URL paste for thumbnails. Avatar in onboarding is URL-only.
   - What's unclear: The CONTEXT.md says thumbnails support "both image upload and URL paste." This requires Supabase Storage bucket setup if upload is literal file upload.
   - Recommendation: For Phase 2, implement URL paste only for both thumbnails and avatar. The UX copy says "paste an image URL or upload" — implement only the URL paste path in Phase 2. Add a note in settings that file upload is coming. Supabase Storage configuration (bucket policies, signed URLs for public access) adds 2-3 tasks of complexity that are better phased. The thumbnail URL from an existing CDN/image host is sufficient for the MVP.
   - Flag for planner: If the decision is to implement actual file upload in Phase 2, budget 2 additional tasks: (a) create Supabase Storage bucket with public policy, (b) implement client-side file input + upload handler.

3. **gig_listings.status filtering on dashboard view**
   - What we know: `GigStatus` has four values: `draft`, `active`, `paused`, `archived`. The dashboard shows all of the user's services.
   - What's unclear: Should the dashboard services list show all statuses (including archived) or filter by default?
   - Recommendation: Show all non-archived services by default (filter `status != 'archived'`). Add an "Archived" count or toggle for seeing archived services. This prevents clutter while preserving data. Archived services do not appear on the public catalog.

4. **Slug change in Settings — active catalog URL changes**
   - What we know: Settings section includes slug editing (CONTEXT.md: "account-level config (slug, email, etc.)"). The slug is the public URL identifier.
   - What's unclear: Changing the slug breaks any existing links to the old URL. Should there be a redirect from old slug to new, or just a warning?
   - Recommendation: Add a prominent warning in the Settings section: "Changing your slug will break existing links to your catalog." No redirect for Phase 2 (the old slug is just unresolvable). Phase 4/5 can add slug history + redirects if needed.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase inspection: `src/app/[slug]/page.tsx`, `src/app/dashboard/`, `src/components/gigs/`, `src/components/shared/`, `src/lib/supabase/`, all 17 migration files, `package.json`, `tailwind.config.ts` — directly read and analyzed
- Phase 1 `01-RESEARCH.md` — established patterns for Server Actions, RLS, anon client, revalidatePath
- Next.js App Router docs patterns (established in codebase): Server Components, Server Actions, `revalidatePath`, `redirect`

### Secondary (MEDIUM confidence)
- react-markdown v9 README: `https://github.com/remarkjs/react-markdown` — import pattern (default import), ESM-only status, safe rendering by default
- @tailwindcss/typography prose classes: verified installed in `tailwind.config.ts` plugins array; `prose-invert` for dark mode per typography plugin docs
- Supabase RLS anon policy pattern: verified against migration 015 existing policy for tenants table ("Public can read tenant by slug") — same pattern applied to gig_listings

### Tertiary (LOW confidence)
- react-markdown v9 ESM-only behavior in Next.js 14 build — single source (community reports); Next.js handles ESM modules natively in App Router so this should not be an issue, but worth verifying after `npm install react-markdown` with a test import
- "Contact for pricing" toggle pattern compatibility with Phase 3 payments — informed inference from codebase patterns, not tested against Phase 3 spec

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json; only react-markdown is new
- Architecture: HIGH — patterns verified directly against existing codebase files (migrations, components, pages)
- Schema gaps (bio, thumbnail_url, platform_id nullability): HIGH — verified by reading all migration files and type definitions; these columns definitively do not exist
- Pitfalls: HIGH — derived from direct codebase analysis (e.g., platform_id NOT NULL constraint read from migration 003)
- Claude's Discretion recommendations: MEDIUM — reasoned from codebase patterns and UX principles; not validated against user feedback

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable APIs; react-markdown v9 behavior in Next.js 14 should be validated immediately on install)

# Phase 1: Multi-Tenant Foundation - Research

**Researched:** 2026-02-17
**Domain:** Supabase Auth + RLS + Next.js App Router middleware
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Signup Flow & Slug Assignment
- After signup, user lands in a **single-page onboarding wizard** (not multi-step)
- Onboarding collects: display name (required), slug confirmation (required), avatar upload (optional), tagline/bio (optional)
- Name + slug are required before accessing dashboard; avatar and tagline are skippable
- Slug is **auto-generated from full name** (e.g. "Alex Hale" → /alexhale)
- Slug field shows a **live URL preview** (e.g. gig-engine.vercel.app/alexhale) updating as user edits
- If slug is taken, **append incrementing numbers** automatically (alexhale → alexhale1 → alexhale2) — user can still edit
- **Email verification is NOT required** to use the dashboard, but IS required before the public catalog page goes live
- Unverified users see a banner prompting verification; their /{slug} page returns a holding state until verified

#### Auth Session Behavior
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up with email and password via Supabase Auth | Supabase `signUp()` with `@supabase/ssr` pattern documented; server action + form pattern identified |
| AUTH-02 | User can log in and stay logged in across browser refresh | Cookie-based session via `@supabase/ssr` createServerClient; middleware refresh pattern identified |
| AUTH-03 | User can log out from any page | `supabase.auth.signOut()` server action with redirect to /login; documented pattern |
| AUTH-04 | Tenant record created on signup with unique slug (e.g. /alexhale) | PostgreSQL trigger `on_auth_user_created` creates tenant row; slug generation + uniqueness via DB UNIQUE constraint |
| AUTH-05 | Multi-tenant data isolation via Supabase RLS (user_id on all tables) | RLS policy pattern `USING ((select auth.uid()) = user_id)`; migration strategy for 14 existing tables documented |
</phase_requirements>

---

## Summary

This phase converts Gig-Engine from a single-user tool to a multi-tenant SaaS foundation. The codebase already has `@supabase/ssr` installed (v0.8.0) and client/server Supabase utilities in `src/lib/supabase/`. The existing 11 tables all have permissive `USING(true)` RLS policies that must be replaced with per-user isolation policies after adding a `user_id UUID REFERENCES auth.users` column to each table. The 14th migration (`014_enable_rls.sql`) is the starting point for the override.

The authentication layer uses the `@supabase/ssr` middleware pattern: a `middleware.ts` that calls an `updateSession` helper which refreshes the JWT on every request and syncs cookies. After signup, the flow is: `signUp()` → redirect to `/onboarding` → collect display name + slug → write to a new `tenants` table → set `user_metadata.onboarding_complete = true` → redirect to `/dashboard`. The middleware checks this flag (from the JWT, not a DB query) to intercept incomplete-onboarding users. Protected routes check `supabase.auth.getUser()` server-side.

The Gig Monitor and morning report scripts do NOT use Supabase at all — they read from `~/.gig-engine/fiverr-auth.json` and write to local JSON files. Script compatibility is not a concern. The seeded reference data (platforms, service pillars) needs `user_id` assigned during migration; a migration script should attribute it to the first admin user or use a shared `service_user_id`.

**Primary recommendation:** Install middleware.ts at `src/middleware.ts`, implement the `updateSession` helper in `src/lib/supabase/middleware.ts`, create a `tenants` table with a DB trigger for auto-creation, and run a migration that adds `user_id` to all 11 existing tables and replaces permissive policies with `auth.uid() = user_id` policies.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/ssr | 0.8.0 (already installed) | Cookie-based session management for Next.js SSR | Official Supabase package for App Router; replaces deprecated `@supabase/auth-helpers-nextjs` |
| @supabase/supabase-js | 2.95.3 (already installed) | Supabase client, auth methods | Core SDK; `getClaims()` available for fast JWT verification in middleware |
| next | 14.2.35 (already installed) | App Router, Server Actions, middleware | Already in stack; Server Actions handle auth forms natively |
| react-hook-form | 7.71.1 (already installed) | Onboarding form state + validation | Already in stack; handles live slug preview debouncing cleanly |
| zod | 4.3.6 (already installed) | Schema validation for onboarding form | Already in stack; pairs with react-hook-form resolver |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Built-in `@hookform/resolvers` | 5.2.2 (already installed) | Connects Zod schemas to react-hook-form | Slug + display name validation on onboarding form |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Auth trigger for tenant creation | Application-level creation in signup server action | Trigger is more reliable (atomic with user creation, survives network errors); server action approach risks orphaned auth users |
| user_metadata flag for onboarding check in middleware | DB query in middleware | DB query in middleware adds 20-50ms latency on every request; user_metadata is in the JWT and is free |
| Cookie-based sessions (recommended) | localStorage | Cookies work with SSR; localStorage is inaccessible in Server Components |

**Installation:** No new packages required. All needed packages are already in `package.json`.

---

## Architecture Patterns

### Recommended Project Structure (additions for this phase)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   ├── page.tsx          # Login form
│   │   │   └── actions.ts        # Server actions: login, signup
│   │   ├── signup/
│   │   │   └── page.tsx          # Signup form (email + password)
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts      # Auth code exchange (email confirm links)
│   ├── onboarding/
│   │   ├── page.tsx              # Single-page wizard: name + slug + optional fields
│   │   └── actions.ts            # Server action: complete onboarding
│   └── dashboard/
│       └── (protected)           # Auth guard applied via middleware
├── lib/
│   └── supabase/
│       ├── client.ts             # Browser client (already exists)
│       ├── server.ts             # Server client (already exists)
│       └── middleware.ts         # NEW: updateSession helper
└── middleware.ts                 # NEW: route-level auth + onboarding guard
supabase/
└── migrations/
    ├── 015_create_tenants.sql    # NEW: tenants table + slug uniqueness
    ├── 016_add_user_id_columns.sql  # NEW: user_id on all 11 tables
    └── 017_replace_rls_policies.sql # NEW: drop USING(true), add user_id policies
```

### Pattern 1: Middleware Session Refresh (updateSession)

**What:** Every request goes through middleware which calls `supabase.auth.getUser()` to refresh the JWT and sync the session cookie. Protected routes redirect unauthenticated users.
**When to use:** All routes — the matcher excludes only static assets.

```typescript
// Source: https://www.ryankatayi.com/blog/server-side-auth-in-next-js-with-supabase-my-setup
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add try/catch. Let errors surface.
  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = request.nextUrl.pathname.startsWith('/dashboard')
  const isOnboarding = request.nextUrl.pathname.startsWith('/onboarding')
  const isAuthRoute = ['/login', '/signup'].includes(request.nextUrl.pathname)

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('message', 'Please log in to continue')
    return NextResponse.redirect(url)
  }

  // Intercept authenticated users who haven't completed onboarding
  if (user && !isOnboarding && !isAuthRoute) {
    const onboardingComplete = user.user_metadata?.onboarding_complete
    if (!onboardingComplete && isProtected) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Redirect logged-in users away from auth pages
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}
```

```typescript
// src/middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 2: Server Action Auth (login/signup/logout)

**What:** Next.js Server Actions with `'use server'` directive handle form submissions; they call Supabase auth methods and redirect.
**When to use:** All auth form submissions — avoids client-side token exposure.

```typescript
// Source: https://www.ryankatayi.com/blog/server-side-auth-in-next-js-with-supabase-my-setup
// src/app/(auth)/login/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email')),
    password: String(formData.get('password')),
  })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: String(formData.get('email')),
    password: String(formData.get('password')),
    options: {
      data: { onboarding_complete: false },
    },
  })
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  redirect('/onboarding')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

### Pattern 3: Tenant Auto-Creation via DB Trigger

**What:** A PostgreSQL trigger fires immediately after `auth.users` insert, creating the tenant record in the same transaction.
**When to use:** Tenant creation — ensures no orphaned auth users without a tenant row.

```sql
-- Source: https://supabase.com/docs/guides/auth/managing-user-data
-- supabase/migrations/015_create_tenants.sql

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  slug TEXT UNIQUE,
  tagline TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  email_verified BOOLEAN DEFAULT false,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_user_id ON tenants(user_id);

-- Trigger: create tenant row on every new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.tenants (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS for tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own tenant" ON tenants
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own tenant" ON tenants
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
-- No INSERT policy needed — trigger handles insertion as service role
```

### Pattern 4: Slug Generation and Uniqueness

**What:** Display name → slug via slugify logic. Check uniqueness against DB, increment suffix if taken.
**When to use:** Onboarding wizard, `slug` field.

```typescript
// src/lib/utils/slug.ts (NEW FILE)
export function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '')  // remove non-alphanumeric
    .slice(0, 30)  // max length
}

// Server action: check uniqueness and find available slug
export async function findAvailableSlug(baseSlug: string): Promise<string> {
  const supabase = await createClient()

  let slug = baseSlug
  let attempt = 0

  while (attempt < 20) {
    const { data } = await supabase
      .from('tenants')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle()

    if (!data) return slug  // slug is available
    attempt++
    slug = `${baseSlug}${attempt}`
  }

  throw new Error('Could not find available slug after 20 attempts')
}
```

### Pattern 5: Onboarding Completion Server Action

**What:** On onboarding form submit, write to `tenants` table and set `user_metadata.onboarding_complete = true` so middleware sees it in subsequent JWT.
**When to use:** Onboarding wizard form submission.

```typescript
// src/app/onboarding/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { findAvailableSlug } from '@/lib/utils/slug'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const displayName = String(formData.get('display_name'))
  const rawSlug = String(formData.get('slug'))

  // Update tenant record (created by trigger)
  const { error: tenantError } = await supabase
    .from('tenants')
    .update({
      display_name: displayName,
      slug: rawSlug,
      tagline: String(formData.get('tagline') ?? ''),
      avatar_url: String(formData.get('avatar_url') ?? ''),
      onboarding_complete: true,
    })
    .eq('user_id', user.id)

  if (tenantError) {
    if (tenantError.code === '23505') {
      // Unique violation on slug — re-render with error
      redirect(`/onboarding?error=slug_taken`)
    }
    redirect(`/onboarding?error=${encodeURIComponent(tenantError.message)}`)
  }

  // Update user_metadata so middleware sees onboarding_complete without DB query
  await supabase.auth.updateUser({
    data: { onboarding_complete: true },
  })

  redirect('/dashboard')
}
```

### Pattern 6: Multi-Tenant RLS Migration

**What:** Add `user_id` to all 11 existing tables, drop permissive policies, create user-scoped policies.
**When to use:** Migration 016 and 017.

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
-- supabase/migrations/016_add_user_id_columns.sql

-- Step 1: Add user_id as nullable (allow existing rows)
ALTER TABLE platforms ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE service_pillars ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE gig_listings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE opportunities ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE proposal_templates ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE portfolio_items ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE revenue_entries ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE daily_metrics ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE content_blocks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE gig_versions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Index all user_id columns for RLS performance
CREATE INDEX idx_platforms_user_id ON platforms(user_id);
CREATE INDEX idx_service_pillars_user_id ON service_pillars(user_id);
CREATE INDEX idx_gig_listings_user_id ON gig_listings(user_id);
CREATE INDEX idx_opportunities_user_id ON opportunities(user_id);
CREATE INDEX idx_proposal_templates_user_id ON proposal_templates(user_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_portfolio_items_user_id ON portfolio_items(user_id);
CREATE INDEX idx_revenue_entries_user_id ON revenue_entries(user_id);
CREATE INDEX idx_daily_metrics_user_id ON daily_metrics(user_id);
CREATE INDEX idx_content_blocks_user_id ON content_blocks(user_id);
CREATE INDEX idx_gig_versions_user_id ON gig_versions(user_id);

-- NOTE: Step 3 (UPDATE existing rows to assign user_id) must be done MANUALLY
-- in the migration via a parameterized value or post-deploy admin script.
-- See Open Questions section.
```

```sql
-- supabase/migrations/017_replace_rls_policies.sql

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON platforms;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON service_pillars;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON gig_listings;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON opportunities;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON proposal_templates;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON projects;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON portfolio_items;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON revenue_entries;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON daily_metrics;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON content_blocks;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON gig_versions;

-- Create user-scoped policies (wrapping auth.uid() in SELECT for performance)
-- Pattern applied to all 11 tables:
CREATE POLICY "Users can CRUD own rows" ON platforms
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- [Repeat identical pattern for all other 10 tables]
-- service_pillars, gig_listings, opportunities, proposal_templates,
-- projects, portfolio_items, revenue_entries, daily_metrics,
-- content_blocks, gig_versions
```

### Pattern 7: Protected Server Page (per-page auth check)

**What:** Server Component reads user from Supabase; redirects to login if none.
**When to use:** Dashboard and sub-pages as a belt-and-suspenders backstop for middleware.

```typescript
// Source: https://www.ryankatayi.com/blog/server-side-auth-in-next-js-with-supabase-my-setup
// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login?message=Please+log+in+to+continue')
  }

  // User is authenticated — render dashboard
  return <div>Dashboard for {user.email}</div>
}
```

### Anti-Patterns to Avoid

- **Never use `getSession()` for page protection**: `getSession()` reads from cookies without server validation and can be spoofed. Always use `getUser()` which makes a live auth server call.
- **Never use `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`**: The `NEXT_PUBLIC_` prefix exposes env vars to the browser bundle. Service role key must stay server-only as `SUPABASE_SERVICE_ROLE_KEY`.
- **Never add DB query to middleware for onboarding check**: Middleware runs on every request. A DB query adds 20-50ms per request. Use `user.user_metadata.onboarding_complete` from the JWT instead.
- **Never run `ALTER TABLE ... ADD COLUMN user_id NOT NULL` immediately**: Existing rows have no user_id value, making NOT NULL constraint fail. Add nullable first, backfill, then add NOT NULL if needed (or leave nullable, RLS enforces access anyway).
- **Never rely on middleware alone for route protection**: Middleware can be bypassed by direct fetch. Always add `getUser()` check inside protected server pages as well.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session cookie management | Custom cookie serialization | `@supabase/ssr` createServerClient with cookies handlers | SameSite, Secure, HttpOnly flags, refresh token rotation — dozens of edge cases |
| Auth token refresh on SSR | Custom token refresh logic | `updateSession` helper calling `supabase.auth.getUser()` in middleware | Supabase handles PKCE flow, token rotation, and cookie sync |
| Slug uniqueness | Manual retry loop in UI | DB UNIQUE constraint + error code `23505` catch | DB constraint is atomic; UI loop has race conditions between check and write |
| Tenant auto-creation | Application-level insert in signup action | PostgreSQL trigger `on_auth_user_created` | Trigger is atomic with user creation; app-level insert can fail silently |
| Email verification gate | Custom `is_verified` column | `auth.users.email_confirmed_at IS NOT NULL` check | Supabase manages this field; duplicating it creates sync drift |

**Key insight:** Supabase's SSR package handles the hardest parts of Next.js auth (cookie sync, token refresh in middleware, PKCE). The only custom code needed is routing logic.

---

## Common Pitfalls

### Pitfall 1: getSession() Used for Page Protection
**What goes wrong:** `getSession()` returns cached cookie data that can be tampered with by the client. Protected pages become bypassable.
**Why it happens:** `getSession()` feels like the obvious call; old tutorials use it.
**How to avoid:** Always use `supabase.auth.getUser()` in Server Components and middleware. It validates with the Supabase Auth server every time.
**Warning signs:** Any existing code calling `supabase.auth.getSession()` in server context.

### Pitfall 2: Trigger Fails and Blocks Signup
**What goes wrong:** If the `handle_new_user()` trigger throws an uncaught error, the entire `INSERT INTO auth.users` transaction rolls back — the user sees a generic signup error.
**Why it happens:** Referential integrity failures, missing table columns, or bad SQL in the function body.
**How to avoid:** Test trigger locally with Supabase CLI before deploying. Add error handling inside the trigger function. Test with `supabase db reset` after each migration.
**Warning signs:** Signup endpoint returning 500 after adding the trigger migration.

### Pitfall 3: USING(true) Policies Left in Place
**What goes wrong:** The existing permissive policies (`USING(true)`) mean any authenticated user can read all other users' data. After adding `user_id` columns, the policies still allow cross-tenant reads until replaced.
**Why it happens:** Adding user_id columns (migration 016) and replacing policies (migration 017) are separate migrations. If 017 doesn't run, isolation is not enforced.
**How to avoid:** Treat migration 017 as a single atomic step with 016. Add a cross-tenant isolation test that runs immediately after migration.
**Warning signs:** Integration test with two users can read each other's rows.

### Pitfall 4: onboarding_complete in Middleware Stale After Update
**What goes wrong:** After `completeOnboarding` runs and calls `supabase.auth.updateUser({ data: { onboarding_complete: true } })`, the middleware still sees the old JWT (which has `onboarding_complete: false`) until the next token refresh.
**Why it happens:** JWT is cached. `updateUser` changes the data on the server but the client still has the old access token until it refreshes (default 1 hour).
**How to avoid:** After calling `supabase.auth.updateUser()` in the server action, call `supabase.auth.refreshSession()` to force-issue a new token with updated claims, then redirect. Alternatively, middleware can also check `tenants.onboarding_complete` for the `/onboarding` completion redirect specifically (only one DB call, on the redirect target page, not all requests).
**Warning signs:** User is redirected back to `/onboarding` after completing it.

### Pitfall 5: Slug Race Condition
**What goes wrong:** Two users simultaneously pick the same slug. The uniqueness check passes for both, then both writes succeed but one overwrites the slug (if not constrained at DB level).
**Why it happens:** Check-then-act in application code is not atomic.
**How to avoid:** Enforce uniqueness at DB level with `UNIQUE` constraint on `tenants.slug`. Catch `error.code === '23505'` (Postgres unique violation) and re-render the form with an error. Do not rely solely on application-level uniqueness checks.
**Warning signs:** Two test users with the same slug existing in the tenants table.

### Pitfall 6: service_role Key Leaked via NEXT_PUBLIC_ Prefix
**What goes wrong:** If `SUPABASE_SERVICE_ROLE_KEY` is accidentally renamed to `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, it's embedded in the browser bundle — effectively making all RLS bypassable by any visitor.
**Why it happens:** Copy-paste from examples that use NEXT_PUBLIC_ prefix for anon key.
**How to avoid:** Add a CI lint check. In `eslint.config.*`, add a rule that catches string literals containing `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SERVICE_ROLE`. Alternatively, add a shell check to CI: `grep -r "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE" .env* && exit 1`.
**Warning signs:** Supabase anon key and service role key look different — anon key is safe in NEXT_PUBLIC_, service role is not.

### Pitfall 7: Existing Seeded Data Has No user_id
**What goes wrong:** After migration 016 adds `user_id` columns and migration 017 replaces policies with `user_id = auth.uid()`, the existing seeded rows (platforms, service_pillars) have `user_id = NULL`. All queries return empty results even for authenticated users.
**Why it happens:** The seed data in migration 012 pre-dates multi-tenancy.
**How to avoid:** Migration 016 must include an `UPDATE` statement that assigns the existing rows to a specific user_id. Since there's currently one real user (Alex), the migration script should either: (a) accept a variable and be run with the admin user's UUID, or (b) leave it for a post-deploy manual step. See Open Questions.
**Warning signs:** Dashboard shows no data after migration even when logged in.

---

## Code Examples

Verified patterns from official and verified sources:

### RLS Policy with Cached auth.uid() (Performance Pattern)
```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
-- Wrapping auth.uid() in SELECT caches the result per-statement (not per-row)
CREATE POLICY "Users can CRUD own rows" ON gig_listings
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
```

### Auth Callback Route (for email confirmation links)
```typescript
// Source: Supabase docs pattern
// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

### Trigger Function (create tenant on signup)
```sql
-- Source: https://supabase.com/docs/guides/auth/managing-user-data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.tenants (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;
```

### Checking email_confirmed_at for Catalog Visibility
```typescript
// src/app/[slug]/page.tsx — public catalog route
const supabase = await createClient()  // server client with anon key (no auth required)
const { data: tenant } = await supabase
  .from('tenants')
  .select('display_name, slug, tagline, avatar_url, user_id')
  .eq('slug', params.slug)
  .single()

// Check if user's email is verified (requires auth.users access via service role or
// exposing email_verified column on tenant record)
// RECOMMENDATION: store email_verified on tenants row and update via trigger
// on auth.users update event
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023-2024 | auth-helpers deprecated; SSR package is the only supported path |
| `supabase.auth.getSession()` in server | `supabase.auth.getUser()` | 2023 | getSession not validated server-side; getUser is authoritative |
| `createMiddlewareClient()` | `createServerClient()` in middleware helper | 2023-2024 | `createMiddlewareClient` is from auth-helpers; replaced by manual cookie handler |
| `getClaims()` (newly documented) | Still `getUser()` in practice | Late 2025 | `getClaims()` is faster (no network call) but guidance not fully settled; use `getUser()` for now |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Final version 0.15.0, no longer maintained
- `createMiddlewareClient()`: Removed — use `createServerClient()` with manual cookie setup
- `supabase.auth.getSession()` in server code: Not safe, can be spoofed

---

## Open Questions

1. **Seeded data user_id assignment strategy**
   - What we know: 14 existing tables have seeded rows (platforms, service_pillars) with no `user_id`. After RLS migration, these rows will be invisible to all users.
   - What's unclear: Should these be assigned to the admin user's UUID (hardcoded in migration), left nullable (accessible to no one until admin re-seeds), or re-seeded fresh per user?
   - Recommendation: The planner should add a task for a post-migration admin script that reassigns existing rows to the owner's user UUID. The migration itself should leave `user_id` nullable. This is safe because RLS `USING (auth.uid() = user_id)` will simply return no rows for NULL user_ids (NULL != any UUID).

2. **getClaims() vs getUser() in middleware**
   - What we know: Supabase added `getClaims()` in late 2025 as a faster alternative to `getUser()` (no network round-trip, validates JWT locally). Documentation guidance was not finalized as of the GitHub issue (Nov 2025).
   - What's unclear: Is `getClaims()` safe for route protection in `@supabase/ssr` v0.8.0? Does it handle revoked sessions correctly?
   - Recommendation: Use `getUser()` for now. If performance is measured as a concern after launch, evaluate `getClaims()` when its documentation stabilizes.

3. **email_verified flag on tenants table**
   - What we know: The catalog visibility gate requires knowing if a tenant's email is verified. `auth.users.email_confirmed_at` is in the auth schema (not accessible to anon queries).
   - What's unclear: Best way to surface this to public catalog route without a service-role call on every page load.
   - Recommendation: Store `email_verified BOOLEAN DEFAULT false` on the `tenants` table. Create a second trigger or a `BEFORE UPDATE` hook on `auth.users` that sets `tenants.email_verified = true` when `email_confirmed_at` is set. Alternatively, the auth callback route (`/auth/callback`) can set it via service role after code exchange.

4. **gig_versions table and user_id inheritance**
   - What we know: `gig_versions` has a FK to `gig_listings(id)`. If gig_listings has RLS, then gig_versions implicitly filters through the join.
   - What's unclear: Whether adding a direct `user_id` column to `gig_versions` is necessary or if a policy using a sub-select to `gig_listings` is preferable.
   - Recommendation: Add `user_id` directly to `gig_versions` for simpler, faster policies. Populate it via the same migration backfill logic.

---

## Sources

### Primary (HIGH confidence)
- `https://supabase.com/docs/guides/database/postgres/row-level-security` — RLS policy syntax, auth.uid() caching pattern, service_role bypass
- `https://supabase.com/docs/guides/auth/managing-user-data` — on_auth_user_created trigger pattern, user_metadata access
- `https://www.ryankatayi.com/blog/server-side-auth-in-next-js-with-supabase-my-setup` — Complete verified code for middleware.ts, server.ts, auth server actions (cross-referenced with official docs)
- Existing codebase inspection (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, all 14 migration files)

### Secondary (MEDIUM confidence)
- `https://supabase.com/docs/guides/auth/server-side/nextjs` — Official guide; docs appear to be in transition (getClaims vs getUser nomenclature flux); core patterns verified against secondary source
- `https://github.com/supabase/ssr/blob/main/CHANGELOG.md` — v0.8.0 (2025-11-26): no breaking changes, cookies.encode option added, no getClaims changes
- `https://github.com/supabase/supabase/issues/40985` — getClaims vs getUser open issue; confirms getUser is still the safe choice

### Tertiary (LOW confidence)
- WebSearch consensus on onboarding redirect pattern (multiple sources agree on user_metadata flag approach, but no single authoritative reference)
- WebSearch on `getClaims()` performance characteristics — stated in official docs but practical guidance not finalized

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed and verified in package.json; no new dependencies needed
- Architecture: HIGH — middleware pattern, server actions, trigger pattern all verified against official docs and verified third-party implementation
- Pitfalls: HIGH — permissive policy risk, getSession vs getUser, trigger failure, slug race conditions all verified against official docs and community discussions
- RLS migration strategy: MEDIUM — the exact approach for handling seeded data user_id assignment is an open question requiring planner judgment
- getClaims() recommendation: LOW — guidance not finalized in official docs; flagged as open question

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable APIs; getClaims guidance may settle sooner)

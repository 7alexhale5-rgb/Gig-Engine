# Architecture Research

**Domain:** Multi-tenant freelancer service directory SaaS
**Researched:** 2026-02-17
**Confidence:** HIGH (existing codebase fully audited, key decisions verified against official docs and community patterns)

---

## Existing Architecture Baseline

Before recommending what to build, the current codebase state must be understood precisely. The milestone adds multi-tenant SaaS capabilities on top of an existing Next.js 14 app.

### What Exists Today

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXISTING (Active)                             │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 14 App Router (src/app/)                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  page.tsx — Static service catalog (getListingsByPillar) │   │
│  │  layout.tsx — Sidebar + dark theme shell                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│       ↓ reads from filesystem at build time                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  listings/fiverr/*.md — 31 markdown listing files        │   │
│  │  listings/upwork/*.md — 31 markdown listing files        │   │
│  │  images/fiverr/*.png — Satori-generated gig thumbnails   │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    EXISTING (Inactive — Wired But Disconnected)  │
├─────────────────────────────────────────────────────────────────┤
│  Supabase schema (14 migrations, RLS enabled, no user_id FK)    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  gig_listings, platforms, service_pillars, opportunities │   │
│  │  proposal_templates, projects, revenue_entries, etc.     │   │
│  │  RLS: "allow all for authenticated users" (single-user)  │   │
│  └─────────────────────────────────────────────────────────┘   │
│  src/lib/supabase/{client,server}.ts — Clients scaffolded       │
│  src/lib/hooks/use*.ts — Hooks scaffolded, never connected      │
│  src/components/* — Dashboard UI built but unreachable          │
├─────────────────────────────────────────────────────────────────┤
│                    EXISTING (Active — Scripts)                   │
├─────────────────────────────────────────────────────────────────┤
│  scripts/ — Node.js automation (NOT in Next.js, standalone)     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  morning-report.mjs → scrape-fiverr/upwork → AI → Telegram│ │
│  │  weekly-summary.mjs → Telegram                           │   │
│  │  generate-proposal.mjs → stdout                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  launchd: com.prettyfly.gig-monitor (6:45 AM daily)             │
│  Auth state: ~/.gig-engine/ (NOT in project directory)          │
└─────────────────────────────────────────────────────────────────┘
```

**Critical observation:** The existing schema has NO `user_id` column on any table. All tables use `USING (true)` RLS policies — single-user permissive. Multi-tenancy requires a migration to add `user_id` columns and replace all policies.

---

## Target Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ /dashboard/* │  │ /[slug]/*    │  │ widget.js (CDN)     │  │
│  │ Auth-gated   │  │ Public pages │  │ Embeddable catalog  │  │
│  │ Freelancer   │  │ Service dir  │  │ (iframe approach)   │  │
│  │ workspace    │  │ per tenant   │  └─────────────────────┘  │
│  └──────┬───────┘  └──────┬───────┘                           │
│         │                 │                                     │
├─────────┼─────────────────┼─────────────────────────────────────┤
│         │           NEXT.JS API LAYER (App Router)              │
│  ┌──────┴──────┐  ┌──────┴───────┐  ┌──────────────────────┐  │
│  │ /api/auth/* │  │ /api/catalog │  │ /api/stripe/*        │  │
│  │ Supabase    │  │ Public reads  │  │ checkout, webhooks   │  │
│  │ Auth SSR    │  │ no auth needed│  │ Connect onboarding   │  │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                │                      │              │
│  ┌──────┴──────┐  ┌──────┴───────┐  ┌──────────┴───────────┐  │
│  │ /api/import │  │ /api/analytics│  │ /api/widget          │  │
│  │ Scrape queue │  │ event ingest │  │ CORS-open iframe src │  │
│  │ (async job) │  │ (write-only) │  └──────────────────────┘  │
│  └─────────────┘  └─────────────┘                             │
├─────────────────────────────────────────────────────────────────┤
│                      DATA LAYER                                  │
│  ┌─────────────────────────┐  ┌───────────────────────────┐    │
│  │  Supabase (Postgres)    │  │  Stripe                   │    │
│  │  + Auth                 │  │  + Connect Express        │    │
│  │  + RLS (user_id-scoped) │  │  + Checkout Sessions      │    │
│  │  + Storage (images)     │  │  + Webhooks               │    │
│  └─────────────────────────┘  └───────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                      AUTOMATION LAYER (Unchanged)                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  scripts/*.mjs — launchd-scheduled, standalone Node.js  │   │
│  │  No dependency on Next.js app; reads ~/.gig-engine/ auth │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With | Notes |
|-----------|---------------|-------------------|-------|
| `/dashboard/*` routes | Auth-gated freelancer workspace — manage services, view analytics, connect Stripe | Supabase (via RLS user context), Stripe API | Replaces static page as primary UI for logged-in users |
| `/[slug]/*` routes | Public service catalog per tenant — readable without auth | Supabase (anon key, RLS permits public services), Stripe Checkout | Core shareable artifact; slug resolves to `user_profiles.catalog_slug` |
| `/api/stripe/*` | Stripe webhook handler, Checkout session creation, Connect onboarding | Stripe, Supabase (write payment records) | Must use `stripe-signature` header validation; never expose secret key to client |
| `/api/import` | Triggers scrape job for a given Fiverr/Upwork URL; returns job ID | Internal queue mechanism (see pitfall below), Supabase | Playwright cannot run in Vercel serverless — needs decoupled execution |
| `/api/analytics` | Accepts page view / click events from public catalog pages and widget | Supabase (analytics_events table) | Write-only endpoint; no auth required; rate-limit by IP |
| `/api/widget` | Serves embeddable iframe source page for a given slug | Same as `/[slug]` but stripped to widget layout | CORS open; minimal CSS; inject via `<script>` tag pattern |
| `widget.js` (CDN) | Tiny JS snippet (<5KB) that renders an `<iframe>` pointing to `/api/widget?slug=X` | `/api/widget` endpoint via iframe | Hosted as a static asset on Vercel; paste-and-go embed code |
| `scripts/*.mjs` | Standalone automation: Fiverr/Upwork scraping, Telegram reports | Playwright stealth, Anthropic API, Telegram Bot API | Must remain independent from Next.js; never import from `src/` |
| Supabase Auth | Email/password + OAuth for freelancer accounts | Next.js via `@supabase/ssr` cookie-based sessions | Middleware refreshes session on every request |
| Supabase RLS | Enforces tenant isolation at DB level | Every authenticated query | After migration: `USING (user_id = auth.uid())` on all tables |
| Stripe Connect Express | Freelancer onboarding, payout to their bank | Stripe, `/api/stripe/connect` route | `$2/active account/month` cost; Stripe handles KYC/identity |

---

## Data Flow

### 1. Freelancer Onboarding Flow

```
[Freelancer signs up]
    ↓ Supabase Auth email/password
[auth.users record created]
    ↓ Postgres trigger (on insert to auth.users)
[user_profiles row inserted]
    │   catalog_slug = slugify(email prefix)
    │   stripe_account_id = NULL (until connected)
    ↓
[Dashboard: /dashboard] ← Supabase session cookie
    ↓ User clicks "Connect Stripe"
[/api/stripe/connect/onboard]
    ↓ stripe.accounts.create({ type: 'express' })
    ↓ stripe.accountLinks.create({ account, type: 'account_onboarding' })
[Redirect to Stripe Express hosted onboarding UI]
    ↓ Stripe redirects to /api/stripe/connect/return
[Update user_profiles.stripe_account_id]
    ↓
[Dashboard: Payment ready]
```

### 2. Gig Import Flow

```
[Freelancer pastes Fiverr/Upwork URL]
    ↓ POST /api/import { url, userId }
[API validates URL format, enqueues job]
    ↓ Job record inserted in import_jobs table (status: pending)
[Import worker executes Playwright scrape]
    │   Runs outside Vercel (local launchd or separate process)
    │   Reads gig title, description, pricing, images
    ↓ Worker inserts into gig_listings with user_id = authenticated user
[Frontend polls import_jobs for status]
    ↓ Job status: complete
[Gig appears in /dashboard/services]
```

### 3. Public Catalog + Payment Flow

```
[Client visits prettyfly.app/alex]
    ↓ Next.js [slug] route resolves user_profiles WHERE catalog_slug = 'alex'
[Supabase anon query: gig_listings WHERE user_id = profile.user_id AND is_public = true]
    ↓ Renders service cards (Server Component, no client JS for catalog)
[Client clicks "Book Basic - $99"]
    ↓ POST /api/stripe/checkout { gigId, tierId, slugOwnerId }
[API creates Stripe Checkout Session]
    │   payment_intent_data.application_fee_amount = platform_fee (if any)
    │   transfer_data.destination = profile.stripe_account_id (Connect Express)
    ↓ Redirect to Stripe Checkout hosted page
[Payment completed]
    ↓ Stripe webhook: checkout.session.completed → /api/stripe/webhooks
[Insert revenue_entries row (user_id = gig owner)]
[Update gig_listings.orders + revenue_total]
[Send confirmation email (optional)]
```

### 4. Analytics Event Flow

```
[Client views /alex or widget]
    ↓ Page load fires POST /api/analytics { type: 'view', gigId, slug }
[API inserts analytics_events row (no auth, anonymous)]
    ↓ Dashboard query aggregates events per gig
[Freelancer sees views/clicks/conversions in /dashboard/analytics]
```

### 5. Widget Embed Flow

```
[Freelancer copies embed code snippet]
    <script src="https://prettyfly.app/widget.js" data-slug="alex"></script>
    ↓ widget.js executes on third-party site
[widget.js creates <iframe src="https://prettyfly.app/api/widget?slug=alex">]
    ↓ iframe loads stripped catalog page (no sidebar, no nav)
[Same catalog logic as /[slug] but widget layout]
    ↓ Clicks inside iframe navigate parent via postMessage (optional)
[Checkout opens in new tab (standard iframe behavior)]
```

---

## Recommended Project Structure

```
src/
├── app/
│   ├── (public)/               # No auth — public catalog pages
│   │   ├── [slug]/
│   │   │   └── page.tsx        # Tenant catalog page
│   │   └── layout.tsx          # Minimal layout (no sidebar)
│   ├── (dashboard)/            # Auth-gated — route group
│   │   ├── dashboard/
│   │   │   ├── services/       # Manage gig listings
│   │   │   ├── analytics/      # View metrics
│   │   │   ├── settings/       # Profile, catalog slug, Stripe
│   │   │   └── page.tsx        # Dashboard home
│   │   └── layout.tsx          # Sidebar + auth check
│   ├── api/
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts
│   │   │   ├── connect/
│   │   │   │   ├── onboard/route.ts
│   │   │   │   └── return/route.ts
│   │   │   └── webhooks/route.ts
│   │   ├── import/route.ts     # Trigger scrape job
│   │   ├── analytics/route.ts  # Ingest view/click events
│   │   └── widget/route.ts     # Widget iframe src
│   ├── page.tsx                # KEEP: existing static catalog (Alex's personal view)
│   ├── layout.tsx              # Root layout (unchanged for now)
│   └── middleware.ts           # Supabase session refresh on all routes
├── components/
│   ├── catalog/                # Public-facing service card UI
│   ├── dashboard/              # EXISTING: reactivate with Supabase hooks
│   ├── analytics/              # EXISTING: reactivate with real data
│   ├── layout/                 # EXISTING: keep Sidebar, Header
│   └── ui/                     # EXISTING: shadcn components
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # EXISTING: browser client
│   │   ├── server.ts           # EXISTING: server client
│   │   └── types.ts            # EXISTING + add new tables
│   ├── stripe/
│   │   ├── client.ts           # Stripe server-side client
│   │   └── helpers.ts          # Fee calculation, session creation
│   ├── hooks/
│   │   └── use*.ts             # EXISTING: reactivate with real queries
│   └── schemas/
│       └── *.ts                # EXISTING + add user_profiles, analytics schemas
└── middleware.ts               # Supabase session middleware
```

---

## Architectural Patterns

### Pattern 1: RLS Migration — Adding user_id to Existing Tables

**What:** The existing schema has no `user_id` column. Every table needs a `user_id UUID REFERENCES auth.users(id)` column, and the permissive "allow all" policies must be replaced with ownership-scoped policies.

**When to use:** This is the single most critical migration. Everything downstream depends on it.

**Migration sequence:**

```sql
-- Step 1: Add user_id to each table (nullable first, populate, then NOT NULL)
ALTER TABLE gig_listings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Populate existing rows (Alex's user_id from auth.users)
UPDATE gig_listings SET user_id = '<alex-user-uuid>';

-- Step 3: Make NOT NULL
ALTER TABLE gig_listings ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add index (critical for RLS performance)
CREATE INDEX idx_gig_listings_user_id ON gig_listings(user_id);

-- Step 5: Drop permissive policy
DROP POLICY "Allow all for authenticated users" ON gig_listings;

-- Step 6: Add ownership policy
CREATE POLICY "Users own their gig listings" ON gig_listings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Step 7: Add public read policy for is_public listings
CREATE POLICY "Public can read active public gigs" ON gig_listings
  FOR SELECT TO anon
  USING (status = 'active');
```

**Trade-offs:** Missing the index causes 10-50x query slowdown at scale. Add the index before enabling the policy.

### Pattern 2: User Profiles Table with Catalog Slug

**What:** Supabase Auth manages identity in `auth.users`. Application profile data lives in a separate `public.user_profiles` table. A Postgres trigger auto-creates the profile on user signup.

**When to use:** Always. Never store application data in `auth.users`.

**Example:**

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_slug TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  stripe_account_id TEXT,
  stripe_onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, catalog_slug, display_name)
  VALUES (
    NEW.id,
    LOWER(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', '-')),
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Trade-offs:** Slug collisions require a fallback (append `-%d` suffix). Handle at trigger or application layer.

### Pattern 3: Stripe Connect Express for Freelancer Payouts

**What:** Each freelancer connects a Stripe Express account. When a client pays for a service, the money goes to the freelancer minus a platform fee. Stripe handles KYC, payouts, and tax reporting.

**When to use:** When freelancers need direct payouts to their bank. Required for any real money movement to third parties.

**Confidence:** MEDIUM — official Stripe docs confirm Express account type pattern; specific pricing ($2/active account/month) verified from multiple sources.

**Flow:**

```typescript
// Onboarding: create Express account + account link
const account = await stripe.accounts.create({ type: 'express' });
const link = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: `${BASE_URL}/api/stripe/connect/onboard`,
  return_url: `${BASE_URL}/api/stripe/connect/return`,
  type: 'account_onboarding',
});
redirect(link.url);

// Payment: destination charge
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{ price_data: { ... }, quantity: 1 }],
  mode: 'payment',
  payment_intent_data: {
    application_fee_amount: 0, // 0 for v1 — no platform cut
    transfer_data: { destination: freelancer.stripe_account_id },
  },
  success_url: `${BASE_URL}/[slug]/success`,
  cancel_url: `${BASE_URL}/[slug]`,
});
```

**Trade-offs:** Express costs $2/active account/month. For v1 with one tenant (Alex), cost is negligible. Skip Connect entirely if the platform never takes a cut — use plain Stripe Checkout charging the platform's Stripe account and paying out manually. **Recommended v1 approach: plain Stripe Checkout (no Connect) until multi-tenant payments are needed.** Add Connect in a later phase.

### Pattern 4: Embeddable Widget via iframe (Not Web Components)

**What:** A small `<script>` tag that injects an `<iframe>` pointing to `/api/widget?slug=X`. The iframe renders a stripped-down version of the public catalog.

**When to use:** This is the right choice for this project because it provides complete style isolation (third-party site CSS cannot interfere), requires zero framework knowledge from the embedder, and leverages existing Next.js route infrastructure.

**Confidence:** MEDIUM — web components are faster (4.5x per benchmark), but iframe is simpler to implement correctly and avoids React hydration complexity in third-party environments.

**Implementation:**

```javascript
// widget.js (served as static file from /public/widget.js)
(function() {
  var scripts = document.querySelectorAll('script[data-slug]');
  scripts.forEach(function(script) {
    var slug = script.getAttribute('data-slug');
    var iframe = document.createElement('iframe');
    iframe.src = 'https://prettyfly.app/api/widget?slug=' + slug;
    iframe.style.cssText = 'width:100%;border:none;min-height:600px;';
    iframe.setAttribute('loading', 'lazy');
    script.parentNode.insertBefore(iframe, script);
  });
})();
```

**Embed code for freelancers:**
```html
<script src="https://prettyfly.app/widget.js" data-slug="alex"></script>
```

### Pattern 5: Analytics via Event Table (Not Third-Party Service)

**What:** A dedicated `analytics_events` table in Supabase. The public catalog page fires a lightweight POST to `/api/analytics` on load. The dashboard aggregates these with SQL.

**When to use:** Early stage — avoid adding Mixpanel/PostHog costs. Postgres can handle analytics at this scale (sub-100K events/month) without issue.

**Schema:**

```sql
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('catalog_view', 'gig_click', 'checkout_start', 'checkout_complete')),
  catalog_owner_id UUID REFERENCES auth.users(id),
  gig_id UUID REFERENCES gig_listings(id),
  visitor_id TEXT,          -- anonymous fingerprint, no PII
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_owner ON analytics_events(catalog_owner_id, created_at DESC);
CREATE INDEX idx_analytics_gig ON analytics_events(gig_id, created_at DESC);
```

**Trade-offs:** Postgres is row-oriented, not column-oriented — aggregation queries get slower past 1M rows per tenant. At that point, add a materialized view or migrate to a separate analytics store. Not a concern for v1.

### Pattern 6: Gig Import — Decoupled from Vercel Serverless

**What:** The `/api/import` route accepts a URL and creates an `import_jobs` record, then returns immediately. The actual Playwright scrape runs outside Vercel (local process, triggered by Supabase Realtime or polling).

**When to use:** Always for Playwright on Vercel. Chromium binary is ~280MB; Vercel function limit is 50MB. Playwright cannot run in Vercel serverless.

**Confidence:** HIGH — verified via official Vercel limits documentation and community discussion.

**Build order implication:** Import must be scoped to a local-execution pattern for v1. The existing `scripts/` pipeline (launchd + Node.js) is the right model. A dedicated import worker script can poll the `import_jobs` table and process pending jobs.

```
import_jobs table:
  id, user_id, source_url, platform, status (pending/processing/done/failed),
  result_gig_id, error_message, created_at, processed_at
```

The existing `scripts/` automation pattern maps directly to this: a new `scripts/import-worker.mjs` that polls `import_jobs` and runs Playwright scrapes, then writes results to `gig_listings`.

---

## Build Order (Dependencies Between Components)

The milestone components have strict dependency ordering. Building in the wrong order causes rework.

```
1. Database Migration (user_id columns + new tables)
       │
       ↓ Required by: everything
2. Supabase Auth (email/password signup/login)
       │
       ↓ Required by: dashboard, slug pages, import, analytics
3. User Profiles Table + Trigger
       │
       ↓ Required by: slug resolution, Stripe Connect
4. RLS Policy Replacement (user_id ownership policies)
       │
       ↓ Required by: all data reads/writes being tenant-safe
5. Dashboard Routes + Reactivate Existing Components
       │
       ↓ Required by: service management, analytics viewing
6. Public Catalog [slug] Route
       │
       ↓ Required by: payments, widget, analytics
7. Stripe Checkout (plain, no Connect for v1)
       │
       ↓ Required by: revenue tracking
8. Analytics Events Table + API Route
       │
       ↓ Required by: analytics dashboard
9. Gig Import Pipeline (URL → Playwright → gig_listings)
       │
       ↓ Required by: ease of onboarding for non-Alex tenants
10. Embeddable Widget (script + iframe route)
        │
        ↓ Required by: embedding on external sites
11. Stripe Connect Express (deferred — v2 when multi-payout needed)
```

**Phase recommendation from this ordering:**
- **Phase 1:** Steps 1–4 (Foundation: auth + database migration)
- **Phase 2:** Steps 5–6 (Core product: dashboard + public catalog)
- **Phase 3:** Step 7 (Revenue: Stripe Checkout)
- **Phase 4:** Step 8 (Analytics)
- **Phase 5:** Step 9 (Import pipeline)
- **Phase 6:** Step 10 (Widget)
- **Phase 7:** Step 11 (Connect Express — when needed)

---

## Anti-Patterns

### Anti-Pattern 1: Enabling Multi-Tenant RLS Without user_id Index

**What people do:** Add `user_id` column and RLS policy, forget to `CREATE INDEX idx_table_user_id ON table(user_id)`.

**Why it's wrong:** Postgres must do a full sequential scan for every RLS-policy check. At 10K rows per table, queries go from <1ms to 50ms+. At 100K rows, it becomes a user-visible latency problem.

**Do this instead:** Add index in the same migration as the column. The migration in Pattern 1 above shows the correct order.

### Anti-Pattern 2: Running Playwright Inside Vercel Serverless Functions

**What people do:** Create a Next.js API route that calls Playwright directly to scrape a URL on demand.

**Why it's wrong:** Chromium binary is 280MB; Vercel function max is 50MB. Deploy fails. Even with `@sparticuz/chromium` (a workaround), function timeout is 60 seconds max on Pro — insufficient for complex scrapers with stealth plugins.

**Do this instead:** Use the existing `scripts/` launchd pattern. `/api/import` only writes a job record; a separate Node.js script polls and executes the scrape. The existing `scripts/morning-report.mjs` is the model.

### Anti-Pattern 3: Storing Stripe Secret Key in Client-Side Code

**What people do:** Use `process.env.STRIPE_SECRET_KEY` in a Client Component or expose it via `NEXT_PUBLIC_STRIPE_SECRET_KEY`.

**Why it's wrong:** Stripe secret key is exposed in browser. Anyone can make API calls as the platform.

**Do this instead:** All Stripe operations happen in Next.js Route Handlers (server-side). Client only receives session IDs and redirect URLs. Only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` belongs in client code.

### Anti-Pattern 4: Using Stripe Connect When You Don't Need It

**What people do:** Implement full Stripe Connect Express from day one "because it's a marketplace."

**Why it's wrong:** Connect adds $2/active account/month, complex onboarding UX, and significant implementation complexity. If Alex is the only seller and payments go to his Stripe account, Connect is unnecessary overhead.

**Do this instead:** Start with plain Stripe Checkout (money goes to platform account). Add Connect only when a second freelancer needs to receive payouts independently. The architecture is designed to swap this in later without major rework.

### Anti-Pattern 5: Making the Public Catalog Route Auth-Required

**What people do:** Wrap the `[slug]` route in the auth middleware, requiring visitors to log in before seeing a freelancer's services.

**Why it's wrong:** The entire value of a shareable catalog is that clients can view it without creating an account. Requiring login kills conversion.

**Do this instead:** The `[slug]` route uses the Supabase anon key and public RLS policies (`status = 'active'`). No session required. Analytics still fire (anonymously). Checkout redirects to Stripe (no Gig-Engine account needed).

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | Cookie-based sessions via `@supabase/ssr`; middleware refreshes on every request | Already scaffolded in `src/lib/supabase/{client,server}.ts` |
| Supabase Database | Server Components use server client; Client Components use browser client | RLS ensures correct data isolation automatically |
| Stripe Checkout | Server-side session creation in Route Handler; client redirects to hosted Stripe page | `stripe` npm package server-side only |
| Stripe Webhooks | Route Handler at `/api/stripe/webhooks`; validates `stripe-signature` header | Raw body parsing required — use `Request.text()` not `Request.json()` |
| Stripe Connect Express | Account creation + Account Links API; redirect to Stripe hosted onboarding | Deferred to post-v1 |
| Telegram Bot | Existing `scripts/send-telegram.mjs` — NO CHANGES NEEDED | Keep automation scripts independent |
| Playwright (scraping) | External process via `scripts/import-worker.mjs`; NOT in Vercel | Existing stealth plugin must be preserved |
| Vercel | GitHub auto-deploy from main; static assets in `public/` | `widget.js` lives at `public/widget.js` |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Dashboard ↔ Supabase | Supabase browser client + React hooks (existing `use*.ts` hooks) | Hooks already written; need real env vars and real user_id queries |
| Public catalog ↔ Supabase | Server Component + Supabase server client (anon key) | No client-side Supabase calls on public pages |
| Widget ↔ Public catalog | iframe `src` pointing to `/api/widget?slug=X` route | Same rendering logic, different layout |
| Import API ↔ Import worker | Shared `import_jobs` table; worker polls for `status = 'pending'` | Decoupled by database; no HTTP between them |
| Stripe webhooks ↔ Database | Webhook route writes to `revenue_entries`, updates `gig_listings` counts | Must be idempotent (Stripe may retry webhooks) |
| Automation scripts ↔ Next.js | No dependency; scripts are standalone Node.js | Keep it that way — never import from `src/` in scripts |

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–100 tenants | Current approach fine. Single Supabase project, Vercel free tier, local import worker. No changes. |
| 100–10K tenants | Add indexes on `analytics_events` (already specified). Consider materialized views for analytics aggregation. Move import worker to dedicated VPS or cloud function. Supabase Pro plan ($25/month) for better limits. |
| 10K+ tenants | Separate analytics into time-series store (TimescaleDB or ClickHouse). Consider Supabase connection pooling (PgBouncer, already available on Pro). CDN-cached public catalog pages. |

### Scaling Priorities

1. **First bottleneck:** Analytics events table — high write volume (every page view). Fix: materialized views for hourly/daily rollups. Background job refreshes them.
2. **Second bottleneck:** Public catalog SSR — `[slug]` route hits Postgres on every request. Fix: Next.js `unstable_cache` or ISR (revalidate: 60) on catalog queries.

---

## Sources

- Supabase RLS official docs: https://supabase.com/docs/guides/database/postgres/row-level-security (HIGH confidence — official)
- Supabase multi-tenant patterns: https://roughlywritten.substack.com/p/supabase-multi-tenancy-simple-and (MEDIUM confidence — community, aligns with official docs)
- Stripe Connect account types: https://docs.stripe.com/connect/accounts — Express vs Standard (HIGH confidence — official)
- Stripe Connect Express pricing ($2/active account/month): https://www.chargekeep.com/stripe-connect-accounts-comparison/ (MEDIUM — third-party, consistent across multiple sources)
- Vercel function size limit (50MB) and timeout: https://vercel.com/docs/limits (HIGH confidence — official)
- Playwright on Vercel limitations: https://www.zenrows.com/blog/playwright-vercel (MEDIUM confidence — detailed technical post)
- iframe vs Web Components performance: https://dp-lewis.medium.com/iframes-vs-web-components-which-one-actually-performs-better-in-2025 (MEDIUM confidence — benchmark article, 2025)
- Embeddable React widget patterns: https://makerkit.dev/blog/tutorials/embeddable-widgets-react (MEDIUM confidence — MakerKit is a reputable Next.js SaaS framework)
- Supabase page view tracking: https://codebycorey.com/blog/page-views-nextjs-supabase (MEDIUM confidence — verified pattern, aligns with Supabase docs)
- Existing codebase audit: `/Users/alexhale/Projects/Gig-Engine/` — migrations, types, scripts, components (HIGH confidence — direct inspection)

---

*Architecture research for: Multi-tenant freelancer service directory SaaS (Gig-Engine milestone)*
*Researched: 2026-02-17*

# Pitfalls Research

**Domain:** Freelancer service directory / multi-tenant SaaS marketplace
**Researched:** 2026-02-17
**Confidence:** HIGH (multi-source verified across Supabase docs, Stripe docs, community post-mortems, and web scraping ecosystem research)

---

## Critical Pitfalls

### Pitfall 1: Retrofitting tenant_id onto existing tables without updating every RLS policy

**What goes wrong:**
You add a `tenant_id` column to all tables and write RLS policies against it, but miss 2-3 tables — often junction tables, metrics tables, or tables added later. One tenant can then read or write another tenant's rows through those unguarded tables. The application appears correct in testing because the developer tests as a single user who owns all data. The isolation gap only surfaces when a second real tenant exists.

**Why it happens:**
The original schema was single-user (the existing migrations use permissive RLS policies scoped to `auth.uid()` as the only user). When multi-tenancy is added, developers trace the obvious tables but forget tables they consider "global" (e.g., `platforms`, `service_pillars`, `proposal_templates`) that now need per-tenant copies or shared-read-only scoping. In January 2025, 170+ apps were found with exposed databases; 83% involved RLS misconfiguration on tables the developer thought were protected.

**How to avoid:**
Write a migration checklist: for every table in `supabase/migrations/`, decide explicitly whether it is (a) tenant-scoped, (b) shared read-only, or (c) admin-only. Codify that decision in the migration file as a comment. Run `SELECT tablename FROM pg_tables WHERE schemaname = 'public'` and cross-check against your RLS policy list after every migration. Set up Supabase's built-in Security Advisor (Dashboard > Database > Advisors) to flag tables with RLS disabled. Test RLS isolation from the client SDK — not the SQL Editor, which bypasses RLS.

**Warning signs:**
- SQL Editor shows data but client SDK returns empty — RLS is enabled but policy is wrong.
- SQL Editor shows data and client SDK shows data from other tenants — RLS is not enabled.
- A tenant sees proposals or gig listings they did not create.
- Supabase Security Advisor reports "RLS disabled in public" lint warnings.

**Phase to address:** Multi-tenant auth foundation phase — before any user-facing data is written.

---

### Pitfall 2: Storing Supabase `service_role` key in client-accessible code or `.env.local` without server-only enforcement

**What goes wrong:**
The `service_role` key bypasses all RLS policies — it is the equivalent of a root database credential. If it appears in a Next.js environment variable prefixed with `NEXT_PUBLIC_`, it ships to the browser. If it appears in a non-`NEXT_PUBLIC_` variable but is used in a client component, it can be extracted via bundle analysis. In 2025, CVE-2025-48757 documented 170+ Lovable-generated apps with this exact exposure, leaking 13,000+ user records.

**Why it happens:**
Developers copy environment variable patterns from tutorials without reading the prefix rules. The existing project already has `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` — the risk is accidentally importing it in a file that gets bundled into the client.

**How to avoid:**
Never use `NEXT_PUBLIC_` prefix for `SUPABASE_SERVICE_ROLE_KEY`. Use it only in Next.js Server Actions, Route Handlers (`/app/api/`), and Supabase Edge Functions — never in `"use client"` files or hooks that run in the browser. Add a CI lint rule checking that no client-side file imports `process.env.SUPABASE_SERVICE_ROLE_KEY`. The anon key is safe for the client; use it for all browser-side Supabase calls.

**Warning signs:**
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` appears anywhere in `.env*` files.
- The service role key is imported in a file containing `"use client"`.
- Network DevTools shows the key in request headers from a browser session.

**Phase to address:** Multi-tenant auth foundation phase — first task before any auth code is written.

---

### Pitfall 3: Using `user_metadata` JWT claims in RLS policies for tenant scoping

**What goes wrong:**
Developers store `tenant_id` in `user_metadata` and write RLS policies like `auth.jwt() ->> 'user_metadata' ->> 'tenant_id' = tenant_id`. This is insecure: `user_metadata` can be modified by authenticated end users via the Supabase client SDK. An attacker can change their own `tenant_id` claim and read another tenant's data without any server-side validation.

**Why it happens:**
Supabase's auth system exposes `user_metadata` and `app_metadata` in the JWT. Developers read tutorials that use `user_metadata` for convenience, not realizing end users can write to it. The correct field is `app_metadata`, which only server-side (service role) code can modify.

**How to avoid:**
Store `tenant_id` in `app_metadata` (set via service role in a server-side onboarding function) or in a separate `tenant_memberships` table scoped by `auth.uid()`. In RLS policies, reference the memberships table: `EXISTS (SELECT 1 FROM tenant_memberships WHERE user_id = auth.uid() AND tenant_id = listings.tenant_id)`. This approach is more join-expensive but secure — add an index on `(user_id, tenant_id)` to keep it fast.

**Warning signs:**
- RLS policies contain `user_metadata` instead of `app_metadata`.
- A user can change their profile and suddenly see different data.
- Policies use `auth.jwt() -> 'user_metadata'` syntax.

**Phase to address:** Multi-tenant auth foundation phase — when designing the tenant membership schema.

---

### Pitfall 4: Stripe webhook raw body parsing broken by Next.js middleware or body parsers

**What goes wrong:**
Stripe webhook signature verification requires the exact raw request body as received. Next.js App Router Route Handlers consume the body as a stream. If anything in the middleware chain reads, parses, or re-serializes the body before the webhook handler sees it, the HMAC signature check fails with a cryptic "No signatures found matching the expected signature" error. This is one of the most common Stripe integration failures in Next.js.

**Why it happens:**
Developers write `const body = await req.json()` (which parses the body) and then pass the parsed object to `stripe.webhooks.constructEvent()` instead of the raw bytes. Some middleware (logging, auth guards) also reads the body. Next.js 13+ App Router requires explicit raw body reading via `await req.text()` or `Buffer.from(await req.arrayBuffer())`.

**How to avoid:**
In the webhook Route Handler, always read the body as raw bytes: `const body = await req.text()`. Pass the raw string to `stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)`. Never read the body before this call — no middleware, no logging. Add a Stripe webhook secret per environment (test key in development, live key in production) and verify they are not swapped.

**Warning signs:**
- "No signatures found matching the expected signature" error in logs.
- Webhooks succeed in the Stripe Dashboard test but fail in production.
- Webhook handler works for some events but not others (indicating race with body-reading middleware).

**Phase to address:** Stripe payments integration phase — first implementation step.

---

### Pitfall 5: Missing webhook idempotency — processing the same Stripe event twice

**What goes wrong:**
Stripe retries webhook delivery for up to 3 days on failures. If your handler returns a 500 (server crash, timeout, database error), Stripe retries. On retry, the same `payment_intent.succeeded` event fires twice — potentially charging the user twice, creating duplicate subscription records, or sending duplicate confirmation emails. Over 40% of reported Stripe transaction issues stem from missed or duplicate event handling.

**Why it happens:**
Developers implement the happy path (event arrives → process → respond 200) without accounting for retry behavior. The webhook handler is not idempotent because it unconditionally creates records rather than checking if they already exist.

**How to avoid:**
Store processed event IDs in a `stripe_events` table with a unique constraint on `stripe_event_id`. At the start of every webhook handler: check if `event.id` already exists — if so, return 200 immediately. Only after successful processing, insert the event ID. This pattern handles retries transparently. Also return 200 to Stripe quickly (within Vercel's function timeout) and offload heavy processing to a background job if needed.

**Warning signs:**
- Duplicate subscription records in the database.
- Users report being charged twice.
- No `stripe_events` table or similar deduplication mechanism exists.
- Webhook handler performs database writes without first checking for the event ID.

**Phase to address:** Stripe payments integration phase — alongside the webhook handler implementation.

---

### Pitfall 6: Vercel Hobby tier function timeout killing Stripe webhooks and scraping jobs

**What goes wrong:**
Vercel Hobby tier limits serverless functions to 10 seconds execution time (without Fluid Compute) or 60 seconds with Fluid Compute enabled. Stripe webhook handlers that trigger downstream work (email sends, database writes, Supabase Edge Function calls) can exceed this. The Playwright scraping scripts are long-running by nature and cannot run as Vercel serverless functions at all — they need a persistent runtime (Node.js process, cron, or a worker).

**Why it happens:**
Developers assume "serverless" means "unlimited" or don't check tier limits before deploying. The existing scraping scripts (`scrape-fiverr.mjs`, `scrape-upwork.mjs`) run fine locally via launchd but have no place in a Vercel serverless environment.

**How to avoid:**
For webhook handlers: respond 200 immediately after signature verification, then process asynchronously. On Hobby tier, keep webhook handlers under 10 seconds of actual work. For scraping: keep the existing launchd-scheduled Node.js scripts running locally — do not attempt to move them to Vercel. When the SaaS is multi-tenant and scraping needs to run per-user, evaluate a lightweight VPS worker (the existing VPS at `134.199.197.159` is available) or a GitHub Actions cron. For the Vercel constraint: Fluid Compute (available on Hobby) extends the limit to 60 seconds — enable it in `vercel.json` for the webhook route.

**Warning signs:**
- Vercel function logs show "Function execution timed out."
- Webhook handler returns 504 to Stripe intermittently.
- Any attempt to run Playwright inside a Vercel function.

**Phase to address:** Stripe payments integration phase (for webhooks) and scraping import phase (for job placement).

---

### Pitfall 7: Scraping Fiverr/Upwork behind authenticated sessions — auth state expiry kills imports

**What goes wrong:**
The existing scrapers use saved Playwright auth state (`~/.gig-engine/fiverr-auth.json`, `~/.gig-engine/upwork-auth.json`). These sessions expire — typically every 7-30 days depending on platform security settings. In a multi-tenant SaaS where users import their own gigs, each user's session state must be stored, refreshed, and handled when it expires. If a session silently expires, the scraper returns no data or an error page that the script may not recognize, silently producing empty imports.

**Why it happens:**
Single-user scripts check auth state once at startup and don't handle mid-session expiry. In multi-tenant mode, session management multiplies: 100 users means 100 sets of session tokens with different expiry times, each requiring re-authentication flows that the user must complete interactively.

**How to avoid:**
Detect auth expiry explicitly: check for login page redirects or known auth-wall DOM signatures after every scrape request. When expired, flag the user's credentials as stale and notify them to re-authenticate (do not silently fail). Store session tokens encrypted in Supabase per user (not in the filesystem). For the multi-tenant MVP, scope to: user provides their own credentials → you store their auth state → they re-auth when prompted. Do not attempt to store plaintext passwords.

**Warning signs:**
- Scraper returns 0 results without an error.
- Response HTML contains "Log in" or "Sign in" page titles.
- Import job completes but creates no listings.
- Supabase auth state table has tokens older than 30 days.

**Phase to address:** Gig scraping import phase — auth state management is the first implementation concern.

---

### Pitfall 8: Scraping violating platform Terms of Service — Fiverr/Upwork may ban accounts

**What goes wrong:**
Fiverr's and Upwork's Terms of Service prohibit automated scraping of their platforms. The existing scripts use stealth plugins to avoid detection, but this does not eliminate legal or account risk. If a user's account is flagged for automated access, the platform may suspend the account — which is far more damaging than a broken import feature. Scraping behind a login (authenticated sessions) is higher risk than scraping public data, because circumventing authentication access controls is the strongest basis for a CFAA claim.

**Why it happens:**
Developers prioritize feature velocity over legal risk assessment. The scripts work in testing, so the risk seems theoretical. In practice, Fiverr and Upwork actively monitor for automated session behavior and will suspend accounts that trigger bot detection.

**How to avoid:**
Frame the scraping feature as "personal data export" (you are scraping your own data from your own account), which is the most legally defensible position. Implement rate limiting: no more than 1 request per 3-5 seconds, randomized delays, realistic session patterns. Add human-readable disclaimers in the UI: "Importing uses your account credentials. Check platform ToS before proceeding." Do not store or redistribute scraped data beyond the individual user's own catalog. Consider whether Upwork's API (which exists but has restrictions) or Fiverr's affiliate program data provides a safer alternative for some data.

**Warning signs:**
- Scraper makes requests faster than 1 per second.
- No randomized delays between requests.
- Scraper requests match automated signatures (missing scroll events, instant page transitions).
- User reports account warning email from Fiverr or Upwork.

**Phase to address:** Gig scraping import phase — ToS risk review should happen before any user-facing import is built.

---

### Pitfall 9: Embeddable widget blocked by default Next.js CSP headers

**What goes wrong:**
Next.js projects commonly set `frame-ancestors 'self'` or `frame-ancestors 'none'` in Content Security Policy headers as a security default against clickjacking. When a freelancer embeds their service catalog widget on an external client site, the browser refuses to render the iframe with: "Refused to display [URL] in a frame because it set 'Content Security Policy' to 'frame-ancestors 'self''" — and there is no user-visible error, just a blank space.

**Why it happens:**
Security hardening is applied globally. The developer does not anticipate that embedding is a feature, not an attack vector, for embeddable widget pages. The CSP configuration is applied in `next.config.js` headers, middleware, or `vercel.json` and blocks all iframe embedding without domain-specific exceptions.

**How to avoid:**
Create a separate route for the embeddable widget (e.g., `/embed/[tenantSlug]`) and apply a permissive `frame-ancestors *` (or domain-allowlisted) CSP only to that route. All other routes keep strict `frame-ancestors 'none'`. In `next.config.js`:

```js
async headers() {
  return [
    {
      source: '/embed/:path*',
      headers: [{ key: 'Content-Security-Policy', value: "frame-ancestors *" }],
    },
  ];
}
```

Use `window.postMessage` for any widget-to-parent-page communication, always validating `event.origin` before processing messages.

**Warning signs:**
- Blank iframe on customer sites with no error in the app.
- Browser console shows "Refused to display in a frame" error.
- Widget works when `src` is opened directly but not when embedded.

**Phase to address:** Embeddable widget phase — must be handled in the route configuration before any widget code is written.

---

### Pitfall 10: Analytics aggregation exposing cross-tenant data in shared queries

**What goes wrong:**
Analytics queries that aggregate across the entire dataset (e.g., "platform averages," "market benchmark comparisons") accidentally expose tenant-specific data when RLS is bypassed or when aggregate results can be reverse-engineered. A more common version: a developer writes a Supabase RPC function with `SECURITY DEFINER` (which bypasses RLS) for performance, intending it to be safe, but the function's output includes rows from all tenants.

**Why it happens:**
Analytics often requires aggregations that are expensive with RLS active (because RLS re-evaluates per row). Developers reach for `SECURITY DEFINER` functions to bypass RLS for performance, then forget to add explicit `WHERE tenant_id = $tenant_id` filters to every query inside that function.

**How to avoid:**
Never use `SECURITY DEFINER` on Supabase RPC functions without explicit tenant_id filtering on every query. For platform-wide benchmark analytics (e.g., "average Fiverr gig price in your category"), pre-compute aggregates into an anonymized `platform_benchmarks` table via a server-side job — never expose raw cross-tenant queries. Add automated tests that create two tenant accounts, populate each with distinct data, and verify that neither tenant's analytics shows the other's numbers.

**Warning signs:**
- Supabase RPC functions use `SECURITY DEFINER` without tenant_id parameters.
- Analytics numbers seem "too high" or reflect data the user doesn't recognize.
- No cross-tenant isolation test exists in the test suite.

**Phase to address:** Analytics phase — test cross-tenant isolation before any analytics goes live.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Permissive RLS (`USING (true)`) on all tables | Faster MVP development | Every row accessible to any authenticated user — full data exposure | Never for multi-tenant data |
| No webhook idempotency table | Simpler handler code | Duplicate charges, double-emails on Stripe retries | Never in production |
| Session auth state in filesystem (`~/.gig-engine/`) | Works for single-user | Breaks entirely for multi-tenant, no user separation | Single-user mode only |
| Hardcoded `tenant_id` in queries instead of RLS | No schema changes needed | Application-level filtering is bypassable; every new query must be remembered | Never — use RLS |
| Global CSP headers blocking all iframes | Prevents clickjacking | Completely breaks embeddable widget feature | Never if widget is a feature |
| `SECURITY DEFINER` RPC for analytics performance | Faster queries | Bypasses RLS, risks cross-tenant data exposure without explicit filtering | Only with mandatory `WHERE tenant_id = $1` on every inner query |
| Storing Stripe customer IDs only in Stripe metadata | Avoids extra DB column | Cannot query customers without Stripe API call; webhook routing becomes fragile | Never — always mirror `stripe_customer_id` in your DB |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase RLS | Testing policies from SQL Editor (bypasses RLS) | Test from client SDK as authenticated user; use `SET LOCAL role = authenticated` in SQL Editor to simulate |
| Supabase RLS | Using `user_metadata` for tenant claims in policies | Use `app_metadata` (server-write only) or a `tenant_memberships` join |
| Stripe webhooks | `req.json()` before `constructEvent()` | `req.text()` to get raw body, pass to `constructEvent()` |
| Stripe webhooks | Using test webhook secret in production | Separate `STRIPE_WEBHOOK_SECRET` env var per environment |
| Stripe Connect | Creating charges on platform account instead of connected account | Use destination charges or transfer-based charges for marketplace payouts |
| Playwright scraping | Not detecting auth expiry — returns empty, no error | Explicitly check for login-wall DOM signatures after every navigation |
| Playwright scraping | Headless mode triggering bot detection (`navigator.webdriver = true`) | Use `playwright-extra` stealth plugin (already installed) + randomized delays |
| Vercel deployment | Forgetting to set `maxDuration` for webhook Route Handler | Add `export const maxDuration = 60` and enable Fluid Compute in `vercel.json` |
| Next.js headers | Global CSP `frame-ancestors 'none'` blocking the embed route | Route-specific header overrides for `/embed/:path*` only |
| Supabase Storage | RLS not enabled on storage buckets (separate from table RLS) | Explicitly set bucket policies — table RLS does not protect storage objects |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No index on `tenant_id` columns in RLS policies | Slow queries as tenants accumulate data | Add `CREATE INDEX idx_listings_tenant_id ON gig_listings(tenant_id)` for every RLS-filtered column | 10+ tenants with 100+ rows each |
| Real-time Supabase subscriptions per user without channel cleanup | Memory leak; browser tab freezes after extended use | Always call `supabase.removeChannel(channel)` on component unmount | Long-lived sessions with active pipeline views |
| Playwright scraper running synchronously for each user's import | One user's slow import blocks others | Queue scrape jobs in a background worker (Redis queue or simple DB-backed job table) | 5+ concurrent user imports |
| Fetching all tenant data client-side then filtering | Slow initial load; exposes more data than needed | Server-side filtering with `RLS + .select()` projections; paginate | 500+ listings per tenant |
| No webhook queue for Stripe events | Slow webhook handler exceeds Vercel timeout, Stripe retries pile up | Respond 200 immediately, queue work to Supabase Edge Function or DB job | High-traffic launch period |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| `service_role` key in any client-side code or `NEXT_PUBLIC_` env var | Full database bypass — attacker reads/writes all tenant data | Server-only: Route Handlers, Edge Functions, never `"use client"` files |
| Storing platform credentials (Fiverr/Upwork login) in plaintext | Platform account takeover | Encrypt at rest using Supabase Vault or application-level encryption before storing |
| Widget `postMessage` with `targetOrigin: "*"` | Any page can intercept messages | Always specify explicit origin: `iframe.contentWindow.postMessage(data, 'https://gig-engine.vercel.app')` |
| Not validating `event.origin` in widget `postMessage` receiver | Malicious parent page can send arbitrary commands | Always check `if (event.origin !== 'https://your-domain.com') return` |
| Stripe webhooks without signature verification | Forged webhook events (attacker creates fake subscription.created) | Always call `stripe.webhooks.constructEvent()` with the signing secret |
| Multi-tenant API routes without tenant context validation | Tenant A can access Tenant B's data by manipulating request parameters | Validate tenant ownership server-side on every Route Handler; never trust client-supplied tenant IDs |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Silent scrape failure when auth expires | User waits for import, gets empty results with no explanation | Detect auth expiry, surface "Re-authenticate your Fiverr account" prompt immediately |
| Stripe onboarding abandonment (too many steps before value) | Users sign up but never complete payment setup | Show service catalog (value) first, prompt payment setup only when they want to accept a booking |
| No clear tenant switching UI in multi-user orgs | Team members confused about which account they are acting on | Always show active tenant name prominently in the nav; never ambiguate context |
| Widget not responsive to parent container width | Widget looks broken on mobile or narrow sidebars | Design widget to respond to its container width, not viewport width; use `resize-observer` or CSS container queries |
| No graceful degradation when Stripe is unavailable | Payment buttons dead with no error message | Detect Stripe.js load failure; show "Payment processing unavailable" fallback |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **RLS enabled:** Verify with `SELECT tablename FROM pg_tables WHERE schemaname = 'public'` and cross-check with `SELECT schemaname, tablename FROM pg_tables WHERE NOT EXISTS (SELECT FROM pg_class JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace WHERE relrowsecurity = true AND relname = tablename AND nspname = schemaname)` — every public table should have RLS enabled.
- [ ] **Stripe webhook endpoint registered:** Webhook secret must be set in Stripe Dashboard under Developers > Webhooks. The endpoint URL must be the production URL, not localhost.
- [ ] **Stripe webhook idempotency:** Verify a `stripe_events` table or equivalent exists and the handler checks it before processing.
- [ ] **Scraper auth state encryption:** Verify platform session tokens are not stored in plaintext in the database.
- [ ] **Widget embed route CSP:** Verify `/embed/*` routes have `frame-ancestors *` and all other routes have `frame-ancestors 'none'`.
- [ ] **Tenant isolation test:** Verify a test exists that creates two tenants and confirms neither can read the other's listings, orders, or analytics.
- [ ] **Stripe customer ID in DB:** Verify every `users` or `tenants` row that has completed Stripe onboarding has a `stripe_customer_id` column populated.
- [ ] **Supabase Storage bucket policies:** If gig images are stored in Supabase Storage, verify bucket-level RLS policies exist (table RLS does not protect storage objects).

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Missing RLS on table discovered in production | HIGH | 1. Immediately enable RLS (`ALTER TABLE x ENABLE ROW LEVEL SECURITY`). 2. Add restrictive policies. 3. Audit which rows were exposed. 4. Notify affected tenants if data was cross-exposed. |
| `service_role` key leaked to client | CRITICAL | 1. Rotate the key immediately in Supabase Dashboard. 2. Redeploy with the new key. 3. Audit access logs for suspicious activity. |
| Stripe webhook double-processing | MEDIUM | 1. Add `stripe_events` idempotency table. 2. Find and reverse duplicate records manually. 3. Issue refunds for duplicate charges via Stripe Dashboard. |
| Platform account banned for scraping | HIGH | 1. Stop scraping immediately. 2. Contact platform support — explain personal data export use case. 3. Offer to disable the feature for that platform. 4. Notify affected user. |
| Tenant data cross-contamination in analytics | HIGH | 1. Take analytics offline. 2. Identify the SECURITY DEFINER function or missing WHERE clause. 3. Fix and audit all affected RPC functions. 4. Re-compute all analytics from scratch. |
| Widget blocked by CSP on customer sites | LOW | 1. Add route-specific `frame-ancestors *` header for `/embed/*`. 2. Redeploy. 3. Provide customers a snippet with the correct URL pattern. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Retrofitting tenant_id without updating all RLS | Multi-tenant auth foundation | Run table-vs-policy audit script; no table in `pg_tables` without an explicit RLS decision |
| Service role key client-side exposure | Multi-tenant auth foundation | Grep codebase for `SUPABASE_SERVICE_ROLE_KEY` in `"use client"` files; CI lint rule |
| `user_metadata` in RLS policies for tenant scoping | Multi-tenant auth foundation | Review all policies for `user_metadata` references; replace with `app_metadata` or `tenant_memberships` |
| Stripe webhook raw body parsing failure | Stripe payments integration | Stripe webhook CLI test (`stripe listen --forward-to`) confirms 200 response on all event types |
| Missing webhook idempotency | Stripe payments integration | Send same event twice via Stripe CLI; confirm second delivery produces no duplicate DB records |
| Vercel function timeout on webhooks | Stripe payments integration | Load test with Stripe CLI concurrent events; verify Fluid Compute enabled |
| Scraper auth state expiry | Gig scraping import | Simulate expired session in test; confirm user is notified and prompted to re-auth |
| Platform ToS violation risk | Gig scraping import | Rate limit audit: verify delays between requests, stealth plugin active, user consent UI present |
| Widget blocked by CSP | Embeddable widget | Embed test page on a separate domain; confirm widget renders without browser console errors |
| Analytics cross-tenant exposure | Analytics phase | Dual-tenant test: confirm Tenant A's analytics contains zero Tenant B rows |

---

## Sources

- [Supabase Row Level Security docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — HIGH confidence
- [Supabase Security Advisor docs](https://supabase.com/docs/guides/database/database-advisors?lint=0013_rls_disabled_in_public) — HIGH confidence
- [Supabase RLS Best Practices (Makerkit)](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) — MEDIUM confidence
- [Supabase multi-tenant RLS (AntStack)](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) — MEDIUM confidence
- [Stripe webhooks official docs](https://docs.stripe.com/webhooks) — HIGH confidence
- [Stripe idempotent requests docs](https://docs.stripe.com/api/idempotent_requests) — HIGH confidence
- [Stripe webhook best practices (Stigg post-mortem)](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks) — MEDIUM confidence
- [Vercel Functions limits](https://vercel.com/docs/functions/limitations) — HIGH confidence
- [Vercel Fluid Compute](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out) — HIGH confidence
- [Web scraping legal guide (Browserless)](https://www.browserless.io/blog/is-web-scraping-legal) — MEDIUM confidence
- [Playwright bot detection avoidance (ZenRows)](https://www.zenrows.com/blog/avoid-playwright-bot-detection) — MEDIUM confidence
- [CSP frame-ancestors MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors) — HIGH confidence
- [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy) — HIGH confidence
- [Multi-tenancy rebuilding post-mortem, Chandler Nguyen (2025)](https://www.chandlernguyen.com/blog/2025/11/21/i-built-multi-tenancy-on-day-2-on-day-67-i-rebuilt-it/) — MEDIUM confidence
- [CVE-2025-48757 / Supabase service role exposure (byteiota)](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/) — MEDIUM confidence (post-mortem analysis)
- [Multi-tenant analytics security (Qrvey)](https://qrvey.com/blog/comparing-models-for-data-security-in-multi-tenant-analytics/) — MEDIUM confidence

---

*Pitfalls research for: Gig-Engine — freelancer service directory / multi-tenant SaaS marketplace*
*Researched: 2026-02-17*

# Stack Research

**Domain:** Multi-tenant freelancer service catalog / marketplace platform
**Researched:** 2026-02-17
**Confidence:** HIGH (core stack), MEDIUM (scraping/widget delivery), LOW (analytics self-host)

---

## Context: Existing Stack (Do Not Change)

These are already installed and active. Research focused on what to ADD.

| Technology | Version | Status |
|------------|---------|--------|
| Next.js | ^14.2.35 | Active — keep as-is |
| React | ^18.3.1 | Active |
| TypeScript | ^5.9.3 | Active |
| Tailwind CSS | ^3.4.19 | Active |
| Supabase JS | ^2.95.3 | Installed, inactive — reactivate |
| Supabase SSR | ^0.8.0 | Installed, inactive — reactivate |
| Playwright | ^1.58.2 | Active in scripts |
| playwright-extra | ^4.3.6 | Active in scripts |
| puppeteer-extra-plugin-stealth | ^2.11.2 | Active in scripts |
| Zod | ^4.3.6 | Active |
| react-hook-form | ^7.71.1 | Active |
| recharts | ^3.7.0 | Active |
| date-fns | ^4.1.0 | Active |
| @anthropic-ai/sdk | ^0.74.0 | Active in scripts |

---

## Recommended Stack: New Additions

### Payments (Stripe)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `stripe` (server SDK) | `^20.3.1` | Server-side payment processing, webhook handling, Checkout Session creation | Industry standard for marketplaces. Full-featured Node.js SDK. Verify signature on every webhook — non-negotiable for security. Use Checkout Sessions (not Payment Links) so you control the redirect flow and can attach Supabase user metadata. |
| `@stripe/stripe-js` | `^8.7.0` | Load Stripe.js on client, handle Payment Element if embedding payment UI inline | Lazy-loads Stripe script — required if you ever embed Stripe Elements client-side. Only needed if you step away from hosted Checkout. |
| `@stripe/react-stripe-js` | `^5.6.0` | React wrappers for Stripe Elements | Only add if building inline payment forms. Skip if using Stripe-hosted Checkout (simpler path for MVP). |

**Decision: Use Stripe Checkout Sessions (server-created) with webhook sync to Supabase.** Payment Links are no-code but give no control over success/cancel redirects or user association. Checkout Sessions let you attach `client_reference_id` (the Supabase user ID) so webhook handlers can update the right tenant record. Do NOT store payment state only in your app — always treat Supabase as a mirror of Stripe webhook events, not the source of truth.

### Database / Auth (Supabase — reactivation)

No new packages needed. Reactivate what's already installed:

| Component | Current Version | What to Configure |
|-----------|----------------|-------------------|
| `@supabase/supabase-js` | `^2.95.3` | Add `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` to env |
| `@supabase/ssr` | `^0.8.0` | Configure middleware for cookie-based auth (replaces deprecated `@supabase/auth-helpers-nextjs`) |
| Supabase Auth | via dashboard | Enable email provider, add custom access token hook for `tenant_id` JWT injection |

**Multi-tenancy pattern: tenant_id column + RLS.** Do NOT use schema-per-tenant — too complex for this project scale, and Supabase free tier makes schema management painful. Add `tenant_id UUID` to every data table. Use Supabase's Custom Access Token Hook (Auth > Hooks in dashboard) to inject `tenant_id` into the JWT. Then write RLS policies referencing `auth.jwt() ->> 'tenant_id'`. This is the Supabase-native pattern as of 2025.

**Free tier pause prevention:** Supabase pauses free projects after 7 consecutive days of inactivity. Add a GitHub Actions cron (runs twice weekly) or a Supabase Edge Function pinged by launchd to keep the project alive. The existing `com.prettyfly.gig-monitor` launchd runs daily — querying Supabase from it satisfies the activity requirement.

### Multi-Tenancy / Organization Routing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js Middleware | built-in | Detect `?tenant=` param or subdomain, rewrite to tenant-scoped routes | Native to Next.js 14 App Router. No extra package. Use `middleware.ts` at root — runs on every request before page rendering. |

**Routing strategy: path-based first (`/catalog/[tenantSlug]`), subdomain later.** Subdomain routing requires Vercel wildcard domain config and DNS changes — defer to a later phase. Path-based routing works on the existing Vercel deployment with zero infra changes. Middleware reads `params.tenantSlug`, validates against Supabase, passes tenant context to Server Components via headers.

Do NOT try to embed tenant context in cookies for public catalog pages — they need to be publicly accessible without auth. Use slug → tenant lookup at request time via Supabase Server Component.

### Web Scraping (Gig Import)

No new packages needed for the existing Playwright stealth setup. The existing stack (`playwright-extra` + `puppeteer-extra-plugin-stealth`) is correct. Add one pattern improvement:

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `patchright` | `^1.57.0` | Drop-in Playwright replacement with improved CDP-level anti-detection | If Fiverr/Upwork add Cloudflare Turnstile or DataDome in 2025/2026. More robust than stealth plugin alone. |

**Current approach is appropriate.** Playwright + stealth plugin handles Fiverr/Upwork at this scale. patchright is the upgrade path if detection rates increase — it patches automation flags at the Chromium level (navigator.webdriver = false, removes HeadlessChrome UA) rather than post-hoc JS injection. Monitor BrowserScan scores periodically.

For gig import into the catalog: parse existing markdown listings (`listings/*.md`) as the primary data source first. Only scrape live platform data for auto-refresh (already handled by the Gig Monitor launchd). No new scraping infrastructure needed for MVP.

### Embeddable Widgets

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `vite` (build tool for widget only) | `^7.3.1` | Bundle widget JS for third-party embed | Vite produces optimized IIFE/UMD bundles. Do NOT use Next.js to build the widget — it produces SSR-dependent chunks. The widget needs to be a self-contained vanilla JS or React bundle. |
| `@vitejs/plugin-react` | `^5.1.4` | React JSX support in Vite widget build | Only if embedding React in the widget. Shadow DOM + vanilla JS is lighter. |

**Embedding strategy: `<script>` tag + Shadow DOM, NOT iframe.** Here's why:
- **iframe**: Easy but breaks responsive design, height management is fragile, and cross-origin cookie restrictions complicate Stripe redirect flows
- **Shadow DOM script**: Widget JS loads from your CDN (Vercel static export or separate bundle), renders into a shadow root, inherits no host-page styles, fully isolated. Works inline on any webpage.

**Implementation pattern:**
```html
<!-- What clients paste into their site -->
<div id="gig-catalog" data-tenant="alex-prettyfly"></div>
<script src="https://gig-engine.vercel.app/widget.js" async></script>
```

Widget JS reads `data-tenant`, fetches catalog from your public API route, renders via React + Shadow DOM. Build with Vite as a separate build target (`vite.config.widget.ts`). Serve the built `widget.js` from Next.js public folder or Vercel CDN.

**Styling in widgets:** Use Tailwind with `@layer` scoped to shadow root, or use CSS-in-JS (emotion). Tailwind output CSS can be inlined into the shadow root as a `<style>` tag — avoids any style leakage.

### Analytics

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `posthog-js` | `^1.350.0` | Frontend event tracking, page views, user identification | Free tier: 1M events/month, 5k session recordings. No infrastructure needed. Works with Next.js App Router via their official `posthog-nextjs` pattern. |
| `posthog-node` | `^5.24.16` | Server-side event tracking from API routes and webhooks | Track payment completions, gig imports, tenant signups from server context. |

**Use PostHog Cloud (free tier), NOT self-hosted.** Self-hosted PostHog requires 4 vCPU / 16GB RAM minimum — this is a Vercel app, not a VPS. PostHog Cloud's free tier (1M events/month) is more than sufficient for early stages. Per-tenant analytics queries can be filtered by `tenantId` property attached to every event. This also provides funnel analytics for the "create catalog → enable payments" conversion flow.

**Do NOT use Plausible for this project.** Plausible is great for privacy-first page-view analytics but lacks event tracking, funnel analysis, and per-tenant property filtering — all needed here. PostHog is the correct choice.

### Email (Transactional)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `resend` | `^6.9.2` | Transactional email (tenant invite, payment confirmation, order receipt) | Use from API routes. Free tier: 3,000 emails/month. SDK wraps SMTP complexity. |
| `@react-email/components` | `^1.0.7` | Typed React components for email templates | Render email HTML server-side before passing to Resend. Avoids string-template hell. |

**Why Resend over SendGrid/Mailgun:** Resend was purpose-built for Next.js/React stacks. First-class React Email integration. Free tier sufficient for early stages. No vendor lock-in on template DSL.

### Supporting Libraries (No Change Needed)

| Library | Current Version | Role |
|---------|----------------|------|
| `zod` | `^4.3.6` | Validate Stripe webhook payloads, form inputs, tenant config |
| `react-hook-form` | `^7.71.1` | Service catalog creation forms, tenant onboarding |
| `recharts` | `^3.7.0` | Analytics dashboard for tenant revenue/views |
| `lucide-react` | `^0.563.0` | Icons |
| `@hookform/resolvers` | `^5.2.2` | Zod → react-hook-form bridge |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Payments | Stripe Checkout Sessions | Stripe Payment Links | No code control — can't attach Supabase user ID to payment |
| Payments | Stripe Checkout Sessions | Paddle / Lemon Squeezy | Overkill; no reason to switch away from Stripe which is already installed |
| Multi-tenancy | RLS + tenant_id column | Schema-per-tenant | Schema isolation is harder to query across tenants, more complex migrations, overkill for <100 tenants |
| Multi-tenancy | Path-based routing | Subdomain routing | Requires DNS + Vercel wildcard config — defer; adds zero value in MVP |
| Analytics | PostHog Cloud | Plausible | Plausible lacks event tracking, funnels, per-tenant filtering |
| Analytics | PostHog Cloud | Self-hosted PostHog | Requires 4 vCPU / 16GB RAM — incompatible with Vercel deployment |
| Analytics | PostHog Cloud | Vercel Analytics | Too limited — only page views, no custom events or tenant grouping |
| Widget delivery | Script tag + Shadow DOM | iframe embed | iframe height management is fragile; cross-origin Stripe redirects are problematic |
| Widget delivery | Script tag + Shadow DOM | Next.js export | Next.js output can't be embedded as a widget — requires full page context |
| Email | Resend | SendGrid | More complex setup, template DSL not React-native |
| Scraping | playwright-extra + stealth | Apify / BrightData | Adds per-request cost; current scripts already work; managed service overkill for own-platform scraping |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@supabase/auth-helpers-nextjs` | Deprecated as of 2024 — replaced by `@supabase/ssr` | `@supabase/ssr` (already installed) |
| Stripe Payment Links | No control over post-payment redirect or user association | Stripe Checkout Sessions with `client_reference_id` |
| `next-auth` / Auth.js | Adds another auth layer on top of Supabase Auth — conflicts | Supabase Auth natively handles all auth needs |
| Schema-per-tenant Supabase | Migration complexity scales poorly; Supabase free tier complicates multi-schema access | RLS + `tenant_id` column on every table |
| Self-hosted PostHog | Requires VPS with 4+ vCPU — incompatible with Vercel-only deployment | PostHog Cloud free tier |
| `react-query` / `tanstack-query` | Already have Supabase SSR for server-side data; adds complexity | Supabase Server Components + `@supabase/ssr` |

---

## Installation

```bash
# Payments
npm install stripe @stripe/stripe-js @stripe/react-stripe-js

# Analytics
npm install posthog-js posthog-node

# Email
npm install resend @react-email/components

# Widget build tooling (dev only)
npm install -D vite @vitejs/plugin-react

# Scraping upgrade (only if detection rates increase)
npm install patchright
```

Note: Supabase packages already installed — no reinstall needed. Activate by adding env vars.

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|----------------|-------|
| `stripe@20.3.1` | Node.js 18+ | Vercel runtime satisfies this |
| `@stripe/stripe-js@8.7.0` | React 18 | Matches existing React version |
| `posthog-js@1.350.0` | Next.js 14 App Router | Use `Suspense` wrapper for client component — PostHog uses `useSearchParams` internally |
| `@supabase/ssr@0.8.0` | Next.js 14 | Do not mix with `@supabase/auth-helpers-nextjs` — they conflict |
| `vite@7.3.1` | Used only for widget sub-build | Separate `vite.config.widget.ts`, not integrated into Next.js build |
| `patchright@1.57.0` | Node.js 18+, macOS/Linux | Drop-in API replacement for Playwright — import `{ chromium } from 'patchright'` |

---

## Stack Patterns by Variant

**If tenant count stays under 20 (early stage):**
- Keep path-based routing (`/catalog/[slug]`)
- No subdomain setup needed
- Supabase free tier is sufficient

**If tenant count exceeds 50:**
- Upgrade Supabase to Pro ($25/month) — eliminates pause risk and unlocks more connections
- Consider adding Vercel wildcard domain for subdomain routing
- PostHog Cloud still free at this scale (1M events/month)

**If widget embedding becomes a primary channel:**
- Extract widget into its own Vite build pipeline
- Deploy `widget.js` to Vercel public folder with aggressive CDN caching headers
- Add `?v={hash}` cache-busting on each widget release

**If Fiverr/Upwork add Cloudflare Turnstile (scraper upgrade):**
- Replace `playwright-extra + puppeteer-extra-plugin-stealth` with `patchright`
- Keep stealth plugin as fallback — not all platforms use the same detection
- Add proxy rotation if IP banning starts (Bright Data or residential proxies)

---

## Sources

- npm registry (verified via `npm view` on 2026-02-17) — stripe@20.3.1, @stripe/stripe-js@8.7.0, @stripe/react-stripe-js@5.6.0, posthog-js@1.350.0, posthog-node@5.24.16, resend@6.9.2 — HIGH confidence
- WebSearch: "Stripe payments Next.js 14 Supabase multi-tenant 2025" — Vercel nextjs-subscription-payments repo, makerkit.dev Stripe docs — MEDIUM confidence
- WebSearch: "multi-tenant SaaS Next.js Supabase RLS 2025" — Supabase official RLS docs confirmed pattern — HIGH confidence
- WebSearch: "Supabase custom access token hook tenant_id 2025" — Official Supabase auth-hooks docs — HIGH confidence
- WebSearch: "Next.js multi-tenant subdomain routing middleware 2025" — Official Next.js multi-tenant guide at nextjs.org/docs/app/guides/multi-tenant — HIGH confidence
- WebSearch: "embeddable widgets Next.js 2025" — makerkit.dev embeddable widget tutorial, Vercel community discussion — MEDIUM confidence
- WebSearch: "PostHog cloud vs self-hosted 2025 2026" — PostHog GitHub, pricing confirmed 1M free events/month — HIGH confidence
- WebSearch: "Supabase free tier pause 7 days 2025 2026" — Supabase official troubleshooting docs — HIGH confidence
- WebSearch: "Playwright stealth anti-detection 2025 2026" — Multiple sources confirming playwright-extra + patchright approach — MEDIUM confidence

---

*Stack research for: Gig-Engine multi-tenant SaaS milestone*
*Researched: 2026-02-17*

# CLAUDE.md - PrettyFly Acquisition Engine

> AI assistant guide for developing the PrettyFly Gig Economy Acquisition Engine.

## Current State (as of 2026-02-10 audit remediation)

**Phase 1 scaffold + full architecture audit remediation COMPLETE.** A 3-agent audit found 46 issues (6 CRITICAL, 11 HIGH, 17 MEDIUM, 12 LOW). All CRITICAL and HIGH issues are resolved. Demo readiness score: **76.4/100**. Next: connect Supabase, then Phase 2.

### What's Built
- 90+ source files across 13 App Router routes
- 15 SQL migrations (11 tables + seed + triggers + RLS + FK/indexes)
- 25+ React components (13 UI + 3 layout + 5 dashboard + 5 shared)
- 5 custom hooks (module-scope Supabase client pattern), 3 utility modules, 4 seed data files
- Supabase auth middleware (`src/middleware.ts`) with cookie refresh
- Auth guards on all 9 API routes (webhook uses API key auth)
- SQL injection prevention on opportunity search
- Dark mode by default, pillar color system throughout
- Build verified: `npm run build` passes all routes, `npm run lint` zero warnings

### Audit Remediation Summary (46 issues)
- **CRITICAL (6/6 fixed)**: Auth middleware, API auth guards, SQL injection, RLS hardening, ESLint fix, placeholder client fix
- **HIGH (11/11 fixed)**: Seed data alignment, UUID mismatches, FK constraints, indexes, type safety, async params, module-scope clients
- **MEDIUM (12/17 fixed)**: Redundant updated_at, pagination, env docs, model ID, types header, dev deps
- **LOW (5/12 fixed)**: Minor cleanups addressed as encountered

### What's NOT Built Yet
- Supabase connection (needs `.env.local` values — middleware + auth guards ready)
- Drag-and-drop on Kanban (wired for @dnd-kit, not connected)
- Recharts visualizations (ProposalFunnel component done, others placeholder)
- Form validation (React Hook Form + Zod schemas exist but not wired to all forms)
- AI proposal generation (Edge Function not yet created)
- Test suite (no test runner configured yet)

### Known Warnings (from review)
- Webhook API key comparison uses `===` (timing-safe comparison recommended for production)
- Search sanitization regex could be more comprehensive (add `"'!*`)
- 3 hooks still set redundant `updated_at` (DB trigger handles it)

---

## Project Overview

**Name:** prettyfly-acquisition-engine
**Type:** Internal operations tool for PrettyFly.ai
**Owner:** Alex, Founder of PrettyFly.ai

A centralized operations platform for managing, tracking, and optimizing freelance project acquisition across multiple gig economy platforms (Upwork, Fiverr, Toptal, Arc.dev, and others). Consolidates listing management, proposal tracking, delivery pipelines, and revenue analytics into one command center.

**Core problem:** Managing freelance operations across 4+ platforms creates fragmentation — scattered proposals, no unified pipeline view, manual gig performance tracking, disconnected delivery workflows, and zero visibility into which platforms/gig types drive the most revenue per hour invested.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in Supabase credentials
cp .env.local.example .env.local

# 3. Start Supabase locally (or connect to hosted project)
npx supabase start
npx supabase db push

# 4. Generate TypeScript types from your running DB
npm run db:generate-types

# 5. Run dev server
npm run dev
```

---

## Tech Stack

| Layer          | Technology                                    |
|----------------|-----------------------------------------------|
| Frontend       | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend        | Supabase (PostgreSQL + Auth + Edge Functions) |
| Hosting        | Vercel (frontend), Railway (backend workers if needed) |
| Automation     | n8n for workflows                             |
| Charts         | Recharts                                      |
| Drag-and-Drop  | @dnd-kit/core, @dnd-kit/sortable              |
| Forms          | React Hook Form + Zod validation              |
| Dates          | date-fns                                      |
| Auth           | Supabase email auth (single user for MVP)     |
| Project Mgmt   | Linear                                        |

### Installed Packages (package.json)
**Runtime:** next@14, react, react-dom, @supabase/supabase-js, @supabase/ssr, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, recharts, date-fns, react-hook-form, @hookform/resolvers, zod, lucide-react, clsx, tailwind-merge, class-variance-authority
**Dev:** typescript, @types/react, @types/react-dom, @types/node, eslint, eslint-config-next, prettier, tailwindcss@3, autoprefixer, postcss

---

## Project Structure (Actual Files)

```
prettyfly-acquisition-engine/
├── CLAUDE.md                              # This file — AI assistant guide
├── README.md
├── package.json                           # Scripts: dev, build, lint, format, db:*
├── next.config.js
├── tailwind.config.ts                     # Dark mode, pillar colors, shadcn vars
├── tsconfig.json                          # Strict mode, @/* path alias
├── components.json                        # shadcn/ui configuration
├── postcss.config.js
├── .eslintrc.json
├── .env.local.example                     # Template for required env vars
├── .gitignore
├── supabase/
│   ├── config.toml                        # Supabase project config (signup disabled)
│   └── migrations/
│       ├── 001_create_platforms.sql
│       ├── 002_create_service_pillars.sql
│       ├── 003_create_gig_listings.sql
│       ├── 004_create_opportunities.sql
│       ├── 005_create_proposal_templates.sql
│       ├── 006_create_projects.sql
│       ├── 007_create_portfolio_items.sql
│       ├── 008_create_revenue_entries.sql
│       ├── 009_create_daily_metrics.sql
│       ├── 010_create_content_blocks.sql
│       ├── 011_create_gig_versions.sql
│       ├── 012_seed_initial_data.sql      # 8 platforms + 5 pillars (aligned w/ TS)
│       ├── 013_add_updated_at_triggers.sql
│       ├── 014_enable_rls.sql             # RLS + permissive policies
│       └── 015_add_missing_fk_and_indexes.sql  # FK + indexes + NULLS NOT DISTINCT
├── src/
│   ├── middleware.ts                          # Supabase auth cookie refresh middleware
│   ├── app/                               # Next.js App Router (13 routes)
│   │   ├── layout.tsx                     # Root layout: dark mode, Sidebar shell
│   │   ├── page.tsx                       # Dashboard home: metrics, targets, pipeline
│   │   ├── globals.css                    # Tailwind + shadcn CSS variables
│   │   ├── dashboard/page.tsx             # Revenue analytics dashboard
│   │   ├── pipeline/
│   │   │   ├── page.tsx                   # Kanban + table view toggle
│   │   │   └── [id]/page.tsx             # Opportunity detail
│   │   ├── proposals/
│   │   │   ├── page.tsx                   # Quick-fire generator + template sidebar
│   │   │   └── templates/page.tsx         # Full template library
│   │   ├── gigs/
│   │   │   ├── page.tsx                   # Gig grid with pillar filters
│   │   │   └── [id]/page.tsx             # Gig detail + version history
│   │   ├── projects/
│   │   │   ├── page.tsx                   # Active projects + status metrics
│   │   │   └── [id]/page.tsx             # Project detail + checklists
│   │   ├── portfolio/page.tsx             # Case studies + content blocks
│   │   ├── analytics/page.tsx             # Deep analytics + recommendations
│   │   └── settings/page.tsx              # Platform profiles + preferences
│   ├── components/
│   │   ├── ui/                            # 13 shadcn-style base components
│   │   │   ├── button.tsx                 # Variants: default/destructive/outline/secondary/ghost/link
│   │   │   ├── card.tsx                   # Card, CardHeader, CardTitle, CardContent, etc.
│   │   │   ├── badge.tsx                  # Variants: default/secondary/destructive/outline
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── dialog.tsx                 # Portal-based dialog
│   │   │   ├── table.tsx                  # Table, TableHeader, TableRow, etc.
│   │   │   ├── tabs.tsx                   # Context-based tabs
│   │   │   ├── select.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── sheet.tsx                  # Side drawer
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx                # Collapsible nav with lucide icons
│   │   │   ├── Header.tsx                 # Page title, search, notifications
│   │   │   ├── PageContainer.tsx          # Scrollable content wrapper
│   │   │   └── index.ts
│   │   ├── dashboard/
│   │   │   ├── MetricCard.tsx             # KPI card with trend indicator
│   │   │   ├── DailyTargets.tsx           # Progress bars for daily goals
│   │   │   ├── PipelineSnapshot.tsx       # Stage counts overview
│   │   │   ├── RevenueChart.tsx           # Recharts placeholder
│   │   │   └── index.ts
│   │   ├── shared/
│   │   │   ├── PlatformBadge.tsx          # Color-coded platform badges
│   │   │   ├── PillarBadge.tsx            # Pillar dot + color from constants
│   │   │   ├── StatusBadge.tsx            # Universal status badge
│   │   │   ├── DateRangePicker.tsx        # 7d/30d/90d toggle
│   │   │   ├── SearchFilter.tsx           # Search input with icon
│   │   │   └── index.ts
│   │   ├── pipeline/                      # (empty — Phase 2: KanbanBoard, OpportunityCard)
│   │   ├── proposals/                     # (empty — Phase 3: ProposalGenerator, QuickFirePanel)
│   │   ├── gigs/                          # (empty — Phase 3: GigCard, GigForm, PricingTierEditor)
│   │   ├── projects/                      # (empty — Phase 4: ProjectCard, DeliveryChecklist, TimeTracker)
│   │   └── analytics/                     # (empty — Phase 4: RevenueBySeries, WinRateChart)
│   ├── lib/
│   │   ├── utils.ts                       # cn() — clsx + tailwind-merge helper
│   │   ├── supabase/
│   │   │   ├── client.ts                  # Browser client via createBrowserClient
│   │   │   ├── server.ts                  # Server client via createServerClient + cookies
│   │   │   └── types.ts                   # Database type stubs (regenerate after Supabase connect)
│   │   ├── utils/
│   │   │   ├── constants.ts               # Stages, statuses, pillar colors, labels
│   │   │   ├── formatters.ts              # Currency, dates, percentages, hours
│   │   │   └── calculations.ts            # Win rate, hourly rate, pipeline value, conversions
│   │   └── hooks/
│   │       ├── useOpportunities.ts        # CRUD + stage updates for pipeline
│   │       ├── useGigs.ts                 # CRUD for gig listings
│   │       ├── useRevenue.ts              # Revenue entries + summary aggregation
│   │       ├── useProposals.ts            # Template CRUD + usage tracking
│   │       └── useDailyMetrics.ts         # Daily KPI logging + retrieval
│   └── data/
│       ├── seed-platforms.ts              # 8 platforms with statuses
│       ├── seed-pillars.ts                # 5 pillars with colors
│       ├── seed-templates.ts              # 7 proposal templates with full text
│       └── seed-gigs.ts                   # 10 priority gigs with 3-tier pricing
└── docs/
    ├── STRATEGY.md                        # 90-day revenue plan
    ├── PLATFORM-GUIDES.md                 # Upwork, Fiverr, Toptal optimization
    ├── PROPOSAL-TEMPLATES.md              # Full proposal template library
    └── GIG-COPY.md                        # Gig listing copy + pricing tiers
```

---

## Database Schema

Supabase PostgreSQL with Row Level Security. Migrations are numbered sequentially in `supabase/migrations/`.

### Core Tables

| Table               | Purpose                                          |
|---------------------|--------------------------------------------------|
| `platforms`         | Platform profiles (Upwork, Fiverr, Toptal, etc.) |
| `service_pillars`   | Five service categories with colors               |
| `gig_listings`      | All gig/listing data across platforms             |
| `gig_versions`      | Version history for listing copy changes          |
| `opportunities`     | Unified pipeline: discovery through completion    |
| `proposal_templates`| Reusable proposal templates by pillar/platform    |
| `projects`          | Active delivery tracking with milestones          |
| `portfolio_items`   | Case studies: problem/solution/result/metrics     |
| `revenue_entries`   | All revenue with platform fees and net amounts    |
| `daily_metrics`     | Daily KPI snapshots per platform                  |
| `content_blocks`    | Reusable content: bios, credentials, processes    |

### Opportunity Pipeline Stages

```
Discovered → Proposal Sent → Interview/Call → Contracted → In Progress → Delivered → Review Requested → Complete
```

### Five Service Pillars

1. **Automation & Workflows** (`#3B82F6` blue) - n8n/Make/Zapier, GHL, CRM workflows
2. **AI Implementation** (`#8B5CF6` purple) - Chatbots, RAG systems, AI assistants
3. **System Architecture** (`#10B981` green) - CRM setup, tech audits, migrations
4. **Web App Development** (`#F59E0B` amber) - Portals, dashboards, landing pages
5. **Strategy & Consulting** (`#EF4444` red) - Process mapping, fractional CTO, audits

These pillar colors must be used consistently across all UI components (badges, charts, pipeline cards).

---

## Key Features

### 1. Platform Profile & Gig Manager
- CRUD for gig listings with version history tracking
- 3-tier pricing editor (Basic / Standard / Premium)
- Cross-platform gig duplication
- Performance metrics per listing (impressions, clicks, orders, conversion)

### 2. Opportunity Pipeline
- Drag-and-drop Kanban board (primary view) with table view toggle
- Filter by platform, pillar, stage
- Auto-calculated win rates by platform, category, and template
- Daily proposal target progress bars

### 3. Proposal Engine
- Template library organized by service pillar + platform
- AI-assisted generation: paste job description, select template, get personalized draft
- Quick-fire mode: streamlined UI for rapid morning proposal sessions
- Performance tracking (sent/viewed/responded/won)

### 4. Delivery Tracker
- Active projects with deadlines, milestones, checklists
- Time tracking per project for effective hourly rate calculation
- Auto-trigger review request workflow on delivery completion

### 5. Revenue Analytics Dashboard
- Revenue by platform, pillar, and gig type
- Effective hourly rate (contract value / actual hours)
- Trend charts: weekly/monthly revenue, proposal volume, win rates
- 90-day forecast based on pipeline + historical conversion rates

### 6. Content & Asset Library
- Portfolio case studies (problem/solution/result/metrics structure)
- Testimonial/review collection
- Reusable content blocks

### 7. Platform Performance Optimizer
- A/B testing log for titles, descriptions, pricing
- Recommended actions engine based on performance data

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run Supabase locally
npm run db:start     # npx supabase start

# Run migrations
npm run db:push      # npx supabase db push

# Reset database (drops + re-runs all migrations)
npm run db:reset     # npx supabase db reset

# Generate TypeScript types from running DB
npm run db:generate-types

# Lint
npm run lint

# Format
npm run format       # npx prettier --write .
```

### Build Verification
Always run `npm run build` before committing. The project must compile with zero errors. ESLint is pinned to v8 (`eslint@^8.57.0` + `eslint-config-next@^14.2.35`) to avoid the Next.js 14 + ESLint 9 flat config mismatch.

### Font Note
The project uses system fonts (`font-sans`) instead of Google Fonts to avoid build failures in restricted network environments. If you need Inter, install it as a local font package instead of using `next/font/google`.

---

## Implementation Phases

### Phase 1: Foundation + Audit Remediation --- COMPLETE
- [x] Next.js 14 + Tailwind + shadcn/ui scaffold
- [x] Supabase schema migrations (15 files) + seed data (aligned SQL ↔ TS)
- [x] Layout shell: collapsible sidebar, header, page container
- [x] Dashboard home with metric cards + daily targets + pipeline snapshot
- [x] All 13 routes created with appropriate UI
- [x] Shared components (badges, filters, date picker)
- [x] Custom hooks + utility modules (module-scope Supabase clients)
- [x] Docs directory (strategy, platform guides, templates, gig copy)
- [x] Auth middleware (`src/middleware.ts`) — Supabase cookie refresh
- [x] Auth guards on all API routes (9 routes use `supabase.auth.getUser()`)
- [x] SQL injection prevention on opportunity search
- [x] RLS hardened + open signup disabled in `supabase/config.toml`
- [x] ESLint + @types/react version mismatches fixed
- [x] Supabase client placeholder fallback with console.warn
- [x] FK constraint + indexes (migration 015)
- [x] Async params pattern on all dynamic routes
- [x] Type safety improvements (Array.isArray guards, removed unsafe casts)
- [x] Select component label context fix
- [x] ProposalFunnel Recharts component with proper typing
- [x] Claude model ID updated to claude-sonnet-4-5-20250929
- [x] Dev dependencies properly categorized in package.json
- [ ] Wire dashboard metric cards to live Supabase data

### Phase 2: Core Pipeline --- NEXT (Connect Supabase + Go Live)
- [ ] Connect `.env.local` to Supabase project (create project + fill creds)
- [ ] Run `npm run db:generate-types` to replace hand-maintained types
- [ ] Re-add `<Database>` generic to Supabase clients after type generation
- [ ] Wire `useOpportunities` hook to real data
- [ ] Opportunity CRUD (create/edit forms with Zod validation)
- [ ] Kanban board with @dnd-kit drag-and-drop (stage updates)
- [ ] Opportunity detail page form
- [ ] Pipeline filtering (by platform, pillar, stage)
- [ ] Supabase real-time subscription for pipeline updates
- [ ] Basic proposal template management CRUD

### Phase 3: Gig Manager + Proposals
- [ ] Gig listing CRUD with version history
- [ ] 3-tier pricing editor component (PricingTierEditor)
- [ ] Proposal template library with AI generation (Edge Function)
- [ ] Quick-fire proposal mode with clipboard integration
- [ ] Content block library CRUD
- [ ] Cross-platform gig duplication

### Phase 4: Delivery + Analytics
- [ ] Project tracker with milestone checklists
- [ ] Time tracking per project (time_entries_json)
- [ ] Revenue entry management + aggregation
- [ ] Analytics dashboard with Recharts (bar, line, pie charts)
- [ ] Daily metrics logging and retrieval
- [ ] Effective hourly rate calculations

### Phase 5: Polish + Automation
- [ ] Auth UI flow (login page, protected routes)
- [ ] Review request workflow triggers
- [ ] Retainer conversion tracking
- [ ] Performance recommendation engine
- [ ] CSV export for revenue data
- [ ] Notification system for deadlines
- [ ] Test suite setup (Vitest or Jest)
- [ ] Vercel deployment + production environment

---

## Coding Conventions

### General Rules
- TypeScript strict mode everywhere - no `any` types
- Use Next.js App Router conventions (server components by default, `"use client"` only when needed)
- All forms use React Hook Form + Zod schemas
- All date handling through date-fns (timezone-safe)
- Supabase client via module-scope singleton (`lib/supabase/client.ts` for browser, `lib/supabase/server.ts` for server)
- All API routes must check `supabase.auth.getUser()` and return 401 if no user (webhook route uses API key instead)

### File Naming
- Components: PascalCase (`MetricCard.tsx`)
- Utilities/hooks: camelCase (`useOpportunities.ts`, `calculations.ts`)
- Pages: `page.tsx` inside route directories (Next.js App Router convention)
- SQL migrations: numbered sequentially (`001_create_platforms.sql`)

### Component Patterns
- Colocate component-specific types in the same file
- Shared types go in `lib/supabase/types.ts` (auto-generated) or dedicated type files
- Use shadcn/ui primitives as building blocks - don't reinvent form controls, dialogs, etc.
- Keep server components as the default; add `"use client"` only for interactivity

### Styling
- Dark mode by default (operational tool used daily, often early morning)
- Tailwind utility classes - no CSS modules or styled-components
- Service pillar colors must remain consistent across all views
- Mobile responsive - proposal submissions and pipeline updates from phone

### Database
- All tables use `id` (UUID), `created_at`, `updated_at`
- Foreign keys with proper indexes
- Row Level Security enabled on all tables
- Migrations are idempotent and numbered sequentially
- JSON columns (`_json` suffix) for flexible nested data (milestones, checklists, time entries)

### API & Data Fetching
- Use Supabase client directly in server components for reads
- Use Supabase real-time subscriptions for pipeline updates
- Edge Functions for AI proposal generation (server-side Claude API calls)
- Keep API keys and secrets in `.env.local` only

---

## Environment Variables

Required in `.env.local` (never committed):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=          # For AI proposal generation
WEBHOOK_API_KEY=            # For n8n webhook authentication
```

---

## Business Context for AI Assistants

This tool supports a 90-day revenue target of $25,000/month through blended marketplace income:

- **Fiverr:** Productized gigs, volume play, 3-tier pricing ($97-$1,497)
- **Upwork:** Precision proposals, higher-ticket contracts ($500-$5,000)
- **Toptal/Arc.dev:** Premium positioning, enterprise clients ($100-200/hr)
- **Retainer conversions:** Moving marketplace clients to ongoing PrettyFly partnerships

The operator (Alex) is a CTO and founder with expertise in automation, AI, CRM systems, and web development. The tool must support a daily workflow: morning proposal session (7:00-7:45 AM), delivery work, and evening analytics review.

### Key Metrics Tracked
- Proposals sent / response rate / win rate (by platform, template, pillar)
- Gig impressions / clicks / orders / conversion rate
- Revenue by platform, pillar, gig type
- Effective hourly rate per project
- Review velocity and platform level progression

---

## Working Style Preferences

1. **Be direct** - Clear recommendations, not endless options
2. **Explain decisions** - Brief rationale for technical choices
3. **Challenge bad ideas** - Push back if an approach has issues
4. **Think in phases** - Break everything into manageable sessions
5. **Quality over speed** - But ship something working first
6. **Commit before agent mode** - Always checkpoint before changes
7. **Fresh chats every 20 messages** - Prevent context pollution
8. **Plan mode for multi-file changes** - Measure twice, cut once

---

## Critical Technical Decisions

- **Supabase Real-time** for pipeline updates (drag-and-drop immediately reflected)
- **Recharts** for dashboard visualizations (lightweight, React-native)
- **@dnd-kit** for Kanban drag-and-drop (best React DnD library)
- **React Hook Form + Zod** for all forms
- **Edge Functions** for AI proposal generation (Claude API server-side)
- **date-fns** for all date handling
- **No external auth providers** for MVP - Supabase email auth only

---

## Common Pitfalls

- Do not use `getServerSideProps` or `getStaticProps` - this is App Router, use server components and `fetch`/Supabase client directly
- Do not install competing UI libraries - shadcn/ui is the component system
- Do not use Moment.js - use date-fns
- Do not store secrets in client-side code - use Edge Functions for API calls
- Do not skip Zod validation on forms - every form needs a schema
- Do not use CSS-in-JS solutions - Tailwind only
- Do not create light-mode-only designs - dark mode is the default and primary theme
- Do not use `next/font/google` - system fonts only (network restrictions)
- Do not create new migrations without incrementing the sequence number (check existing max)
- Do not modify `src/lib/supabase/types.ts` manually once Supabase is connected - regenerate via `npm run db:generate-types`. Current types are hand-maintained stubs.
- Do not add `<Database>` generic to Supabase client/server until types are auto-generated (hand-maintained types cause `never` resolution in Supabase's internal GenericSchema constraints)
- Do not set `updated_at` manually in insert/update payloads - DB trigger (`013_add_updated_at_triggers.sql`) handles it
- Do not use `export const dynamic` in files with `"use client"` - Next.js silently ignores it
- Dynamic route params must use `Promise<{ id: string }>` pattern with `await` (Next.js 14+ requirement)
- Supabase client in React hooks must be at module scope, not inside the hook function (avoids recreating on every render)

---

## Development Session Guide

### Starting a New Session
1. Read this file first to understand current state
2. Check `git log --oneline -10` to see recent progress
3. Pick the next unchecked item from the current phase above
4. Commit frequently — checkpoint before any multi-file refactors

### Key Architectural Decisions Already Made
- **Sidebar is client component** (`"use client"`) — uses `usePathname` for active state and `useState` for collapse
- **Pages are server components by default** — only add `"use client"` when the page itself needs interactivity (pipeline, gigs, proposals have it for filters/view toggles)
- **UI components use class-variance-authority** for variant management (button, badge)
- **Hooks pattern:** Each domain hook (useOpportunities, useGigs, etc.) manages its own state and Supabase queries. They call `createClient()` at **module scope** (not inside the hook function) from `@/lib/supabase/client`.
- **Auth middleware** (`src/middleware.ts`) refreshes Supabase cookies on every request. Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, and static assets.
- **API auth pattern:** Every API route calls `supabase.auth.getUser()` at the top and returns 401 if no user. Exception: `webhooks/n8n/route.ts` uses `x-api-key` header auth.
- **Pillar colors flow through constants.ts** → components read from `PILLAR_COLORS` record or `SERVICE_PILLARS` array. Tailwind config also has `pillar.*` colors for use in classes.
- **Canonical pillar names** (aligned across SQL seed, TS constants, and TS seed): Automation & Workflows, AI Implementation, System Architecture, Web App Development, Strategy & Consulting
- **Dashboard uses server-imported components** — MetricCard, PipelineSnapshot are server-compatible; RevenueChart/ProposalFunnel are client (use Recharts)
- **Database generic omitted** from Supabase clients until types are auto-generated. Hand-maintained types in `types.ts` don't satisfy `@supabase/supabase-js` v2.95's `GenericSchema` constraints.

### File Conventions to Follow
| Pattern | Example | When |
|---------|---------|------|
| `"use client"` at top | `src/app/pipeline/page.tsx` | Page has interactivity (state, handlers) |
| No directive | `src/app/dashboard/page.tsx` | Server component (data fetching, no state) |
| Hook returns `{ data, loading, fn }` | `useOpportunities.ts` | All custom hooks follow this shape |
| `cn()` for conditional classes | `cn("base", condition && "extra")` | Every component with dynamic styles |
| Barrel exports via `index.ts` | `components/layout/index.ts` | Each component directory has one |

### How to Add a New Feature
1. **Migration first** — if it needs new DB columns/tables, create `0XX_description.sql`
2. **Types** — regenerate types or add to the stub in `types.ts`
3. **Hook** — add or extend the relevant domain hook
4. **Component** — build in the appropriate `components/` subdirectory
5. **Page** — wire into the App Router page
6. **Test** — verify with `npm run build` (no test runner yet)

### Supabase Connection Checklist (for Phase 2 kickoff)
1. Create Supabase project at supabase.com (or run locally with `npx supabase start`)
2. Run all 15 migrations: `npx supabase db push`
3. Copy project URL and anon key to `.env.local`
4. Set `WEBHOOK_API_KEY` in `.env.local` for n8n integration
5. Generate types: `npm run db:generate-types`
6. Add `<Database>` generic back to `createBrowserClient()` in `client.ts` and `createServerClient()` in `server.ts`
7. Verify: `npm run build` still passes with typed client
8. Verify: open any page that uses a hook — should see empty state, not errors

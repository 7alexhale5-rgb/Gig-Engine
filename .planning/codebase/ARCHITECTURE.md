# Architecture

**Analysis Date:** 2026-02-17

## Pattern Overview

**Overall:** Hybrid markdown-first + Next.js app with dual operation modes:
1. **Live UI** — Next.js 14 web application displaying listings and dashboards (Vercel deployment)
2. **Automation Scripts** — Node.js scripts (MJS) handling scraping, report generation, and system integration (launchd scheduled)

**Key Characteristics:**
- Document-driven: Service listings live as markdown files in `listings/` (62 total: 31 Fiverr + 31 Upwork)
- Dual validation layers: Zod schemas for form input + static markdown parsing for live listings
- Clean separation between UI concerns (components) and core data logic (lib/)
- Metadata extracted at build time from markdown frontmatter and content parsing
- Scripts run independently on schedule (morning report 6:45 AM, weekly summary Sundays 9 AM)

## Layers

**Presentation Layer:**
- Purpose: Next.js App Router pages and React components, real-time UI updates
- Location: `src/components/`, `src/app/`
- Contains: Page layouts, Kanban board, forms, charts, dashboards
- Depends on: Data layer (Supabase hooks, seed data, listings parser)
- Used by: End users via web browser

**Data Layer:**
- Purpose: Supabase ORM, Zod validation schemas, static markdown parsing
- Location: `src/lib/schemas/`, `src/lib/supabase/`, `src/lib/listings.ts`
- Contains: Type definitions, validation rules, database client configuration, listing parser
- Depends on: Supabase (or mock during build), filesystem access for markdown
- Used by: Presentation layer (components via hooks), scripts via direct imports

**Utilities Layer:**
- Purpose: Formatting, calculations, constants, shared helpers
- Location: `src/lib/utils/`
- Contains: Currency formatting, date formatting, opportunity stage definitions, pillar colors
- Depends on: date-fns library
- Used by: All layers

**Automation Layer:**
- Purpose: Scheduled Node.js scripts for scraping, reporting, data sync
- Location: `scripts/`
- Contains: Playwright/Puppeteer scrapers, Haiku AI synthesis, Telegram API calls, file I/O
- Depends on: Browser auth state (`~/.gig-engine/`), environment config (`.env.monitor`), external APIs
- Used by: launchd scheduled jobs, manual CLI invocation

## Data Flow

**Listing Discovery & Display:**

1. Markdown files in `listings/fiverr/` and `listings/upwork/` contain service definitions
2. `src/lib/listings.ts` parses markdown at build time:
   - Extracts title from markdown h1
   - Parses pricing table to extract 3-tier pricing (Basic/Standard/Premium)
   - Extracts description from "Hook" section
   - Maps gig ID (e.g., AW-01) to pillar, priority, platform
   - Locates image in `images/fiverr/`
3. `src/app/page.tsx` calls `getListingsByPillar()` and `getStats()` to populate UI
4. Component renders service catalog organized by pillar with live image loading

**Opportunity Pipeline Data Flow:**

1. User creates opportunity in UI via `OpportunityForm` component
2. Form validates against `opportunitySchema` (Zod)
3. Data sent to Supabase via hooks (`useOpportunities`)
4. Kanban board (`KanbanBoard`) displays opportunities grouped by stage
5. Drag-and-drop updates stage; UI calls `onStageChange` handler
6. Backend updates Supabase; UI re-fetches via hook

**Gig Listing Data Flow:**

1. Markdown listings parsed at build time → static display (no DB needed initially)
2. Database schema exists for dynamic gig management (future)
3. `GigForm` validates against `gigSchemaRefined` (3-tier pricing consistency checks)
4. Gig card displays image, title, priority badge, pricing tiers

**Report Generation Flow:**

1. `scripts/morning-report.mjs` runs on schedule (6:45 AM)
2. Calls `scrape-fiverr.mjs` → Playwright + stealth plugin → dashboard login + metrics extraction
3. Calls `scrape-upwork.mjs` → Similar scraping flow
4. Calls `generate-report.mjs` → Haiku 4.5 AI synthesis of scraped data
5. Calls `send-telegram.mjs` → Sends formatted report to Telegram
6. Calls `update-tracker.mjs` → Updates `tracker.md` metrics (auto-commit to git)

**State Management:**
- UI state: React hooks (useState in components)
- Form state: React Hook Form + Zod validation
- Persistent data: Supabase (PostgreSQL backend)
- Static content: Markdown files parsed at build time
- Automation state: Browser auth state in `~/.gig-engine/` (persistent across runs)

## Key Abstractions

**GigListing:**
- Purpose: Represents a single service listing parsed from markdown
- Examples: `src/lib/listings.ts`, `src/app/page.tsx`
- Pattern: Static extraction from markdown with caching at build time

**Opportunity:**
- Purpose: Represents a job/project opportunity in the sales pipeline
- Examples: `src/lib/schemas/opportunity.ts`, `src/components/pipeline/`
- Pattern: Database-backed entity with pipeline stage tracking

**Schema (Zod):**
- Purpose: Runtime validation and type inference for forms
- Examples: `src/lib/schemas/*.ts` (gig.ts, opportunity.ts, project.ts, etc.)
- Pattern: Barrel export from index.ts; separate base schema + refined schema with cross-field checks

**Service Pillar:**
- Purpose: Categorizes gigs/services into 5 domains
- Examples: `src/lib/utils/constants.ts` (SERVICE_PILLARS array)
- Pattern: Metadata-driven, referenced by color/label throughout UI

## Entry Points

**Web Application:**
- Location: `src/app/layout.tsx` (root layout with Sidebar), `src/app/page.tsx` (service catalog homepage)
- Triggers: User visits https://gig-engine.vercel.app
- Responsibilities: Render page, load listings, display catalog by pillar, sidebar navigation

**Morning Report Script:**
- Location: `scripts/morning-report.mjs`
- Triggers: launchd job `com.prettyfly.gig-monitor` (6:45 AM daily)
- Responsibilities: Orchestrate scraping, reporting, Telegram delivery, tracker update

**Weekly Summary Script:**
- Location: `scripts/weekly-summary.mjs`
- Triggers: launchd job (Sundays 9 AM via CLAUDE.md reference)
- Responsibilities: Generate performance summary, send via Telegram

**Authentication (Gig Monitor):**
- Location: `scripts/fiverr-login.mjs`, `scripts/upwork-login.mjs`
- Triggers: Manual CLI invocation when auth expires
- Responsibilities: Interactive Playwright login, persist cookies/tokens to `~/.gig-engine/`

## Error Handling

**Strategy:** Fail-safe pattern with fallbacks and error logging

**Patterns:**
- Supabase client: Returns placeholder client during build if env vars missing (allows zero-downtime builds)
- Hooks: All data hooks (`useGigs`, `useOpportunities`, etc.) wrap Supabase calls in try-catch, return empty state on error
- Scripts: Each step (scrape, report, telegram) catches errors individually; overall orchestrator logs failures but continues if possible
- Forms: Zod validation errors displayed inline via React Hook Form
- Markdown parsing: Handles missing sections gracefully (returns empty string for missing Hook, etc.)

## Cross-Cutting Concerns

**Logging:**
- UI: Console.log in development, silent in production
- Scripts: Timestamps + step status (OK/FAILED) to stdout; errors to stderr

**Validation:**
- Frontend: React Hook Form + Zod schema validation before submit
- Backend (future): Supabase RLS policies (not yet implemented)
- Static data: Markdown parsing with fallback defaults

**Authentication:**
- Web: Supabase auth (env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Scripts: Browser-based login (Playwright) → persistent auth state in `~/.gig-engine/`
- Telegram: Bot token in `.env.monitor` (TELEGRAM_BOT_TOKEN)

**Data Formats:**
- Dates: ISO format in DB, formatted for display via `src/lib/utils/formatters.ts`
- Currency: USD, formatted as $X,XXX.XX
- Markdown: YAML-style frontmatter (not used; metadata inferred from content)

---

*Architecture analysis: 2026-02-17*

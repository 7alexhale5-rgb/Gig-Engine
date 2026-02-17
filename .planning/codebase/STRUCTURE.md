# Codebase Structure

**Analysis Date:** 2026-02-17

## Directory Layout

```
Gig-Engine/
├── src/                          # Next.js application source
│   ├── app/                      # App Router pages and layout
│   │   ├── layout.tsx            # Root layout with Sidebar
│   │   └── page.tsx              # Service catalog homepage
│   ├── components/               # React components by feature
│   │   ├── ui/                   # Shadcn/ui primitives (badge, button, card, dialog, etc.)
│   │   ├── layout/               # Header, Sidebar, PageContainer
│   │   ├── shared/               # Reusable: badges, forms, modals, empty states
│   │   ├── pipeline/             # Kanban board, opportunity forms
│   │   ├── dashboard/            # Metrics, revenue charts, proposal funnel
│   │   ├── gigs/                 # Gig cards, forms, performance stats
│   │   ├── projects/             # Project management UI
│   │   ├── proposals/            # Proposal generator, templates
│   │   └── analytics/            # Charts and KPI visualizations
│   ├── lib/                      # Core logic and utilities
│   │   ├── schemas/              # Zod validation schemas (barrel export)
│   │   │   ├── index.ts          # Main export point
│   │   │   ├── gig.ts            # Gig listing schema
│   │   │   ├── opportunity.ts     # Opportunity pipeline schema
│   │   │   ├── revenue.ts         # Revenue tracking schema
│   │   │   ├── project.ts         # Project management schema
│   │   │   ├── proposal-template.ts
│   │   │   ├── daily-metrics.ts
│   │   │   ├── platform.ts
│   │   │   └── content-block.ts
│   │   ├── supabase/             # Database client and types
│   │   │   ├── client.ts         # Browser client (SSR wrapper)
│   │   │   ├── server.ts         # Server-side client (not actively used)
│   │   │   └── types.ts          # Auto-generated Supabase types
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useGigs.ts        # Fetch gigs from DB
│   │   │   ├── useOpportunities.ts
│   │   │   ├── useProposals.ts
│   │   │   ├── useRevenue.ts
│   │   │   └── useDailyMetrics.ts
│   │   ├── utils/                # Shared utilities
│   │   │   ├── constants.ts      # OPPORTUNITY_STAGES, SERVICE_PILLARS, colors
│   │   │   ├── formatters.ts     # formatCurrency, formatDate, formatPercentage
│   │   │   └── calculations.ts   # Revenue calculations, win rates
│   │   ├── listings.ts           # Markdown parser for static listings
│   │   └── utils.ts              # Helper functions (cn, etc.)
│   └── data/                     # Seed data for development
│       ├── seed-gigs.ts          # Seed gig definitions
│       ├── seed-platforms.ts     # Platform metadata (Fiverr, Upwork)
│       ├── seed-pillars.ts       # Service pillar definitions
│       └── seed-templates.ts     # Proposal template seeds
├── listings/                     # Markdown service listings (document-driven)
│   ├── fiverr/                   # 31 Fiverr gig definitions (AW-01.md, AI-01.md, etc.)
│   ├── upwork/                   # 31 Upwork gig definitions
│   ├── arc/                      # Arc.dev listings
│   └── toptal/                   # Toptal listings (reserved)
├── images/                       # Gig imagery
│   └── fiverr/                   # Satori-generated PNG gig thumbnails (1280x769)
├── scripts/                      # Node.js automation scripts (MJS)
│   ├── morning-report.mjs        # Orchestrator: scrape → report → telegram → update tracker
│   ├── scrape-fiverr.mjs         # Playwright Fiverr dashboard scraper
│   ├── scrape-upwork.mjs         # Playwright Upwork dashboard scraper
│   ├── generate-report.mjs       # Haiku 4.5 AI synthesis
│   ├── send-telegram.mjs         # Telegram Bot API delivery
│   ├── update-tracker.mjs        # Updates tracker.md and git-commits
│   ├── generate-proposal.mjs     # Upwork proposal generator
│   ├── posting-helper.mjs        # CLI tool: clipboard-ready listing content
│   ├── generate-gig-images.mjs   # Satori image generator
│   ├── fiverr-login.mjs          # Interactive Fiverr auth (Playwright)
│   ├── upwork-login.mjs          # Interactive Upwork auth (Playwright)
│   ├── generate-ai07-supplementary.mjs
│   └── weekly-summary.mjs        # Weekly performance summary
├── data/                         # Generated data and reports
│   ├── fiverr/history/           # Historical Fiverr metrics
│   ├── upwork/history/           # Historical Upwork metrics
│   └── reports/                  # Generated report files
├── supabase/                     # Supabase migration files (inactive)
│   └── migrations/               # SQL migrations (schema not in use)
├── public/                       # Static assets served by Next.js
│   └── images/fiverr/            # Copy of images/fiverr/ (populated on build)
├── docs/                         # Project documentation
│   └── plans/                    # Design docs, spec documents
├── checklists/                   # Platform-specific posting guides
├── logs/                         # Automation logs
├── .planning/                    # GSD codebase analysis documents
│   └── codebase/                 # ARCHITECTURE.md, STRUCTURE.md, etc.
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── .eslintrc.json                # ESLint configuration
├── strategy-matrix.md            # 5 pillars × 4 platforms matrix
├── tracker.md                    # Auto-updated deployment metrics
└── .env.monitor                  # Automation env (not .env.local)
```

## Directory Purposes

**src/app:**
- Purpose: Next.js 14 App Router pages and root layout
- Contains: Page components (*.tsx), root layout with Sidebar
- Key files: `layout.tsx` (root), `page.tsx` (service catalog)

**src/components:**
- Purpose: Reusable React components organized by feature domain
- Contains: UI primitives, page sections, forms, dialogs
- Structure: Each major feature (pipeline, dashboard, gigs, proposals) has its own subdirectory
- Export pattern: Subdirectories export via `index.ts` (barrel exports)

**src/lib/schemas:**
- Purpose: Zod validation schemas for all form inputs
- Contains: Schema definitions (gig, opportunity, project, revenue, etc.) + inferred TypeScript types
- Pattern: Separate `base schema` and `refined schema` (with cross-field validation)
- Barrel export: `index.ts` re-exports all schemas for convenient imports

**src/lib/supabase:**
- Purpose: Supabase client initialization and type definitions
- Contains: Browser client wrapper, server client (unused), auto-generated types
- Key files: `client.ts` (returns placeholder if build-time), `types.ts` (generated via `npm run db:generate-types`)

**src/lib/hooks:**
- Purpose: Custom React hooks for data fetching and state management
- Contains: Database query wrappers (useGigs, useOpportunities, useRevenue, useDailyMetrics)
- Pattern: All hooks handle Supabase calls, error states, loading states

**src/lib/utils:**
- Purpose: Shared formatting and utility functions
- Contains: Constants (stages, pillars, colors), formatters (currency/date/percentage), calculations
- Key files: `constants.ts` (stage/pillar definitions), `formatters.ts` (display formatting)

**src/data:**
- Purpose: Development seed data for database population
- Contains: Fixture objects for gigs, platforms, pillars, proposal templates
- Note: Not used in production; replaced by dynamic database queries

**listings/:**
- Purpose: Document-driven service catalog (markdown files)
- Structure: `fiverr/` (31 listings), `upwork/` (31 listings), `arc/`, `toptal/`
- Naming: `{PILLAR}-{NUMBER}.md` (e.g., AW-01.md, AI-07.md)
- Content: Markdown h1 title, Hook section, Pricing Table section
- Parsed by: `src/lib/listings.ts` (static extraction at build time)

**images/fiverr/:**
- Purpose: Gig thumbnail images (1280x769 PNG)
- Generated by: `scripts/generate-gig-images.mjs` (Satori + resvg-js)
- Copied to: `public/images/fiverr/` on build (via `prebuild` script)
- Referenced by: `src/lib/listings.ts` (findImage function)

**scripts/:**
- Purpose: Node.js automation scripts for scheduling and integration
- Pattern: Each script exports a `main()` function; orchestrator calls sequentially
- Environment: `.env.monitor` (not `.env.local`); auth state in `~/.gig-engine/`
- Scheduling: launchd jobs (`com.prettyfly.gig-monitor`, `com.prettyfly.gig-watchdog`)

**supabase/:**
- Purpose: Supabase migration files (currently inactive)
- Note: Database schema not deployed; using Supabase cloud project directly
- Future: May be activated for local development with `npx supabase start`

**public/:**
- Purpose: Static assets served by Next.js (images, fonts, etc.)
- Generated: `public/images/fiverr/` copied from `images/fiverr/` on build

**docs/ & checklists/:**
- Purpose: Reference documentation and platform-specific posting guides
- Contains: Strategy matrix, project specs, checklist templates

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout with theme, Sidebar, metadata
- `src/app/page.tsx`: Service catalog homepage — calls getListingsByPillar()
- `scripts/morning-report.mjs`: Daily automation orchestrator (launchd entry point)

**Configuration:**
- `tsconfig.json`: Path aliases (@/*), TypeScript strict mode
- `next.config.js`: Next.js build config
- `tailwind.config.ts`: Tailwind CSS theme and plugins
- `package.json`: Dependencies and npm scripts

**Core Logic:**
- `src/lib/listings.ts`: Markdown parser for static listings (getListings, getListingsByPillar)
- `src/lib/schemas/index.ts`: Barrel export of all Zod validation schemas
- `src/lib/utils/constants.ts`: Service pillar definitions, opportunity stage enum

**Testing:**
- Not detected in codebase

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `Header.tsx`, `KanbanBoard.tsx`)
- Utility/helper files: camelCase (e.g., `listings.ts`, `formatters.ts`)
- Scripts: camelCase with .mjs extension (e.g., `morning-report.mjs`)
- Markdown listings: `{PILLAR}-{NUMBER}.md` (e.g., `AW-01.md`, `AI-07.md`)
- Images: `{PILLAR}-{NUMBER}.png` (e.g., `aw-01.png`, `ai-07.png`)

**Directories:**
- Feature components: plural (e.g., `components/pipeline/`, `components/dashboard/`)
- Utilities: lowercase with hyphens (e.g., `lib/utils/`, `lib/hooks/`)
- Content directories: lowercase plural (e.g., `listings/`, `images/`, `scripts/`)

**TypeScript:**
- Types/interfaces: PascalCase (e.g., `GigListing`, `OpportunityStage`)
- Enums: camelCase constant (e.g., `OPPORTUNITY_STAGES`)
- Functions: camelCase (e.g., `getListings`, `formatCurrency`)
- Constants: UPPER_SNAKE_CASE (e.g., `PILLAR_MAP`, `PRIORITY_BADGES`)

## Where to Add New Code

**New Feature:**
- **Primary code**: `src/components/{feature}/` (component files) + `src/lib/schemas/{entity}.ts` (validation)
- **Tests**: Not detected; skip test files for now
- **Examples**: `src/components/pipeline/` (opportunity management), `src/components/dashboard/` (metrics)

**New Component/Module:**
- **Implementation**: `src/components/{category}/{ComponentName}.tsx`
- **Export**: Add to `src/components/{category}/index.ts` barrel export
- **UI primitives**: Use existing `src/components/ui/` (Shadcn components)
- **Shared components**: Use `src/components/shared/` if reusable across features

**Utilities:**
- **Formatting/display**: `src/lib/utils/formatters.ts`
- **Calculations**: `src/lib/utils/calculations.ts`
- **Constants**: `src/lib/utils/constants.ts`
- **Helpers**: `src/lib/utils.ts` (general-purpose functions like `cn`)

**Validation Schemas:**
- **New entity**: Create `src/lib/schemas/{entity}.ts`
- **Export**: Add to `src/lib/schemas/index.ts` barrel export
- **Pattern**: Define base schema + refined schema (with cross-field checks if needed)

**Database Queries:**
- **New hook**: Create `src/lib/hooks/use{Entity}.ts`
- **Pattern**: Wrap Supabase client call, handle loading/error/data states
- **Export**: Used directly by components (no barrel export)

**Automation Scripts:**
- **New script**: Create `scripts/{feature}.mjs`
- **Pattern**: Export `main()` async function
- **Integration**: Call from `scripts/morning-report.mjs` orchestrator if recurring

**Markdown Listings:**
- **New gig**: Create `listings/fiverr/{PILLAR}-{NUMBER}.md` or `listings/upwork/{PILLAR}-{NUMBER}.md`
- **Format**: Markdown with h1 title, ### Hook section, ## Pricing Table section
- **ID mapping**: Must match pattern in `src/lib/listings.ts` (PILLAR_MAP, PRIORITY_MAP)

## Special Directories

**`.planning/codebase/`:**
- Purpose: GSD (Guided Software Development) analysis documents
- Generated: Created by `/gsd:map-codebase` command
- Committed: Yes, guides future implementation planning
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md

**`logs/`:**
- Purpose: Automation execution logs and error traces
- Generated: Created by scripts during execution
- Committed: No (added to .gitignore)

**`data/`:**
- Purpose: Scraped metrics and historical data
- Generated: Created by scrape-fiverr.mjs and scrape-upwork.mjs
- Committed: Partially (history snapshots, reports excluded)

**`public/images/fiverr/`:**
- Purpose: Served static assets (copy of source images)
- Generated: Populated on build via `prebuild` npm script
- Committed: No (generated artifact)

**`.next/`:**
- Purpose: Next.js build output
- Generated: Created by `npm run build`
- Committed: No (added to .gitignore)

---

*Structure analysis: 2026-02-17*

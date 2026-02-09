# CLAUDE.md - PrettyFly Acquisition Engine

> AI assistant guide for developing the PrettyFly Gig Economy Acquisition Engine.

## Project Overview

**Name:** prettyfly-acquisition-engine
**Type:** Internal operations tool for PrettyFly.ai
**Owner:** Alex, Founder of PrettyFly.ai

A centralized operations platform for managing, tracking, and optimizing freelance project acquisition across multiple gig economy platforms (Upwork, Fiverr, Toptal, Arc.dev, and others). Consolidates listing management, proposal tracking, delivery pipelines, and revenue analytics into one command center.

**Core problem:** Managing freelance operations across 4+ platforms creates fragmentation — scattered proposals, no unified pipeline view, manual gig performance tracking, disconnected delivery workflows, and zero visibility into which platforms/gig types drive the most revenue per hour invested.

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

---

## Project Structure

```
prettyfly-acquisition-engine/
├── CLAUDE.md                              # This file
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                             # Supabase keys, API keys (NEVER commit)
├── supabase/
│   ├── config.toml
│   └── migrations/                        # Numbered SQL migrations (001-012+)
├── src/
│   ├── app/                               # Next.js App Router pages
│   │   ├── layout.tsx                     # Root layout with sidebar nav
│   │   ├── page.tsx                       # Dashboard home (key metrics)
│   │   ├── globals.css
│   │   ├── dashboard/page.tsx             # Revenue analytics dashboard
│   │   ├── pipeline/                      # Kanban pipeline view + detail
│   │   ├── proposals/                     # Proposal engine + template library
│   │   ├── gigs/                          # Gig listing manager + detail/edit
│   │   ├── projects/                      # Active delivery tracker + detail
│   │   ├── portfolio/page.tsx             # Case study & content library
│   │   ├── analytics/page.tsx             # Deep analytics & optimizer
│   │   └── settings/page.tsx              # Platform profiles, preferences
│   ├── components/
│   │   ├── ui/                            # shadcn/ui base components
│   │   ├── layout/                        # Sidebar, Header, PageContainer
│   │   ├── dashboard/                     # MetricCard, RevenueChart, etc.
│   │   ├── pipeline/                      # KanbanBoard, OpportunityCard, etc.
│   │   ├── proposals/                     # ProposalGenerator, QuickFirePanel
│   │   ├── gigs/                          # GigCard, GigForm, PricingTierEditor
│   │   ├── projects/                      # ProjectCard, DeliveryChecklist, TimeTracker
│   │   ├── analytics/                     # RevenueBySeries, WinRateChart, etc.
│   │   └── shared/                        # PlatformBadge, PillarBadge, StatusBadge
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                  # Browser Supabase client singleton
│   │   │   ├── server.ts                  # Server-side Supabase client
│   │   │   └── types.ts                   # Generated types from DB schema
│   │   ├── utils/
│   │   │   ├── calculations.ts            # Revenue calcs, win rates, effective hourly
│   │   │   ├── formatters.ts              # Currency, dates, percentages
│   │   │   └── constants.ts               # Stage enums, pillar colors, platform configs
│   │   └── hooks/                         # useOpportunities, useGigs, useRevenue, etc.
│   └── data/                              # Seed data (TypeScript)
│       ├── seed-platforms.ts
│       ├── seed-pillars.ts
│       ├── seed-templates.ts
│       └── seed-gigs.ts
└── docs/
    ├── STRATEGY.md                        # Full strategic plan (reference)
    ├── PLATFORM-GUIDES.md                 # Platform-specific optimization
    ├── PROPOSAL-TEMPLATES.md              # Full proposal template library
    └── GIG-COPY.md                        # Gig listing copy (drafts + finals)
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
npx supabase start

# Run migrations
npx supabase db push

# Generate TypeScript types from DB schema
npx supabase gen types typescript --local > src/lib/supabase/types.ts

# Lint
npm run lint

# Format
npx prettier --write .
```

---

## Implementation Phases

### Phase 1: Foundation
- Next.js + Tailwind + shadcn/ui scaffold
- Supabase project, schema migrations, seed data
- Supabase Auth (single user)
- Layout shell: sidebar, header, page container
- Dashboard home with metric cards from Supabase

### Phase 2: Core Pipeline
- Opportunity CRUD
- Kanban board with @dnd-kit drag-and-drop
- Opportunity detail page
- Pipeline filtering
- Basic proposal template management

### Phase 3: Gig Manager + Proposals
- Gig listing CRUD with version history
- Pricing tier editor
- Proposal template library with AI generation
- Quick-fire proposal mode
- Content block library

### Phase 4: Delivery + Analytics
- Project tracker with checklists
- Time tracking
- Revenue entry management
- Analytics dashboard with Recharts
- Daily metrics logging

### Phase 5: Polish + Automation
- Review request workflow triggers
- Retainer conversion tracking
- Performance recommendation engine
- CSV export for revenue data
- Notification system for deadlines
- Vercel deployment

---

## Coding Conventions

### General Rules
- TypeScript strict mode everywhere - no `any` types
- Use Next.js App Router conventions (server components by default, `"use client"` only when needed)
- All forms use React Hook Form + Zod schemas
- All date handling through date-fns (timezone-safe)
- Supabase client via singleton pattern (`lib/supabase/client.ts` for browser, `lib/supabase/server.ts` for server)

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

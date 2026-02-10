# Implementation Roadmap — PrettyFly Acquisition Engine

> Detailed session-by-session plan for building the PrettyFly Acquisition Engine from the Phase 1 scaffold through production deployment. Each session is scoped to fit within Alex's 20-message-per-chat working style and produces a commitable, shippable unit of work.

**Total Sessions:** 25 (across 4 phases)
**Estimated Calendar Time:** 6-8 weeks at 1-2 sessions per day

---

## How to Read This Plan

Each session defines:
- **Goal** — the one sentence describing what ships
- **Prerequisites** — sessions or setup steps that must come first
- **Files to create/modify** — exact paths so the AI assistant knows scope
- **Complexity** — Light (5-10 messages), Medium (10-15), Heavy (15-20)
- **Deliverable** — what Alex sees working when the session ends
- **Dependencies** — which prior sessions are required

---

## Phase 2: Core Pipeline (7 Sessions)

The foundation: connect the database, get real data flowing, and build the pipeline that drives Alex's daily proposal workflow.

---

### Session 2.1 — Supabase Connection & Data Verification

**Goal:** Connect the app to a live Supabase instance and verify seed data loads on every page.

**Prerequisites:** Supabase project created (hosted or local via `npx supabase start`), `.env.local` values available.

**Files to modify:**
- `.env.local` (create from `.env.local.example`)
- `src/lib/supabase/client.ts` (verify — already correct)
- `src/lib/supabase/server.ts` (verify — already correct)
- `src/lib/supabase/types.ts` (regenerate via `npm run db:generate-types`)
- `src/app/page.tsx` (wire MetricCard values to Supabase query results)
- `src/components/dashboard/PipelineSnapshot.tsx` (fetch opportunity counts per stage)
- `src/components/dashboard/DailyTargets.tsx` (fetch today's proposal count from daily_metrics)

**Complexity:** Medium (10-15 messages)

**Deliverable:** Dashboard home page shows live counts — pipeline stage counts from `opportunities`, today's proposal count from `daily_metrics`, weekly revenue from `revenue_entries`. All zero initially but confirming real DB connection, not hardcoded values.

**Dependencies:** None (first session)

---

### Session 2.2 — Dashboard Metric Cards & Revenue Chart

**Goal:** Wire all four dashboard metric cards to live aggregated data and render the first Recharts visualization.

**Prerequisites:** Session 2.1 complete (Supabase connected, types regenerated).

**Files to modify:**
- `src/app/page.tsx` (server-side Supabase queries for metrics)
- `src/components/dashboard/MetricCard.tsx` (add trend calculation logic)
- `src/components/dashboard/RevenueChart.tsx` (replace placeholder with Recharts BarChart)
- `src/lib/utils/calculations.ts` (use existing calculateWeeklyRevenue, calculateWinRate, calculatePipelineValue)
- `src/lib/utils/formatters.ts` (verify currency/percentage formatters work)

**Complexity:** Medium (10-15 messages)

**Deliverable:** Dashboard shows Weekly Revenue (calculated from `revenue_entries`), Active Pipeline count (from `opportunities` in active stages), Proposal Win Rate (from `proposal_templates` aggregate or `opportunities` won vs sent), Avg Effective Rate (from completed `opportunities` with actual_hours). Revenue chart renders a 7-day bar chart using Recharts with real data shape (empty bars if no data, but the chart renders).

**Dependencies:** 2.1

---

### Session 2.3 — Opportunity Create/Edit Forms

**Goal:** Build the opportunity creation and editing forms with full Zod validation, wired to the `useOpportunities` hook.

**Prerequisites:** Session 2.1 complete.

**Files to create/modify:**
- `src/components/pipeline/OpportunityForm.tsx` (NEW — React Hook Form + Zod schema)
- `src/components/pipeline/OpportunityCard.tsx` (NEW — compact card for Kanban columns)
- `src/app/pipeline/page.tsx` (add Dialog for create form, load opportunities on mount, render OpportunityCards in Kanban columns)
- `src/lib/hooks/useOpportunities.ts` (add `deleteOpportunity` method)

**Complexity:** Heavy (15-20 messages)

**Deliverable:** "Add Opportunity" button opens a dialog with a validated form (job title, platform select, pillar select, stage, budget range, contract type, job URL, description, notes). Submitting creates a row in Supabase and the card appears in the correct Kanban column. Table view also populates. Clicking a card in the table opens the edit form.

**Dependencies:** 2.1

---

### Session 2.4 — Kanban Drag-and-Drop

**Goal:** Implement @dnd-kit drag-and-drop on the pipeline Kanban board so opportunities can be moved between stages by dragging.

**Prerequisites:** Session 2.3 complete (OpportunityCard exists, opportunities load).

**Files to create/modify:**
- `src/components/pipeline/KanbanBoard.tsx` (NEW — DndContext + SortableContext wrapper)
- `src/components/pipeline/KanbanColumn.tsx` (NEW — droppable column with useDroppable)
- `src/components/pipeline/OpportunityCard.tsx` (add useSortable, drag handle, drag overlay styling)
- `src/app/pipeline/page.tsx` (replace inline Kanban with KanbanBoard component)
- `src/lib/hooks/useOpportunities.ts` (verify `updateStage` optimistic update works correctly)

**Complexity:** Heavy (15-20 messages)

**Deliverable:** Opportunities can be dragged between stage columns on the Kanban board. Drop triggers `updateStage` with optimistic UI update. Cards animate during drag. Column counts update in real-time. If the DB write fails, the card reverts to its original column.

**Dependencies:** 2.3

---

### Session 2.5 — Pipeline Filtering & Search

**Goal:** Add platform, pillar, and stage filters plus text search to the pipeline view (both Kanban and table).

**Prerequisites:** Session 2.4 complete (Kanban is functional).

**Files to create/modify:**
- `src/app/pipeline/page.tsx` (add filter bar with dropdowns)
- `src/components/shared/SearchFilter.tsx` (already exists — wire to pipeline)
- `src/components/pipeline/PipelineFilters.tsx` (NEW — filter bar component with platform/pillar/stage selects)
- `src/lib/hooks/useOpportunities.ts` (verify filter params pass correctly to Supabase query)

**Complexity:** Light (5-10 messages)

**Deliverable:** Filter bar above Kanban/table with: platform dropdown (loaded from `platforms` table), pillar dropdown (loaded from `service_pillars`), stage multi-select, and text search. Filters apply to both Kanban and table views. Clearing filters shows all opportunities. Filter state persists when toggling between Kanban/table views.

**Dependencies:** 2.4

---

### Session 2.6 — Opportunity Detail Page

**Goal:** Build the opportunity detail page with full edit capability, proposal text display, and timeline of stage changes.

**Prerequisites:** Session 2.3 complete (OpportunityForm exists).

**Files to modify:**
- `src/app/pipeline/[id]/page.tsx` (replace placeholder with full detail view)
- `src/components/pipeline/OpportunityForm.tsx` (reuse in edit mode on detail page)
- `src/components/pipeline/OpportunityTimeline.tsx` (NEW — visual timeline of dates: created, proposal_sent_at, contracted_at, delivered_at, etc.)
- `src/components/shared/StatusBadge.tsx` (verify stage badge rendering)

**Complexity:** Medium (10-15 messages)

**Deliverable:** Clicking an opportunity card navigates to `/pipeline/[id]`. The detail page shows: all opportunity fields in editable form, a stage progression timeline with dates, the proposal text used, client details, budget/value info, and action buttons (move to next stage, mark as lost). Save updates the record and navigates back to pipeline.

**Dependencies:** 2.3

---

### Session 2.7 — Real-Time Subscriptions & Proposal Template Basics

**Goal:** Add Supabase real-time subscription to the pipeline so changes reflect instantly, and wire up basic proposal template listing.

**Prerequisites:** Session 2.4 complete (pipeline is functional).

**Files to create/modify:**
- `src/lib/hooks/useOpportunities.ts` (add Supabase `.subscribe()` channel for INSERT/UPDATE/DELETE on `opportunities`)
- `src/lib/hooks/useProposals.ts` (verify — already built, ensure it loads templates)
- `src/app/proposals/page.tsx` (load templates in sidebar, populate template dropdown)
- `src/app/proposals/templates/page.tsx` (display full template library with pillar badges)
- `src/components/shared/PillarBadge.tsx` (verify rendering with real pillar data)
- `src/components/shared/PlatformBadge.tsx` (verify rendering with real platform data)

**Complexity:** Medium (10-15 messages)

**Deliverable:** Pipeline board updates in real-time when data changes (e.g., if Alex has two browser tabs open). Proposals page loads the 7 seed templates from Supabase and displays them in the sidebar with pillar color coding. Template dropdown in Quick-Fire section is populated. Templates page shows the full library with name, pillar, platform, usage stats.

**Dependencies:** 2.4

---

## Phase 3: Gig Manager + Proposals (6 Sessions)

Build out the gig listing management and proposal generation engine — the tools Alex uses in the daily morning session.

---

### Session 3.1 — Gig Listing Display & GigCard Component

**Goal:** Build the GigCard component and wire the gigs page to display all listings from Supabase with pillar filtering.

**Prerequisites:** Session 2.1 complete (Supabase connected).

**Files to create/modify:**
- `src/components/gigs/GigCard.tsx` (NEW — card showing title, platform badge, pillar badge, pricing tiers, status, performance metrics)
- `src/app/gigs/page.tsx` (replace placeholder with useGigs hook, render GigCard grid, wire pillar filter buttons)
- `src/lib/hooks/useGigs.ts` (verify — already built with filter support)

**Complexity:** Medium (10-15 messages)

**Deliverable:** Gigs page loads all listings from Supabase and renders them as cards in a responsive grid. Each card shows: title, platform badge, pillar badge, 3-tier pricing summary, status indicator (draft/active/paused/archived), and basic metrics (impressions, clicks, orders). Pillar filter buttons filter the grid. Empty state shown when no gigs match.

**Dependencies:** 2.1

---

### Session 3.2 — Gig Create/Edit Form & Pricing Editor

**Goal:** Build the gig creation form with the 3-tier pricing editor component and full Zod validation.

**Prerequisites:** Session 3.1 complete.

**Files to create/modify:**
- `src/components/gigs/GigForm.tsx` (NEW — full form with React Hook Form + Zod)
- `src/components/gigs/PricingTierEditor.tsx` (NEW — side-by-side Basic/Standard/Premium editor with price + delivery days per tier)
- `src/app/gigs/page.tsx` (add Dialog for create, wire "New Gig" button)
- `src/app/gigs/[id]/page.tsx` (wire edit form on detail page)

**Complexity:** Heavy (15-20 messages)

**Deliverable:** "New Gig" button opens a dialog with: title, description, platform select, pillar select, tags input, status select, and the PricingTierEditor showing three columns (Basic/Standard/Premium) each with price and delivery days fields. Form validates with Zod. Submitting creates the gig in Supabase and it appears in the grid. Gig detail page at `/gigs/[id]` shows the same form in edit mode.

**Dependencies:** 3.1

---

### Session 3.3 — Gig Version History & Cross-Platform Duplication

**Goal:** Implement version history tracking for gig listing changes and the ability to duplicate a gig to another platform.

**Prerequisites:** Session 3.2 complete.

**Files to create/modify:**
- `src/lib/hooks/useGigVersions.ts` (NEW — fetch versions for a gig, create version snapshot)
- `src/components/gigs/VersionHistory.tsx` (NEW — timeline of past versions with diff summary)
- `src/app/gigs/[id]/page.tsx` (add version history section, add "Duplicate to Platform" action)
- `src/lib/hooks/useGigs.ts` (add `duplicateGig` method that copies a gig with a new platform_id)

**Complexity:** Medium (10-15 messages)

**Deliverable:** Gig detail page shows a "Version History" section listing past versions with change_notes, timestamps, and the ability to view old title/description/pricing. Saving edits to a gig automatically creates a version snapshot. "Duplicate to Platform" button lets Alex select a target platform and creates a copy of the gig for that platform.

**Dependencies:** 3.2

---

### Session 3.4 — Proposal Template CRUD & Library

**Goal:** Build full CRUD for proposal templates with create, edit, delete, and rich template preview.

**Prerequisites:** Session 2.7 complete (templates display in proposals page).

**Files to create/modify:**
- `src/components/proposals/TemplateForm.tsx` (NEW — form for creating/editing templates with variable extraction)
- `src/components/proposals/TemplateCard.tsx` (NEW — card showing template preview, pillar, platform, usage stats)
- `src/app/proposals/templates/page.tsx` (replace placeholder with full CRUD UI)
- `src/lib/hooks/useProposals.ts` (add `deleteTemplate` method)

**Complexity:** Medium (10-15 messages)

**Deliverable:** Templates page shows all templates as cards with: name, pillar badge, platform badge, template text preview (truncated), variable list, usage count, win count, win rate percentage. "New Template" button opens a create form. Clicking a template opens edit mode. Delete with confirmation. Variables are auto-extracted from `{{variable_name}}` patterns in the template text.

**Dependencies:** 2.7

---

### Session 3.5 — AI Proposal Generation (Edge Function)

**Goal:** Create the Supabase Edge Function for AI-powered proposal generation and wire it to the Quick-Fire UI.

**Prerequisites:** Session 3.4 complete (templates loadable), `ANTHROPIC_API_KEY` set in Supabase secrets.

**Files to create/modify:**
- `supabase/functions/generate-proposal/index.ts` (NEW — Edge Function that accepts job description + template, calls Claude API, returns personalized proposal)
- `src/app/proposals/page.tsx` (wire Generate button to Edge Function, display result, add Copy button functionality)
- `src/lib/hooks/useProposals.ts` (add `generateProposal` method that calls the Edge Function)

**Complexity:** Heavy (15-20 messages)

**Deliverable:** Quick-Fire mode works end-to-end: Alex pastes a job description, selects a template from the dropdown, clicks "Generate Proposal." The Edge Function sends the job description + template to Claude, which returns a personalized proposal with variables filled in contextually. The generated text appears in the output area. "Copy" button copies to clipboard with a toast confirmation. Template usage count increments on generation.

**Dependencies:** 3.4

---

### Session 3.6 — Quick-Fire Polish & Content Block Library

**Goal:** Polish the Quick-Fire workflow for speed (keyboard shortcuts, recent proposals) and build the content block library CRUD.

**Prerequisites:** Session 3.5 complete (AI generation works).

**Files to create/modify:**
- `src/app/proposals/page.tsx` (add recent proposals list, keyboard shortcuts, auto-select last used template)
- `src/components/proposals/QuickFirePanel.tsx` (NEW — extracted Quick-Fire component with streamlined UX)
- `src/components/proposals/RecentProposals.tsx` (NEW — list of last 10 generated proposals for re-copying)
- `src/app/portfolio/page.tsx` (wire content blocks section)
- `src/lib/hooks/useContentBlocks.ts` (NEW — CRUD hook for content_blocks table)
- `src/components/shared/ContentBlockCard.tsx` (NEW — card for displaying/editing content blocks)

**Complexity:** Heavy (15-20 messages)

**Deliverable:** Quick-Fire mode is optimized for Alex's 7:00-7:45 AM session: template auto-selects the last used one, recent proposals are listed below for quick re-use, Cmd+Enter triggers generation, output auto-copies on generation. Portfolio/content page shows content blocks organized by category (headline, overview, case_study, FAQ, skill_description, testimonial) with CRUD capability.

**Dependencies:** 3.5

---

## Phase 4: Delivery + Analytics (6 Sessions)

Track projects through delivery and build the analytics dashboards that show Alex which platforms and gig types are most profitable.

---

### Session 4.1 — Project CRUD & Opportunity Linking

**Goal:** Build project creation (manual and from won opportunities), edit forms, and the projects list page.

**Prerequisites:** Session 2.3 complete (opportunities exist to link from).

**Files to create/modify:**
- `src/components/projects/ProjectCard.tsx` (NEW — card showing title, status, deadline, progress)
- `src/components/projects/ProjectForm.tsx` (NEW — React Hook Form + Zod, with opportunity link dropdown)
- `src/lib/hooks/useProjects.ts` (NEW — CRUD hook for projects table)
- `src/app/projects/page.tsx` (replace placeholder with real project list, status summary cards wired to data)
- `src/app/pipeline/[id]/page.tsx` (add "Create Project" button for opportunities in "contracted" stage)

**Complexity:** Heavy (15-20 messages)

**Deliverable:** Projects page shows all projects as cards with: title, status badge, linked opportunity name, start date, target delivery date, and a progress indicator. Status summary cards at top show real counts (Active, Due This Week, Completed, Hours Logged). "New Project" button creates a project manually or auto-populates from a contracted opportunity. Creating a project from an opportunity page links the two.

**Dependencies:** 2.3

---

### Session 4.2 — Milestone Checklists & Delivery UI

**Goal:** Build the interactive milestone checklist and delivery workflow UI on the project detail page.

**Prerequisites:** Session 4.1 complete.

**Files to create/modify:**
- `src/app/projects/[id]/page.tsx` (full detail page with milestones, checklists, communication log)
- `src/components/projects/MilestoneList.tsx` (NEW — ordered milestone list with due dates, completion status)
- `src/components/projects/DeliveryChecklist.tsx` (NEW — interactive checklist with add/check/uncheck/reorder)
- `src/lib/hooks/useProjects.ts` (add methods for updating milestones_json, checklist_json)

**Complexity:** Heavy (15-20 messages)

**Deliverable:** Project detail page at `/projects/[id]` shows: project header with status and dates, milestone timeline (add milestones with title and due date, mark complete), interactive delivery checklist (add items, check/uncheck, reorder), and a notes/communication log section. Completing all checklist items shows a "Mark as Delivered" action button. Marking as delivered updates the linked opportunity to the "delivered" stage.

**Dependencies:** 4.1

---

### Session 4.3 — Time Tracking

**Goal:** Add time tracking to projects for calculating effective hourly rate per engagement.

**Prerequisites:** Session 4.2 complete.

**Files to create/modify:**
- `src/components/projects/TimeTracker.tsx` (NEW — start/stop timer + manual entry, session list)
- `src/app/projects/[id]/page.tsx` (add TimeTracker section)
- `src/lib/hooks/useProjects.ts` (add methods for time_entries_json CRUD)
- `src/lib/utils/calculations.ts` (add `calculateTotalHours` from time_entries_json, wire `calculateEffectiveHourlyRate`)

**Complexity:** Medium (10-15 messages)

**Deliverable:** Project detail page has a "Time Tracking" section with: a start/stop timer (saves elapsed time as a session entry), manual time entry (date, hours, description), session log showing all entries with total hours. Effective hourly rate is calculated (contract_value / total_hours) and displayed prominently. Total hours automatically syncs to the linked opportunity's `actual_hours` field.

**Dependencies:** 4.2

---

### Session 4.4 — Revenue Entry Management

**Goal:** Build revenue entry creation, listing, and the revenue dashboard page with summary aggregations.

**Prerequisites:** Session 2.1 complete (Supabase connected).

**Files to create/modify:**
- `src/components/analytics/RevenueEntryForm.tsx` (NEW — form for logging revenue with platform, pillar, amount, fees, type)
- `src/components/analytics/RevenueTable.tsx` (NEW — table of revenue entries with sorting, platform/pillar badges)
- `src/app/dashboard/page.tsx` (replace placeholders with revenue summary charts)
- `src/lib/hooks/useRevenue.ts` (add `updateEntry`, `deleteEntry` methods)
- `src/components/shared/DateRangePicker.tsx` (verify — already exists, wire to revenue filtering)

**Complexity:** Medium (10-15 messages)

**Deliverable:** Revenue Dashboard page (`/dashboard`) shows: revenue entry table with all logged payments (sortable by date, amount, platform), "Add Revenue" form (amount, platform, pillar, type, received date, platform fee, notes), auto-calculated net amount (amount - platform_fee), and summary cards (total gross, total net, total fees, entry count). Date range picker filters the view.

**Dependencies:** 2.1

---

### Session 4.5 — Recharts Dashboard Visualizations

**Goal:** Build all four analytics charts using Recharts with real data from Supabase.

**Prerequisites:** Session 4.4 complete (revenue entries exist), Session 2.2 complete (basic Recharts setup).

**Files to create/modify:**
- `src/components/analytics/RevenueBySeries.tsx` (NEW — BarChart: revenue grouped by platform or pillar, selectable)
- `src/components/analytics/WinRateChart.tsx` (NEW — BarChart: proposal win rate by platform)
- `src/components/analytics/HourlyRateTrend.tsx` (NEW — LineChart: effective hourly rate over time from completed projects)
- `src/components/analytics/MonthlyTrend.tsx` (NEW — AreaChart: monthly revenue trend line)
- `src/app/dashboard/page.tsx` (wire all four charts into the grid)
- `src/app/analytics/page.tsx` (wire Platform Comparison + Win Rate charts)

**Complexity:** Heavy (15-20 messages)

**Deliverable:** Revenue Dashboard shows four real charts: (1) Revenue by Platform/Pillar bar chart with toggle, (2) Monthly Revenue trend as an area chart, (3) Effective Hourly Rate trend line, (4) Platform Comparison. Analytics page shows Proposal Win Rate by Platform bar chart and Effective Hourly Rate trend. All charts use pillar colors from constants. Charts handle empty state gracefully with "Not enough data" message.

**Dependencies:** 4.4, 2.2

---

### Session 4.6 — Daily Metrics Logging & Recommendations Engine

**Goal:** Build the daily metrics logging workflow and the data-driven recommendations engine on the analytics page.

**Prerequisites:** Session 4.5 complete (charts working).

**Files to create/modify:**
- `src/components/analytics/DailyMetricsForm.tsx` (NEW — quick-entry form for daily KPIs per platform)
- `src/components/analytics/RecommendationsList.tsx` (NEW — generated recommendations based on data patterns)
- `src/app/analytics/page.tsx` (add daily metrics section, wire recommendations, add A/B test log)
- `src/lib/hooks/useDailyMetrics.ts` (verify — already built with upsert logic)
- `src/lib/utils/calculations.ts` (add recommendation calculation functions: identify best platform, best pillar, underperforming gigs, proposal volume trends)

**Complexity:** Medium (10-15 messages)

**Deliverable:** Analytics page has a "Log Daily Metrics" section where Alex enters: proposals sent, proposals won, impressions, clicks, orders, revenue, hours worked — per platform for the current day. Upserts correctly (can update same day repeatedly). Recommendations section generates actionable insights after 2+ weeks of data: "Your win rate on Upwork (34%) is 2x higher than Fiverr (17%) — consider shifting proposal volume," "AI & Chatbots pillar has the highest effective rate at $125/hr," etc. A/B test log section for tracking gig title/description experiments.

**Dependencies:** 4.5

---

## Phase 5: Polish & Deployment (6 Sessions)

Lock down auth, add operational niceties, and ship to production.

---

### Session 5.1 — Supabase Auth Setup

**Goal:** Implement Supabase email auth with login page, session management, and auth context.

**Prerequisites:** All Phase 2 sessions complete.

**Files to create/modify:**
- `src/app/login/page.tsx` (NEW — email + password login form)
- `src/app/login/layout.tsx` (NEW — centered auth layout without sidebar)
- `src/lib/supabase/middleware.ts` (NEW — Supabase auth middleware for session refresh)
- `middleware.ts` (NEW at project root — Next.js middleware routing to login for unauthenticated requests)
- `src/components/layout/Sidebar.tsx` (add user display + logout button)
- `src/app/layout.tsx` (add auth session provider context)

**Complexity:** Heavy (15-20 messages)

**Deliverable:** Visiting any page while unauthenticated redirects to `/login`. Login page with email + password form. Successful login redirects to dashboard. Session persists across page navigations. Sidebar shows user email and logout button. Logging out clears session and redirects to login. Single user for MVP — Alex's email only.

**Dependencies:** 2.1

---

### Session 5.2 — Route Protection & RLS Verification

**Goal:** Verify Row Level Security policies work with auth, add loading states, and error boundaries.

**Prerequisites:** Session 5.1 complete.

**Files to create/modify:**
- `supabase/migrations/015_update_rls_for_auth.sql` (NEW — update RLS policies to use `auth.uid()` instead of permissive)
- `src/app/error.tsx` (NEW — global error boundary)
- `src/app/loading.tsx` (NEW — global loading state)
- `src/app/not-found.tsx` (NEW — 404 page)
- `src/components/shared/LoadingSpinner.tsx` (NEW — reusable loading indicator)
- All page files (add loading states via Suspense boundaries where needed)

**Complexity:** Medium (10-15 messages)

**Deliverable:** All Supabase queries enforce RLS (only Alex's data is accessible). Every page handles loading state with a spinner instead of blank screen. Errors show a friendly error boundary with "Try again" button. 404 page for invalid routes. Auth token refresh happens automatically via middleware.

**Dependencies:** 5.1

---

### Session 5.3 — Notifications & Deadline Alerts

**Goal:** Build an in-app notification system for project deadlines, review reminders, and milestone due dates.

**Prerequisites:** Session 4.2 complete (projects with milestones exist).

**Files to create/modify:**
- `src/components/layout/Header.tsx` (add notification bell with unread count)
- `src/components/layout/NotificationPanel.tsx` (NEW — dropdown panel showing recent notifications)
- `src/lib/hooks/useNotifications.ts` (NEW — computed notifications from projects with approaching deadlines, overdue milestones, review reminders)
- `supabase/migrations/015_create_notifications.sql` or computed from existing data (decide based on complexity)

**Complexity:** Medium (10-15 messages)

**Deliverable:** Header shows a bell icon with unread notification count. Clicking it opens a dropdown panel listing: projects due within 48 hours, overdue milestones, opportunities awaiting response for 3+ days, proposals sent with no response for 7+ days. Each notification links to the relevant detail page. Notifications are computed from existing data (no separate table needed for MVP).

**Dependencies:** 4.2

---

### Session 5.4 — CSV Export & Data Portability

**Goal:** Add CSV export for revenue entries, opportunities, and daily metrics for accounting and analysis.

**Prerequisites:** Session 4.4 complete (revenue entries exist).

**Files to create/modify:**
- `src/lib/utils/csv-export.ts` (NEW — generic CSV generation utility)
- `src/app/dashboard/page.tsx` (add "Export CSV" button to revenue table)
- `src/app/analytics/page.tsx` (add "Export Metrics" button)
- `src/app/pipeline/page.tsx` (add "Export Pipeline" button to table view)

**Complexity:** Light (5-10 messages)

**Deliverable:** "Export CSV" buttons on revenue dashboard, analytics daily metrics, and pipeline table view. Clicking downloads a CSV file with all visible (filtered) data. Revenue export includes: date, amount, platform, pillar, fees, net, type. Pipeline export includes: title, platform, pillar, stage, value, dates. Metrics export includes: date, platform, proposals, wins, revenue, hours.

**Dependencies:** 4.4

---

### Session 5.5 — n8n Webhook Endpoints & Review Workflow

**Goal:** Create webhook-friendly API routes for n8n integration and automate the review request workflow.

**Prerequisites:** Session 4.2 complete (delivery workflow exists).

**Files to create/modify:**
- `src/app/api/webhooks/opportunity/route.ts` (NEW — POST endpoint for creating/updating opportunities from n8n)
- `src/app/api/webhooks/revenue/route.ts` (NEW — POST endpoint for logging revenue entries from n8n)
- `src/app/api/webhooks/metrics/route.ts` (NEW — POST endpoint for daily metrics from n8n)
- `src/lib/hooks/useProjects.ts` (add auto-trigger: when project marked "delivered", auto-set review_requested_at on linked opportunity)
- `supabase/migrations/016_add_webhook_api_key.sql` (NEW — simple API key auth for webhook endpoints)

**Complexity:** Medium (10-15 messages)

**Deliverable:** Three webhook endpoints that accept JSON POST requests with API key authentication. n8n workflows can: (1) create opportunities from platform notifications (Upwork job alerts, Fiverr buyer requests), (2) log revenue entries from payment notifications, (3) push daily platform metrics scraped from dashboards. Review workflow: delivering a project auto-updates the linked opportunity stage to "review_requested" and sets `review_requested_at` timestamp.

**Dependencies:** 4.2

---

### Session 5.6 — Vercel Deployment & Production Configuration

**Goal:** Deploy the application to Vercel with production environment variables and verify everything works.

**Prerequisites:** All prior sessions complete (or at minimum: 2.x, 3.x through 3.5, 4.x through 4.4, 5.1, 5.2).

**Files to create/modify:**
- `vercel.json` (NEW — if custom config needed for Edge Functions or API routes)
- `.env.local.example` (update with any new env vars added during development)
- `next.config.js` (verify production settings, add any required headers)
- `src/app/layout.tsx` (add metadata for production: title, description, favicon)
- `CLAUDE.md` (update Phase 5 checklist items as complete)

**Complexity:** Light (5-10 messages)

**Deliverable:** Application is live on Vercel at a `.vercel.app` URL (or custom domain if configured). Production environment variables set in Vercel dashboard. Supabase project pointed to production instance. Build passes, all routes load, auth works, data persists. Alex can access the tool from any device.

**Dependencies:** 5.1, 5.2

---

## Critical Path Analysis

### Path 1: "Alex uses this for the morning proposal session"

**Minimum viable path:** 6 sessions

```
2.1 (Supabase connect)
  -> 2.3 (Opportunity CRUD — need to log proposals somewhere)
    -> 2.7 (Templates load in proposals page)
      -> 3.4 (Template library CRUD)
        -> 3.5 (AI proposal generation)
          -> 3.6 (Quick-Fire polish)
```

**What Alex can do after this path:**
1. Open the proposals page at 7:00 AM
2. Paste a job description from Upwork/Fiverr
3. Select a proposal template (from 7 seed templates or custom ones)
4. Click Generate to get a personalized proposal via Claude
5. Copy the output and paste into the platform
6. Log the opportunity in the pipeline
7. Repeat 8-10 times in 45 minutes

**Shortcut option:** Sessions 3.4 and 3.5 can run in parallel if two chat sessions are used, since 3.4 modifies templates CRUD (proposals/templates page) while 3.5 modifies the Edge Function and the Quick-Fire UI (proposals page).

---

### Path 2: "Alex tracks revenue across platforms"

**Minimum viable path:** 4 sessions

```
2.1 (Supabase connect)
  -> 2.2 (Dashboard metric cards + RevenueChart)
    -> 4.4 (Revenue entry management)
      -> 4.5 (Recharts dashboard)
```

**What Alex can do after this path:**
1. Log every payment received (amount, platform, pillar, fees)
2. See weekly/monthly revenue totals on the dashboard
3. Compare revenue across platforms and pillars via charts
4. Track net revenue after platform fees
5. Identify most profitable platform and service pillar

---

### Path 3: "Full daily workflow" (combined)

**Minimum viable path:** 10 sessions

```
2.1 -> 2.2 -> 2.3 -> 2.4 -> 2.7 -> 3.4 -> 3.5 -> 3.6 -> 4.4 -> 4.5
```

This gives Alex the morning proposal workflow, pipeline management with drag-and-drop, and revenue tracking with charts — the three pillars of daily operation.

---

## Risk Assessment & Fallbacks

### High Risk Items

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **@dnd-kit version mismatch** — `@dnd-kit/sortable@10` may have breaking API changes vs common tutorials | Blocks Session 2.4 | Medium | Fallback: pin to `@dnd-kit/sortable@8` which has more documentation. Or implement manual stage-change buttons as interim solution. |
| **Supabase Edge Function cold starts** — AI generation may be slow on first call | Degrades Session 3.5 UX | Medium | Add loading spinner with "Generating..." state. Consider caching common generations. Fallback: call Claude API directly from a Next.js API route instead of Edge Function. |
| **Recharts bundle size** — Recharts adds ~200KB to client bundle | Degrades performance | Low | Only import specific chart types (`import { BarChart } from 'recharts'`). Consider dynamic imports (`next/dynamic`) for chart components. |
| **Supabase RLS + real-time conflicts** — real-time subscriptions require specific RLS policies | Blocks Session 2.7 | Medium | Test real-time with permissive RLS first, then tighten in Session 5.2. If real-time is blocked, fall back to polling every 30 seconds. |
| **Zod v4 breaking changes** — `zod@4.3.6` in package.json may have different API from common examples | Slows Sessions 2.3, 3.2, 4.1 | Medium | Check Zod v4 docs for schema syntax differences. If blocked, pin to `zod@3.23` which has extensive documentation. |

### Fallback Strategies

1. **If Supabase connection fails (Session 2.1):** Use local Supabase instance via Docker (`npx supabase start`). This gives a local PostgreSQL + API that mirrors production exactly.

2. **If AI generation is unreliable (Session 3.5):** Implement a simple variable-replacement engine as fallback — parse `{{variable_name}}` from templates and show a form with those fields. No AI, but still faster than writing from scratch.

3. **If drag-and-drop proves too complex (Session 2.4):** Ship with "Move to Stage" dropdown on each card instead. DnD becomes a Phase 5 polish item.

4. **If Recharts rendering issues (Session 4.5):** Ship with data tables instead of charts. Tables with sorting still provide the analytical value. Charts become a polish item.

5. **If Vercel deployment has edge-case issues (Session 5.6):** Deploy to Railway or Render as alternative. The app is standard Next.js and will run anywhere Node.js runs.

---

## Session Dependency Graph

```
Phase 2 (Core Pipeline):
2.1 ─┬─ 2.2 (dashboard)
     ├─ 2.3 ─── 2.4 ─── 2.5 (pipeline CRUD → DnD → filters)
     │          │
     │          2.6 (detail page, needs 2.3)
     │          │
     │          2.7 (real-time + templates, needs 2.4)
     │
Phase 3 (Gigs + Proposals):
     ├─ 3.1 ─── 3.2 ─── 3.3 (gig display → form → versions)
     │
     └─ 2.7 ── 3.4 ─── 3.5 ─── 3.6 (templates → AI gen → Quick-Fire)

Phase 4 (Delivery + Analytics):
2.3 ── 4.1 ─── 4.2 ─── 4.3 (project CRUD → checklists → time)
2.1 ── 4.4 ─── 4.5 ─── 4.6 (revenue → charts → metrics)

Phase 5 (Polish):
2.1 ── 5.1 ─── 5.2 (auth → RLS)
4.2 ── 5.3 (notifications)
4.4 ── 5.4 (CSV export)
4.2 ── 5.5 (webhooks)
5.2 ── 5.6 (deployment)
```

---

## Recommended Session Order

For maximum velocity and early usability, the recommended order interleaves phases to deliver usable features as early as possible:

| Order | Session | What Ships |
|-------|---------|------------|
| 1 | **2.1** | Supabase connected, live data on dashboard |
| 2 | **2.2** | Dashboard metrics + first Recharts chart |
| 3 | **2.3** | Opportunity CRUD forms |
| 4 | **2.4** | Kanban drag-and-drop |
| 5 | **2.5** | Pipeline filtering |
| 6 | **2.6** | Opportunity detail page |
| 7 | **2.7** | Real-time + template listing |
| 8 | **3.1** | Gig cards display |
| 9 | **3.4** | Template library CRUD |
| 10 | **3.5** | AI proposal generation |
| 11 | **3.6** | Quick-Fire polish — **MORNING SESSION NOW USABLE** |
| 12 | **3.2** | Gig create/edit + pricing editor |
| 13 | **3.3** | Gig version history |
| 14 | **4.4** | Revenue entry management |
| 15 | **4.5** | Recharts dashboard — **REVENUE TRACKING NOW USABLE** |
| 16 | **4.1** | Project CRUD |
| 17 | **4.2** | Milestone checklists |
| 18 | **4.3** | Time tracking |
| 19 | **4.6** | Daily metrics + recommendations |
| 20 | **5.1** | Supabase auth |
| 21 | **5.2** | Route protection + error boundaries |
| 22 | **5.3** | Notifications |
| 23 | **5.4** | CSV export |
| 24 | **5.5** | n8n webhooks |
| 25 | **5.6** | Production deployment |

**Milestone 1 (after session 11):** Alex's morning proposal workflow is fully functional.
**Milestone 2 (after session 15):** Alex can track and visualize revenue across platforms.
**Milestone 3 (after session 19):** Full delivery tracking and analytics.
**Milestone 4 (after session 25):** Production-ready, deployed, and secured.

---

## Notes for AI Coding Sessions

1. **Always start with:** `git log --oneline -5` to see where you left off, then read this plan.
2. **Always end with:** `npm run build` to verify no regressions, then commit.
3. **Commit message format:** `feat(phase.session): description` — e.g., `feat(2.3): add opportunity CRUD forms with Zod validation`.
4. **If a session runs long:** Split remaining work into a `.a` and `.b` sub-session rather than rushing.
5. **If blocked on a dependency:** Skip to a parallel-path session and come back.
6. **Check `package.json` versions** before writing code — `zod@4`, `@dnd-kit/sortable@10`, and `recharts@3` may have different APIs than older tutorials suggest. Verify against current docs.

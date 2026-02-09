# Data Layer Architecture Plan

> Supabase query patterns, real-time subscriptions, RPC functions, type safety, and schema drift fixes.

---

## 1. Schema Drift Audit (Fix Before Phase 2)

The TypeScript types in `src/lib/supabase/types.ts` have drifted from the SQL migrations. These must be fixed in a migration `015_fix_schema_drift.sql` or by correcting the types stub.

### daily_metrics — 7 mismatches

| SQL Migration (009) | TypeScript types.ts | Action |
|---------------------|---------------------|--------|
| `proposals_viewed` | Missing | Add to TS |
| `responses_received` | Missing | Add to TS |
| `contracts_won` | Missing | Add to TS |
| `gig_impressions` | `impressions` | Rename in TS |
| `gig_clicks` | `clicks` | Rename in TS |
| `gig_orders` | `orders` | Rename in TS |
| Missing | `proposals_won` | Remove from TS |
| Missing | `hours_worked` | Remove from TS |
| Missing | `updated_at` | Remove from TS (SQL has no updated_at) |

### content_blocks — 6 mismatches

| SQL Migration (010) | TypeScript types.ts | Action |
|---------------------|---------------------|--------|
| `content_text` | `body` | Rename in TS to `content_text` |
| `platform_tags TEXT[]` | `platform_id UUID` | Fix TS to `platform_tags: string[]` |
| `pillar_tags TEXT[]` | `pillar_id UUID` | Fix TS to `pillar_tags: string[]` |
| `times_used INTEGER` | `is_active BOOLEAN` | Fix TS to `times_used: number` |
| `tags: string[]` | Present in TS | Remove — SQL has no `tags` column |
| Categories: `bio, credential, process, testimonial, case_study` | Categories: `headline, overview, case_study, faq, skill_description, testimonial` | Fix TS enum to match SQL |

### gig_versions — 4 mismatches

| SQL Migration (011) | TypeScript types.ts | Action |
|---------------------|---------------------|--------|
| `pricing_json JSONB` | `pricing_basic/standard/premium` | Fix TS to `pricing_json: Record<string, unknown>` |
| `performance_snapshot_json JSONB` | Missing | Add to TS |
| `tags TEXT[]` | Present | Correct (both have it) |
| `delivery_days_*` | Present in TS | Remove — SQL stores in pricing_json |

### Recommended Fix

Create migration `015_align_schema.sql` to add missing columns where the TS types had good ideas (like `updated_at` on daily_metrics), then regenerate types. Or regenerate types from the actual DB schema and update the stubs.

---

## 2. Supabase Query Patterns

### Server Components (reads)

```typescript
// src/app/pipeline/page.tsx (server component version)
import { createClient } from "@/lib/supabase/server"

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*, platforms(name), service_pillars(name, color)")
    .order("created_at", { ascending: false })

  return <PipelineView opportunities={opportunities ?? []} />
}
```

### Client Components (mutations + real-time)

```typescript
// Hooks use createClient() from @/lib/supabase/client
// Pattern: { data, loading, error, fetchFn, mutateFn }
```

### Pagination Strategy

```typescript
const PAGE_SIZE = 25

async function fetchPage(page: number, filters: Filters) {
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, count } = await supabase
    .from("opportunities")
    .select("*", { count: "exact" })
    .range(from, to)
    .order("created_at", { ascending: false })

  return { data, total: count, hasMore: (count ?? 0) > to + 1 }
}
```

### Compound Filtering

```typescript
// Build query dynamically — each filter is optional
let query = supabase.from("opportunities").select("*")
if (filters.stage) query = query.eq("stage", filters.stage)
if (filters.platform_id) query = query.eq("platform_id", filters.platform_id)
if (filters.pillar_id) query = query.eq("pillar_id", filters.pillar_id)
if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom)
if (filters.dateTo) query = query.lte("created_at", filters.dateTo)
if (filters.search) query = query.ilike("job_title", `%${filters.search}%`)
```

### Join Patterns

```typescript
// Fetch opportunities with platform and pillar names
const { data } = await supabase
  .from("opportunities")
  .select(`
    *,
    platforms ( name ),
    service_pillars ( name, color ),
    proposal_templates ( name )
  `)
```

---

## 3. Real-Time Subscriptions

### Tables That Need Real-Time

| Table | Why | Trigger |
|-------|-----|---------|
| `opportunities` | Kanban DnD must reflect stage changes instantly | INSERT, UPDATE, DELETE |
| `daily_metrics` | Dashboard counters update during morning session | INSERT, UPDATE |
| `revenue_entries` | Revenue dashboard stays current | INSERT |

### Subscription Pattern

```typescript
// src/lib/hooks/useOpportunities.ts — add subscription
useEffect(() => {
  const channel = supabase
    .channel("opportunities-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "opportunities" },
      (payload) => {
        if (payload.eventType === "INSERT") {
          setOpportunities(prev => [payload.new as Opportunity, ...prev])
        } else if (payload.eventType === "UPDATE") {
          setOpportunities(prev =>
            prev.map(opp => opp.id === payload.new.id ? payload.new as Opportunity : opp)
          )
        } else if (payload.eventType === "DELETE") {
          setOpportunities(prev => prev.filter(opp => opp.id !== payload.old.id))
        }
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [supabase])
```

### Optimistic Updates for Kanban

Already implemented in `useOpportunities.updateStage()` — local state updates immediately, reverts on error by re-fetching. This is the correct pattern.

---

## 4. Data Aggregation — RPC Functions vs Client-Side

### Dashboard Metrics (use RPC)

```sql
-- 015_create_rpc_functions.sql

-- Weekly revenue (current week, Mon-Sun)
CREATE OR REPLACE FUNCTION get_weekly_revenue()
RETURNS TABLE(total_revenue NUMERIC, entry_count BIGINT) AS $$
  SELECT COALESCE(SUM(net_amount), 0), COUNT(*)
  FROM revenue_entries
  WHERE received_date >= date_trunc('week', CURRENT_DATE)
    AND received_date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days';
$$ LANGUAGE sql STABLE;

-- Pipeline value (sum of contract_value for active stages)
CREATE OR REPLACE FUNCTION get_pipeline_value()
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(contract_value), 0)
  FROM opportunities
  WHERE stage IN ('contracted', 'in_progress', 'delivered', 'review_requested');
$$ LANGUAGE sql STABLE;

-- Win rate (proposals sent vs contracts won, last 90 days)
CREATE OR REPLACE FUNCTION get_win_rate(days_back INTEGER DEFAULT 90)
RETURNS NUMERIC AS $$
  SELECT CASE
    WHEN COUNT(*) FILTER (WHERE stage != 'discovered') = 0 THEN 0
    ELSE COUNT(*) FILTER (WHERE stage IN ('contracted','in_progress','delivered','review_requested','complete'))::NUMERIC
         / COUNT(*) FILTER (WHERE stage != 'discovered')
  END
  FROM opportunities
  WHERE created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL;
$$ LANGUAGE sql STABLE;

-- Revenue by platform (for bar chart)
CREATE OR REPLACE FUNCTION get_revenue_by_platform(days_back INTEGER DEFAULT 30)
RETURNS TABLE(platform_id UUID, platform_name TEXT, total NUMERIC) AS $$
  SELECT r.platform_id, p.name, COALESCE(SUM(r.net_amount), 0)
  FROM revenue_entries r
  JOIN platforms p ON p.id = r.platform_id
  WHERE r.received_date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  GROUP BY r.platform_id, p.name
  ORDER BY total DESC;
$$ LANGUAGE sql STABLE;

-- Revenue by pillar (for donut chart)
CREATE OR REPLACE FUNCTION get_revenue_by_pillar(days_back INTEGER DEFAULT 30)
RETURNS TABLE(pillar_id UUID, pillar_name TEXT, pillar_color TEXT, total NUMERIC) AS $$
  SELECT r.pillar_id, sp.name, sp.color, COALESCE(SUM(r.net_amount), 0)
  FROM revenue_entries r
  JOIN service_pillars sp ON sp.id = r.pillar_id
  WHERE r.received_date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  GROUP BY r.pillar_id, sp.name, sp.color
  ORDER BY total DESC;
$$ LANGUAGE sql STABLE;

-- Effective hourly rate
CREATE OR REPLACE FUNCTION get_effective_hourly_rate()
RETURNS NUMERIC AS $$
  SELECT CASE
    WHEN COALESCE(SUM(actual_hours), 0) = 0 THEN 0
    ELSE SUM(contract_value) / SUM(actual_hours)
  END
  FROM opportunities
  WHERE stage IN ('complete', 'delivered', 'review_requested')
    AND actual_hours > 0 AND contract_value > 0;
$$ LANGUAGE sql STABLE;
```

### Calling RPC from Next.js

```typescript
// Server component
const { data } = await supabase.rpc("get_weekly_revenue")
const weeklyRevenue = data?.[0]?.total_revenue ?? 0

// Client hook
const { data } = await supabase.rpc("get_revenue_by_platform", { days_back: 30 })
```

### Keep Client-Side

- `calculations.ts` functions remain useful for one-off UI computations
- Conversion rate per gig (simple division, already in row data)
- Template win rate (already a generated column in SQL)

---

## 5. Edge Functions

### AI Proposal Generation

```typescript
// supabase/functions/generate-proposal/index.ts
interface GenerateProposalRequest {
  job_description: string
  template_id?: string
  platform: string
  pillar: string
  client_context?: string
}

interface GenerateProposalResponse {
  proposal_text: string
  word_count: number
  estimated_tokens: number
}
```

### Daily Metrics Snapshot (cron)

```typescript
// supabase/functions/daily-snapshot/index.ts
// Triggered by Supabase cron or n8n at end of day
// Aggregates today's activity into daily_metrics row
```

### Webhook Receiver (n8n)

```typescript
// src/app/api/webhooks/n8n/route.ts
// POST — receives metric updates, revenue entries from n8n workflows
// Authenticated via API key in X-API-Key header
```

---

## 6. Type Safety Strategy

### Utility Types

```typescript
// Add to src/lib/supabase/types.ts
type Tables = Database["public"]["Tables"]
export type TableRow<T extends keyof Tables> = Tables[T]["Row"]
export type TableInsert<T extends keyof Tables> = Tables[T]["Insert"]
export type TableUpdate<T extends keyof Tables> = Tables[T]["Update"]

// Usage:
const opp: TableRow<"opportunities"> = ...
const insert: TableInsert<"opportunities"> = { platform_id: "...", job_title: "..." }
```

### Zod Schema Derivation

```typescript
// src/lib/schemas/opportunity.ts
import { z } from "zod"
import { OPPORTUNITY_STAGES, CONTRACT_TYPES } from "@/lib/utils/constants"

export const opportunitySchema = z.object({
  platform_id: z.string().uuid("Select a platform"),
  pillar_id: z.string().uuid().optional(),
  job_title: z.string().min(3, "Title must be at least 3 characters"),
  job_url: z.string().url().optional().or(z.literal("")),
  job_description: z.string().optional(),
  stage: z.enum(OPPORTUNITY_STAGES as [string, ...string[]]).default("discovered"),
  contract_type: z.enum(CONTRACT_TYPES as [string, ...string[]]).default("fixed"),
  budget_min: z.coerce.number().positive().optional(),
  budget_max: z.coerce.number().positive().optional(),
  client_name: z.string().optional(),
  client_company: z.string().optional(),
  notes: z.string().optional(),
})

export type OpportunityFormData = z.infer<typeof opportunitySchema>
```

---

## 7. Row Level Security

Current state: permissive policies for all authenticated users (correct for single-user MVP).

### Production Hardening (Phase 5)

```sql
-- Restrict to specific user ID
ALTER POLICY "Allow all for authenticated users" ON opportunities
  USING (auth.uid() = 'ALEX_USER_UUID');

-- Or use a user_id column added to each table
ALTER TABLE opportunities ADD COLUMN user_id UUID DEFAULT auth.uid();
```

For MVP: current RLS is fine. Add user_id columns when multi-user is needed.

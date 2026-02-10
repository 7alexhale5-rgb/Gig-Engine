# Integrations & Automation Plan

> AI proposal generation, platform APIs, n8n workflows, notifications, exports, and API route design.

---

## 1. AI Proposal Generation (Claude API via Edge Function)

### Edge Function: `supabase/functions/generate-proposal/index.ts`

#### Input Shape

```typescript
interface GenerateProposalRequest {
  job_description: string          // Raw job posting text
  template_id?: string             // Optional — pre-selected template UUID
  platform: string                 // "Upwork" | "Fiverr" | etc.
  pillar: string                   // "Automation & Workflows" | etc.
  client_context?: string          // Optional notes about the client
  tone?: "professional" | "casual" | "technical"  // Default: professional
  max_words?: number               // Default: 200
}
```

#### Output Shape

```typescript
interface GenerateProposalResponse {
  proposal_text: string            // The generated proposal
  word_count: number
  template_used: string | null     // Template name if one was applied
  personalization_notes: string[]  // What was customized from the template
  estimated_tokens_used: number
}
```

#### System Prompt Structure

```
You are a proposal writer for PrettyFly.ai, a freelance agency specializing in
automation, AI implementation, system architecture, web development, and
strategic consulting.

CONTEXT:
- Platform: {platform}
- Service Pillar: {pillar}
- Operator: Alex, CTO and founder, expert in automation/AI/CRM/web dev

TEMPLATE (if provided):
{template_text}

RULES:
- Keep under {max_words} words
- Follow this structure: Hook → Credibility → Approach → Differentiator → CTA
- Reference specific details from the job description
- Never use generic filler ("I'm excited to apply")
- Include a concrete timeline ("I can start this week")
- Match the platform's tone (Upwork=professional, Fiverr=concise)

JOB DESCRIPTION:
{job_description}

{client_context ? "CLIENT NOTES: " + client_context : ""}

Generate a personalized proposal:
```

#### Token & Cost Estimation

- Average proposal: ~300 tokens input + ~250 tokens output
- Cost per proposal (Claude Sonnet): ~$0.003
- Daily budget at 10 proposals: ~$0.03/day
- Monthly budget: ~$1/month

#### Quick-Fire Batch Mode

For morning proposal sessions (7:00-7:45 AM), the Quick-Fire panel queues multiple job descriptions and generates proposals sequentially. Each generation is independent (no batching at the API level) but the UI streams results as they complete.

```typescript
// Client-side batch orchestration
async function generateBatch(jobs: QuickFireJob[]) {
  const results: GenerateProposalResponse[] = []
  for (const job of jobs) {
    const result = await fetch("/api/generate-proposal", {
      method: "POST",
      body: JSON.stringify(job),
    }).then(r => r.json())
    results.push(result)
    onPartialResult(results) // Update UI after each one
  }
  return results
}
```

#### Fallback When API Unavailable

1. Show the raw template with variable placeholders highlighted
2. User manually fills in `{client_name}`, `{specific_need}`, etc.
3. Log the manual generation for tracking (still counts as proposal sent)

---

## 2. Platform Integration Strategy

### Tier 1: Manual with In-App Logging (Now)

All platforms start here. The app provides structured logging UI — user copies proposals from the app, pastes into platform, logs the result.

| Platform | API Available? | Auto-Integration Timeline |
|----------|---------------|---------------------------|
| Upwork | Partner API (requires approval) | Phase 5+ (3-6 month approval) |
| Fiverr | No public API | Manual only (scraping risky) |
| Toptal | Internal only | Manual only |
| Arc.dev | No public API | Manual only |
| PeoplePerHour | Limited API | Explore in Phase 5 |
| LinkedIn | Sales Navigator API ($$$) | Manual only |
| Direct/Referral | N/A | Already tracked in app |

### Tier 2: Semi-Automated (Phase 5)

- **Upwork Partner API** (if approved): Pull job search results, submit proposals via API, sync message threads
- **Browser Extension** (future): Click-to-import job postings from any platform into the pipeline

### What Can Be Automated Now (via n8n)

- Email notifications when proposals get responses (monitor inbox)
- Slack alerts for daily metric thresholds
- Scheduled reminders for follow-ups
- Revenue tracking from payment notification emails

---

## 3. n8n Workflow Automation Design

### Workflow 1: Daily Metrics Reminder

```
Trigger: Cron (7:00 AM daily)
→ Check: GET /api/metrics/today
→ If proposals_sent < target
  → Send Slack message: "Morning! 0/10 proposals sent. Pipeline has X opportunities."
→ End
```

### Workflow 2: Stale Opportunity Alert

```
Trigger: Cron (6:00 PM daily)
→ Fetch: GET /api/opportunities?stage=proposal_sent&older_than=7d
→ For each stale opportunity:
  → Send Slack message: "Follow up: {job_title} on {platform} — no response in 7 days"
→ End
```

### Workflow 3: Review Request Trigger

```
Trigger: Webhook from app (opportunity.stage → "delivered")
→ Wait 48 hours
→ Send email to client: "How was the delivery? We'd appreciate a review."
→ Update opportunity: review_requested_at = now()
→ POST /api/opportunities/{id}/update { stage: "review_requested" }
```

### Workflow 4: Revenue Logger

```
Trigger: Email monitor (payment notification from Upwork/Fiverr/PayPal)
→ Parse: Extract amount, platform, date
→ POST /api/revenue { amount, platform_id, received_date }
→ Send Slack: "Payment received: $497 from Fiverr"
```

### Workflow 5: Weekly Summary Generator

```
Trigger: Cron (Sunday 8:00 PM)
→ Fetch: GET /api/analytics/weekly-summary
→ Compose email with: revenue total, proposals sent, win rate, best gig, recommendations
→ Send to Alex's email
```

---

## 4. API Route Design

All API routes live under `src/app/api/`. Authenticated via API key in `X-API-Key` header for external webhooks, or Supabase session for browser requests.

### Routes

```
src/app/api/
├── generate-proposal/
│   └── route.ts           # POST — AI proposal generation (calls Edge Function or Claude directly)
├── opportunities/
│   └── route.ts           # GET (list), POST (create)
│   └── [id]/
│       └── route.ts       # GET, PATCH, DELETE
├── metrics/
│   ├── route.ts           # GET (date range), POST (log daily metrics)
│   └── today/
│       └── route.ts       # GET — today's metrics summary
├── revenue/
│   └── route.ts           # GET (list), POST (create entry)
├── analytics/
│   ├── weekly-summary/
│   │   └── route.ts       # GET — aggregated weekly stats
│   └── dashboard/
│       └── route.ts       # GET — all dashboard metric values
└── webhooks/
    └── n8n/
        └── route.ts       # POST — generic n8n webhook receiver
```

### Auth Middleware Pattern

```typescript
// src/lib/api/auth.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function authenticateRequest(req: NextRequest) {
  // Check for API key (external webhooks)
  const apiKey = req.headers.get("x-api-key")
  if (apiKey && apiKey === process.env.WEBHOOK_API_KEY) {
    return { authenticated: true, source: "api_key" }
  }

  // Check for Supabase session (browser requests)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    return { authenticated: true, source: "session", user }
  }

  return { authenticated: false }
}
```

### Generate Proposal Route

```typescript
// src/app/api/generate-proposal/route.ts
import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { job_description, template_id, platform, pillar, client_context, max_words = 200 } = body

  // Fetch template if provided
  let template_text = ""
  if (template_id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("proposal_templates")
      .select("template_text")
      .eq("id", template_id)
      .single()
    template_text = data?.template_text ?? ""
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 500,
    system: buildSystemPrompt(platform, pillar, template_text),
    messages: [{ role: "user", content: buildUserPrompt(job_description, client_context, max_words) }],
  })

  const proposal_text = message.content[0].type === "text" ? message.content[0].text : ""

  return NextResponse.json({
    proposal_text,
    word_count: proposal_text.split(/\s+/).length,
    template_used: template_text ? template_id : null,
    estimated_tokens_used: message.usage.input_tokens + message.usage.output_tokens,
  })
}
```

---

## 5. Notification System

### In-App Notifications (Phase 5)

```sql
-- Migration: 016_create_notifications.sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('deadline', 'review', 'milestone', 'revenue', 'system')),
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  link TEXT DEFAULT '',           -- Internal route to navigate to
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Notification Triggers

| Trigger | Type | Channel |
|---------|------|---------|
| Delivery deadline in 24h | `deadline` | In-app + Slack |
| Proposal viewed (if trackable) | `review` | In-app |
| Project milestone completed | `milestone` | In-app |
| Revenue entry created | `revenue` | Slack |
| Weekly summary ready | `system` | Email |

### External Channels

- **Slack:** Incoming webhook URL stored in settings. Simple POST with blocks.
- **Email:** Supabase Auth email or Resend API for transactional emails.
- **Quiet Hours:** 10 PM - 6:30 AM — queue notifications, deliver at 7:00 AM.

---

## 6. Export & Reporting

### CSV Export

```typescript
// src/app/api/export/revenue/route.ts
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const supabase = await createClient()
  let query = supabase.from("revenue_entries").select("*, platforms(name), service_pillars(name)")
  if (from) query = query.gte("received_date", from)
  if (to) query = query.lte("received_date", to)

  const { data } = await query.order("received_date", { ascending: false })

  const csv = generateCSV(data, [
    "received_date", "platforms.name", "service_pillars.name",
    "amount", "platform_fee_amount", "net_amount", "entry_type", "notes"
  ])

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=revenue-${from}-${to}.csv`,
    },
  })
}
```

### Weekly Summary Email

Generated by n8n workflow or Supabase cron function. Content:

```
PrettyFly Weekly Summary — Week of {date}

Revenue: ${total} (${change}% vs last week)
  Upwork: ${upwork_total}
  Fiverr: ${fiverr_total}

Proposals: {sent} sent, {won} won ({win_rate}% win rate)
Active Pipeline: {count} opportunities worth ${pipeline_value}
Top Gig: {gig_title} — {orders} orders, ${revenue}

Recommendations:
- {recommendation_1}
- {recommendation_2}
```

---

## 7. Security & API Key Management

### Environment Variables

```
# .env.local (never committed)
NEXT_PUBLIC_SUPABASE_URL=         # Public — used in browser
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Public — used in browser
SUPABASE_SERVICE_ROLE_KEY=        # Server-only — bypasses RLS
ANTHROPIC_API_KEY=                # Server-only — Claude API
WEBHOOK_API_KEY=                  # Server-only — n8n webhook auth
SLACK_WEBHOOK_URL=                # Server-only — Slack notifications
```

### Edge Function Environment

Set via Supabase dashboard or CLI:
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### Webhook Authentication

All `/api/webhooks/*` routes require `X-API-Key` header matching `WEBHOOK_API_KEY`. Reject with 401 if missing or wrong.

### CORS

Next.js API routes default to same-origin. For n8n webhooks calling in:
```typescript
// In webhook route handlers
const headers = {
  "Access-Control-Allow-Origin": process.env.N8N_ORIGIN || "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
}
```

### Rate Limiting

- Proposal generation: Max 20/hour per session (prevent runaway costs)
- Webhook endpoints: Max 60/minute (prevent abuse)
- Implement via simple in-memory counter (single-user app, no Redis needed)

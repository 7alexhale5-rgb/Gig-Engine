export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { OpportunityStage, RevenueEntryType } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Webhook event types
// ---------------------------------------------------------------------------

type WebhookEventType = "revenue_entry" | "metric_update" | "stage_change"

interface WebhookEvent {
  type: WebhookEventType
  payload: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Typed payload shapes
// ---------------------------------------------------------------------------

interface RevenueEntryPayload {
  amount: number
  received_date: string
  platform_id?: string
  pillar_id?: string
  opportunity_id?: string
  currency?: string
  entry_type?: RevenueEntryType
  platform_fee_amount?: number
  notes?: string
}

interface MetricUpdatePayload {
  date: string
  platform_id?: string
  proposals_sent?: number
  proposals_viewed?: number
  responses_received?: number
  contracts_won?: number
  gig_impressions?: number
  gig_clicks?: number
  gig_orders?: number
  revenue?: number
  notes?: string
}

interface StageChangePayload {
  opportunity_id: string
  new_stage: OpportunityStage
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/n8n
// ---------------------------------------------------------------------------

/**
 * Generic webhook receiver for n8n automation workflows.
 *
 * Requires `x-api-key` header matching WEBHOOK_API_KEY env var.
 *
 * Accepts events:
 *   - revenue_entry: Create a new revenue entry
 *   - metric_update: Upsert daily metrics
 *   - stage_change: Update an opportunity's pipeline stage
 */
export async function POST(req: NextRequest) {
  try {
    // --- Authenticate via API key ---
    const apiKey = req.headers.get("x-api-key")
    if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
      return NextResponse.json(
        { data: null, error: "Unauthorized: invalid or missing API key" },
        { status: 401 },
      )
    }

    // --- Parse and validate event shape ---
    const body: unknown = await req.json()

    if (
      !body ||
      typeof body !== "object" ||
      !("type" in body) ||
      !("payload" in body)
    ) {
      return NextResponse.json(
        {
          data: null,
          error:
            "Invalid webhook body. Expected { type: string, payload: object }",
        },
        { status: 400 },
      )
    }

    const event = body as WebhookEvent
    const validTypes: WebhookEventType[] = [
      "revenue_entry",
      "metric_update",
      "stage_change",
    ]

    if (!validTypes.includes(event.type)) {
      return NextResponse.json(
        {
          data: null,
          error: `Unknown event type: ${event.type}. Valid types: ${validTypes.join(", ")}`,
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // --- Route to appropriate handler ---
    switch (event.type) {
      case "revenue_entry":
        return handleRevenueEntry(supabase, event.payload)

      case "metric_update":
        return handleMetricUpdate(supabase, event.payload)

      case "stage_change":
        return handleStageChange(supabase, event.payload)

      default:
        return NextResponse.json(
          { data: null, error: "Unhandled event type" },
          { status: 400 },
        )
    }
  } catch (err) {
    console.error("Webhook processing error:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleRevenueEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payload: Record<string, unknown>,
): Promise<NextResponse> {
  const { amount, received_date } = payload as Partial<RevenueEntryPayload>

  if (typeof amount !== "number" || !received_date) {
    return NextResponse.json(
      {
        data: null,
        error: "revenue_entry requires amount (number) and received_date (string)",
      },
      { status: 400 },
    )
  }

  const insertData: Record<string, unknown> = {
    amount,
    received_date,
  }

  // Copy optional fields if present
  const optionalFields: (keyof RevenueEntryPayload)[] = [
    "platform_id",
    "pillar_id",
    "opportunity_id",
    "currency",
    "entry_type",
    "platform_fee_amount",
    "notes",
  ]
  for (const field of optionalFields) {
    if (payload[field] !== undefined) {
      insertData[field] = payload[field]
    }
  }

  const { data, error } = await supabase
    .from("revenue_entries")
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error("Webhook: failed to create revenue entry:", error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({
    data: { event: "revenue_entry", result: data },
    error: null,
  })
}

async function handleMetricUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payload: Record<string, unknown>,
): Promise<NextResponse> {
  const { date } = payload as Partial<MetricUpdatePayload>

  if (!date || typeof date !== "string") {
    return NextResponse.json(
      {
        data: null,
        error: "metric_update requires date (string, YYYY-MM-DD)",
      },
      { status: 400 },
    )
  }

  const upsertData: Record<string, unknown> = { date }

  // Copy metric fields if present
  const metricFields: (keyof MetricUpdatePayload)[] = [
    "platform_id",
    "proposals_sent",
    "proposals_viewed",
    "responses_received",
    "contracts_won",
    "gig_impressions",
    "gig_clicks",
    "gig_orders",
    "revenue",
    "notes",
  ]
  for (const field of metricFields) {
    if (payload[field] !== undefined) {
      upsertData[field] = payload[field]
    }
  }

  const { data, error } = await supabase
    .from("daily_metrics")
    .upsert(upsertData, { onConflict: "date,platform_id" })
    .select()
    .single()

  if (error) {
    console.error("Webhook: failed to upsert metrics:", error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({
    data: { event: "metric_update", result: data },
    error: null,
  })
}

async function handleStageChange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payload: Record<string, unknown>,
): Promise<NextResponse> {
  const { opportunity_id, new_stage } =
    payload as Partial<StageChangePayload>

  if (!opportunity_id || !new_stage) {
    return NextResponse.json(
      {
        data: null,
        error:
          "stage_change requires opportunity_id (UUID) and new_stage (OpportunityStage)",
      },
      { status: 400 },
    )
  }

  const validStages: OpportunityStage[] = [
    "discovered",
    "proposal_sent",
    "interview",
    "contracted",
    "in_progress",
    "delivered",
    "review_requested",
    "complete",
    "lost",
  ]

  if (!validStages.includes(new_stage)) {
    return NextResponse.json(
      {
        data: null,
        error: `Invalid stage: ${new_stage}. Valid stages: ${validStages.join(", ")}`,
      },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from("opportunities")
    .update({
      stage: new_stage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opportunity_id)
    .select()
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { data: null, error: "Opportunity not found" },
        { status: 404 },
      )
    }
    console.error("Webhook: failed to update stage:", error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({
    data: { event: "stage_change", result: data },
    error: null,
  })
}

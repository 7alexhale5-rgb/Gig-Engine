export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { dailyMetricsSchema } from "@/lib/schemas"
import type { DailyMetrics } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// GET /api/metrics
// ---------------------------------------------------------------------------

/**
 * List daily metrics with optional date range filter.
 *
 * Query params:
 *   from         - Start date (YYYY-MM-DD)
 *   to           - End date (YYYY-MM-DD)
 *   platform_id  - Filter by platform UUID
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const platformId = searchParams.get("platform_id")

    let query = supabase
      .from("daily_metrics")
      .select("*")
      .order("date", { ascending: false })

    if (from) {
      query = query.gte("date", from)
    }
    if (to) {
      query = query.lte("date", to)
    }
    if (platformId) {
      query = query.eq("platform_id", platformId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch daily metrics:", error)
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      data: (data as DailyMetrics[]) ?? [],
      error: null,
    })
  } catch (err) {
    console.error("Unexpected error fetching metrics:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// POST /api/metrics
// ---------------------------------------------------------------------------

/**
 * Upsert daily metrics. Uses (date, platform_id) as the conflict key.
 * If a record already exists for the given date + platform, it will be updated.
 */
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()

    // Validate with Zod
    const result = dailyMetricsSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          data: null,
          error: "Validation failed",
          issues: result.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      )
    }

    const validated = result.data

    // Clean empty-string platform_id to undefined for DB upsert
    const upsertData: Record<string, unknown> = { ...validated }
    if (upsertData.platform_id === "") {
      delete upsertData.platform_id
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("daily_metrics")
      .upsert(upsertData, { onConflict: "date,platform_id" })
      .select()
      .single()

    if (error) {
      console.error("Failed to upsert daily metrics:", error)
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { data: data as DailyMetrics, error: null },
      { status: 201 },
    )
  } catch (err) {
    console.error("Unexpected error upserting metrics:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    )
  }
}

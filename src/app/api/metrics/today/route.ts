export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { format } from "date-fns"
import type { DailyMetrics } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Aggregated metric shape
// ---------------------------------------------------------------------------

interface TodayMetrics {
  date: string
  proposals_sent: number
  proposals_viewed: number
  responses_received: number
  contracts_won: number
  gig_impressions: number
  gig_clicks: number
  gig_orders: number
  revenue: number
  platform_count: number
}

// ---------------------------------------------------------------------------
// GET /api/metrics/today
// ---------------------------------------------------------------------------

/**
 * Returns today's aggregated metrics across all platforms.
 * Sums up all daily_metrics rows whose date matches today.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const today = format(new Date(), "yyyy-MM-dd")

    const { data, error } = await supabase
      .from("daily_metrics")
      .select("*")
      .eq("date", today)

    if (error) {
      console.error("Failed to fetch today metrics:", error)
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 },
      )
    }

    const rows = (data as DailyMetrics[]) ?? []

    // Aggregate across all platform rows for today
    const aggregated: TodayMetrics = rows.reduce(
      (acc, row) => ({
        date: today,
        proposals_sent: acc.proposals_sent + row.proposals_sent,
        proposals_viewed: acc.proposals_viewed + row.proposals_viewed,
        responses_received: acc.responses_received + row.responses_received,
        contracts_won: acc.contracts_won + row.contracts_won,
        gig_impressions: acc.gig_impressions + row.gig_impressions,
        gig_clicks: acc.gig_clicks + row.gig_clicks,
        gig_orders: acc.gig_orders + row.gig_orders,
        revenue: acc.revenue + row.revenue,
        platform_count: acc.platform_count + 1,
      }),
      {
        date: today,
        proposals_sent: 0,
        proposals_viewed: 0,
        responses_received: 0,
        contracts_won: 0,
        gig_impressions: 0,
        gig_clicks: 0,
        gig_orders: 0,
        revenue: 0,
        platform_count: 0,
      } satisfies TodayMetrics,
    )

    return NextResponse.json({ data: aggregated, error: null })
  } catch (err) {
    console.error("Unexpected error fetching today metrics:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    )
  }
}

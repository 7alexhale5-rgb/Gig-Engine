export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  startOfWeek,
  endOfWeek,
  subWeeks,
  format,
} from "date-fns"
import type {
  Opportunity,
  RevenueEntry,
  DailyMetrics,
  GigListing,
  OpportunityStage,
} from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

interface WeeklyChange {
  current: number
  previous: number
  change: number
  change_pct: number
}

interface TopGig {
  id: string
  title: string
  revenue: number
  orders: number
}

interface WeeklySummaryData {
  revenue: WeeklyChange
  proposals_sent: WeeklyChange
  win_rate: WeeklyChange
  pipeline_value: number
  top_gig: TopGig | null
  week_start: string
  week_end: string
}

// ---------------------------------------------------------------------------
// Pipeline stages that count towards active pipeline value
// ---------------------------------------------------------------------------

const ACTIVE_STAGES: OpportunityStage[] = [
  "contracted",
  "in_progress",
  "delivered",
]

// ---------------------------------------------------------------------------
// Helper: calculate percentage change
// ---------------------------------------------------------------------------

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

// ---------------------------------------------------------------------------
// GET /api/analytics/weekly-summary
// ---------------------------------------------------------------------------

/**
 * Returns this week vs last week comparison data:
 *   - Revenue total + change
 *   - Proposals sent + change
 *   - Win rate + change
 *   - Top performing gig (by revenue this week)
 *   - Pipeline value
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const now = new Date()

    // Current week boundaries (Mon-Sun)
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 })
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 })

    // Previous week boundaries
    const lastWeekStart = subWeeks(thisWeekStart, 1)
    const lastWeekEnd = subWeeks(thisWeekEnd, 1)

    const thisWeekStartStr = format(thisWeekStart, "yyyy-MM-dd")
    const thisWeekEndStr = format(thisWeekEnd, "yyyy-MM-dd")
    const lastWeekStartStr = format(lastWeekStart, "yyyy-MM-dd")
    const lastWeekEndStr = format(lastWeekEnd, "yyyy-MM-dd")

    // Run all queries in parallel
    const [
      thisWeekRevResult,
      lastWeekRevResult,
      thisWeekMetricsResult,
      lastWeekMetricsResult,
      opportunitiesResult,
      topGigRevenueResult,
    ] = await Promise.all([
      // Revenue: this week
      supabase
        .from("revenue_entries")
        .select("net_amount")
        .gte("received_date", thisWeekStartStr)
        .lte("received_date", thisWeekEndStr),

      // Revenue: last week
      supabase
        .from("revenue_entries")
        .select("net_amount")
        .gte("received_date", lastWeekStartStr)
        .lte("received_date", lastWeekEndStr),

      // Daily metrics: this week
      supabase
        .from("daily_metrics")
        .select("proposals_sent, contracts_won")
        .gte("date", thisWeekStartStr)
        .lte("date", thisWeekEndStr),

      // Daily metrics: last week
      supabase
        .from("daily_metrics")
        .select("proposals_sent, contracts_won")
        .gte("date", lastWeekStartStr)
        .lte("date", lastWeekEndStr),

      // All opportunities for pipeline value
      supabase
        .from("opportunities")
        .select("stage, contract_value"),

      // Revenue entries this week with gig listings for top gig
      supabase
        .from("revenue_entries")
        .select("amount, opportunity_id, opportunities(gig_id, job_title)")
        .gte("received_date", thisWeekStartStr)
        .lte("received_date", thisWeekEndStr),
    ])

    // Check for critical errors
    for (const result of [
      thisWeekRevResult,
      lastWeekRevResult,
      thisWeekMetricsResult,
      lastWeekMetricsResult,
      opportunitiesResult,
    ]) {
      if (result.error) {
        console.error("Weekly summary query failed:", result.error)
        return NextResponse.json(
          { data: null, error: result.error.message },
          { status: 500 },
        )
      }
    }

    // --- Revenue comparison ---
    const thisWeekRevenue = (
      thisWeekRevResult.data as Pick<RevenueEntry, "net_amount">[]
    ).reduce((sum, r) => sum + (r.net_amount ?? 0), 0)

    const lastWeekRevenue = (
      lastWeekRevResult.data as Pick<RevenueEntry, "net_amount">[]
    ).reduce((sum, r) => sum + (r.net_amount ?? 0), 0)

    // --- Proposals comparison ---
    const thisWeekMetrics = thisWeekMetricsResult.data as Pick<
      DailyMetrics,
      "proposals_sent" | "contracts_won"
    >[]
    const lastWeekMetrics = lastWeekMetricsResult.data as Pick<
      DailyMetrics,
      "proposals_sent" | "contracts_won"
    >[]

    const thisWeekProposals = thisWeekMetrics.reduce(
      (sum, m) => sum + m.proposals_sent,
      0,
    )
    const lastWeekProposals = lastWeekMetrics.reduce(
      (sum, m) => sum + m.proposals_sent,
      0,
    )

    // --- Win rate comparison ---
    const thisWeekWon = thisWeekMetrics.reduce(
      (sum, m) => sum + m.contracts_won,
      0,
    )
    const lastWeekWon = lastWeekMetrics.reduce(
      (sum, m) => sum + m.contracts_won,
      0,
    )

    const thisWeekWinRate =
      thisWeekProposals > 0
        ? (thisWeekWon / thisWeekProposals) * 100
        : 0
    const lastWeekWinRate =
      lastWeekProposals > 0
        ? (lastWeekWon / lastWeekProposals) * 100
        : 0

    // --- Pipeline value ---
    const opportunities = opportunitiesResult.data as Pick<
      Opportunity,
      "stage" | "contract_value"
    >[]
    const pipelineValue = opportunities.reduce((sum, opp) => {
      if (
        ACTIVE_STAGES.includes(opp.stage as OpportunityStage) &&
        opp.contract_value !== null
      ) {
        return sum + opp.contract_value
      }
      return sum
    }, 0)

    // --- Top performing gig ---
    let topGig: TopGig | null = null
    if (!topGigRevenueResult.error && topGigRevenueResult.data) {
      const gigRevenueMap = new Map<
        string,
        { title: string; revenue: number; orders: number }
      >()

      for (const row of topGigRevenueResult.data) {
        const entry = row as unknown as {
          amount: number
          opportunity_id: string | null
          opportunities: {
            gig_id: string | null
            job_title: string
          } | null
        }
        const gigId = entry.opportunities?.gig_id
        if (!gigId) continue

        const existing = gigRevenueMap.get(gigId)
        if (existing) {
          existing.revenue += entry.amount
          existing.orders += 1
        } else {
          gigRevenueMap.set(gigId, {
            title: entry.opportunities?.job_title ?? "Unknown",
            revenue: entry.amount,
            orders: 1,
          })
        }
      }

      let maxRevenue = 0
      for (const [id, data] of Array.from(gigRevenueMap)) {
        if (data.revenue > maxRevenue) {
          maxRevenue = data.revenue
          topGig = {
            id,
            title: data.title,
            revenue: data.revenue,
            orders: data.orders,
          }
        }
      }
    }

    // --- Assemble response ---
    const summary: WeeklySummaryData = {
      revenue: {
        current: thisWeekRevenue,
        previous: lastWeekRevenue,
        change: thisWeekRevenue - lastWeekRevenue,
        change_pct: pctChange(thisWeekRevenue, lastWeekRevenue),
      },
      proposals_sent: {
        current: thisWeekProposals,
        previous: lastWeekProposals,
        change: thisWeekProposals - lastWeekProposals,
        change_pct: pctChange(thisWeekProposals, lastWeekProposals),
      },
      win_rate: {
        current: Math.round(thisWeekWinRate * 10) / 10,
        previous: Math.round(lastWeekWinRate * 10) / 10,
        change:
          Math.round((thisWeekWinRate - lastWeekWinRate) * 10) / 10,
        change_pct: pctChange(thisWeekWinRate, lastWeekWinRate),
      },
      pipeline_value: pipelineValue,
      top_gig: topGig,
      week_start: thisWeekStartStr,
      week_end: thisWeekEndStr,
    }

    return NextResponse.json({ data: summary, error: null })
  } catch (err) {
    console.error("Unexpected error in weekly summary:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  startOfWeek,
  endOfWeek,
  subDays,
  format,
} from "date-fns"
import type {
  Opportunity,
  RevenueEntry,
  DailyMetrics,
  OpportunityStage,
} from "@/lib/supabase/types"
import { OPPORTUNITY_STAGES } from "@/lib/utils/constants"

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

interface StageCount {
  stage: OpportunityStage
  count: number
}

interface PlatformRevenue {
  platform_id: string
  platform_name: string
  total: number
}

interface PillarRevenue {
  pillar_id: string
  pillar_name: string
  color: string
  total: number
}

interface DashboardData {
  weekly_revenue: number
  pipeline_value: number
  win_rate: number
  proposals_today: number
  revenue_by_platform: PlatformRevenue[]
  revenue_by_pillar: PillarRevenue[]
  stage_distribution: StageCount[]
}

// ---------------------------------------------------------------------------
// Active pipeline stages for value calculation
// ---------------------------------------------------------------------------

const ACTIVE_STAGES: OpportunityStage[] = [
  "contracted",
  "in_progress",
  "delivered",
]

// ---------------------------------------------------------------------------
// GET /api/analytics/dashboard
// ---------------------------------------------------------------------------

/**
 * Returns aggregated dashboard analytics:
 *   - Weekly revenue (net_amount this week, Mon-Sun)
 *   - Pipeline value (contract_value for active stages)
 *   - Win rate (contracts won / proposals sent, last 90 days)
 *   - Proposals sent today
 *   - Revenue by platform
 *   - Revenue by pillar
 *   - Stage distribution counts
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const now = new Date()
    const today = format(now, "yyyy-MM-dd")
    const weekStart = format(
      startOfWeek(now, { weekStartsOn: 1 }),
      "yyyy-MM-dd",
    )
    const weekEnd = format(
      endOfWeek(now, { weekStartsOn: 1 }),
      "yyyy-MM-dd",
    )
    const ninetyDaysAgo = format(subDays(now, 90), "yyyy-MM-dd")

    // Run all queries in parallel
    const [
      revenueResult,
      opportunitiesResult,
      todayMetricsResult,
      revenueByPlatformResult,
      revenueByPillarResult,
    ] = await Promise.all([
      // 1. Weekly revenue
      supabase
        .from("revenue_entries")
        .select("net_amount")
        .gte("received_date", weekStart)
        .lte("received_date", weekEnd),

      // 2. All opportunities (for pipeline value + stage distribution + win rate)
      supabase
        .from("opportunities")
        .select("stage, contract_value, proposal_sent_at, contracted_at"),

      // 3. Today's metrics (proposals sent today)
      supabase
        .from("daily_metrics")
        .select("proposals_sent")
        .eq("date", today),

      // 4. Revenue by platform (last 90 days)
      supabase
        .from("revenue_entries")
        .select("platform_id, net_amount, platforms(name)")
        .gte("received_date", ninetyDaysAgo),

      // 5. Revenue by pillar (last 90 days)
      supabase
        .from("revenue_entries")
        .select("pillar_id, net_amount, service_pillars(name, color)")
        .gte("received_date", ninetyDaysAgo),
    ])

    // Check for errors
    if (revenueResult.error) {
      console.error("Dashboard revenue query failed:", revenueResult.error)
      return NextResponse.json(
        { data: null, error: revenueResult.error.message },
        { status: 500 },
      )
    }
    if (opportunitiesResult.error) {
      console.error(
        "Dashboard opportunities query failed:",
        opportunitiesResult.error,
      )
      return NextResponse.json(
        { data: null, error: opportunitiesResult.error.message },
        { status: 500 },
      )
    }
    if (todayMetricsResult.error) {
      console.error(
        "Dashboard today metrics query failed:",
        todayMetricsResult.error,
      )
      return NextResponse.json(
        { data: null, error: todayMetricsResult.error.message },
        { status: 500 },
      )
    }

    // --- Calculate weekly revenue ---
    const weeklyRevenue = (
      revenueResult.data as Pick<RevenueEntry, "net_amount">[]
    ).reduce((sum, r) => sum + (r.net_amount ?? 0), 0)

    // --- Calculate pipeline value ---
    const opportunities = opportunitiesResult.data as Pick<
      Opportunity,
      "stage" | "contract_value" | "proposal_sent_at" | "contracted_at"
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

    // --- Calculate win rate (last 90 days) ---
    const recentOpps = opportunities.filter(
      (opp) =>
        opp.proposal_sent_at &&
        opp.proposal_sent_at >= ninetyDaysAgo,
    )
    const proposalsSent90d = recentOpps.length
    const contractsWon90d = recentOpps.filter(
      (opp) => opp.contracted_at !== null,
    ).length
    const winRate =
      proposalsSent90d > 0
        ? (contractsWon90d / proposalsSent90d) * 100
        : 0

    // --- Proposals sent today ---
    const proposalsToday = (
      todayMetricsResult.data as Pick<DailyMetrics, "proposals_sent">[]
    ).reduce((sum, m) => sum + m.proposals_sent, 0)

    // --- Revenue by platform ---
    const platformMap = new Map<
      string,
      { name: string; total: number }
    >()
    if (!revenueByPlatformResult.error && revenueByPlatformResult.data) {
      for (const row of revenueByPlatformResult.data) {
        const entry = row as unknown as {
          platform_id: string | null
          net_amount: number
          platforms: { name: string } | null
        }
        if (!entry.platform_id) continue
        const existing = platformMap.get(entry.platform_id)
        if (existing) {
          existing.total += entry.net_amount ?? 0
        } else {
          platformMap.set(entry.platform_id, {
            name: entry.platforms?.name ?? "Unknown",
            total: entry.net_amount ?? 0,
          })
        }
      }
    }
    const revenueByPlatform: PlatformRevenue[] = Array.from(
      platformMap.entries(),
    )
      .map(([id, v]) => ({
        platform_id: id,
        platform_name: v.name,
        total: v.total,
      }))
      .sort((a, b) => b.total - a.total)

    // --- Revenue by pillar ---
    const pillarMap = new Map<
      string,
      { name: string; color: string; total: number }
    >()
    if (!revenueByPillarResult.error && revenueByPillarResult.data) {
      for (const row of revenueByPillarResult.data) {
        const entry = row as unknown as {
          pillar_id: string | null
          net_amount: number
          service_pillars: { name: string; color: string } | null
        }
        if (!entry.pillar_id) continue
        const existing = pillarMap.get(entry.pillar_id)
        if (existing) {
          existing.total += entry.net_amount ?? 0
        } else {
          pillarMap.set(entry.pillar_id, {
            name: entry.service_pillars?.name ?? "Unknown",
            color: entry.service_pillars?.color ?? "#6B7280",
            total: entry.net_amount ?? 0,
          })
        }
      }
    }
    const revenueByPillar: PillarRevenue[] = Array.from(
      pillarMap.entries(),
    )
      .map(([id, v]) => ({
        pillar_id: id,
        pillar_name: v.name,
        color: v.color,
        total: v.total,
      }))
      .sort((a, b) => b.total - a.total)

    // --- Stage distribution ---
    const stageCounts = new Map<OpportunityStage, number>()
    for (const stage of OPPORTUNITY_STAGES) {
      stageCounts.set(stage, 0)
    }
    for (const opp of opportunities) {
      const stage = opp.stage as OpportunityStage
      stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1)
    }
    const stageDistribution: StageCount[] = OPPORTUNITY_STAGES.map(
      (stage) => ({
        stage,
        count: stageCounts.get(stage) ?? 0,
      }),
    )

    // --- Assemble response ---
    const dashboard: DashboardData = {
      weekly_revenue: weeklyRevenue,
      pipeline_value: pipelineValue,
      win_rate: Math.round(winRate * 10) / 10,
      proposals_today: proposalsToday,
      revenue_by_platform: revenueByPlatform,
      revenue_by_pillar: revenueByPillar,
      stage_distribution: stageDistribution,
    }

    return NextResponse.json({ data: dashboard, error: null })
  } catch (err) {
    console.error("Unexpected error in dashboard analytics:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    )
  }
}

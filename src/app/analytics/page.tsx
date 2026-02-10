"use client"

import { Header, PageContainer } from "@/components/layout"
import { WinRateChart, PlatformComparison, EffectiveRateChart, RecommendationsPanel, MetricsSummaryGrid } from "@/components/analytics"
import { DateRangePicker } from "@/components/shared"

export default function AnalyticsPage() {
  return (
    <>
      <Header
        title="Analytics & Optimizer"
        description="Deep performance analytics and optimization recommendations"
      />
      <PageContainer>
        {/* Date Range Filter */}
        <div className="mb-6 flex justify-end">
          <DateRangePicker />
        </div>

        {/* Summary Grid */}
        <MetricsSummaryGrid
          metrics={{
            totalRevenue: { value: 0, previousValue: 0, format: "currency", label: "Total Revenue" },
            winRate: { value: 0, previousValue: 0, format: "percentage", label: "Win Rate" },
            effectiveHourlyRate: { value: 0, previousValue: 0, format: "rate", label: "Effective Rate" },
            activePipelineValue: { value: 0, previousValue: 0, format: "currency", label: "Pipeline Value" },
            proposalsThisWeek: { value: 0, previousValue: 0, format: "number", label: "Proposals This Week" },
            averageContractValue: { value: 0, previousValue: 0, format: "currency", label: "Avg Contract" },
          }}
        />

        {/* Charts Grid */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <WinRateChart data={[]} />
          <EffectiveRateChart data={[]} />
          <PlatformComparison data={[]} />
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Gig Performance A/B Log</h3>
            <div className="mt-4 flex h-48 items-center justify-center text-sm text-muted-foreground">
              A/B testing log coming soon
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-6">
          <RecommendationsPanel
            recommendations={[
              {
                id: "1",
                type: "milestone",
                title: "Start tracking daily metrics",
                description: "Log your daily proposal counts and gig performance to unlock personalized recommendations.",
                priority: "high",
                actionLabel: "Log Today's Metrics",
                actionUrl: "/dashboard",
              },
              {
                id: "2",
                type: "optimization",
                title: "Complete platform profiles",
                description: "Set up your profiles on all platforms to maximize reach and track performance across channels.",
                priority: "medium",
                actionLabel: "Go to Settings",
                actionUrl: "/settings",
              },
            ]}
          />
        </div>
      </PageContainer>
    </>
  )
}

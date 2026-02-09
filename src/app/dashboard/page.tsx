"use client"

import { Header, PageContainer } from "@/components/layout"
import {
  RevenueChart,
  PillarDistribution,
  PlatformRevenue,
  ProposalFunnel,
  type RevenueDataPoint,
  type PlatformRevenueDataPoint,
  type FunnelStage,
} from "@/components/dashboard"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { SERVICE_PILLARS } from "@/lib/utils/constants"

export default function RevenueDashboard() {
  const pillarData = SERVICE_PILLARS.map((p) => ({
    name: p.name,
    value: 0,
    color: p.color,
  }))

  return (
    <>
      <Header
        title="Revenue Dashboard"
        description="Revenue analytics across all platforms and pillars"
      />
      <PageContainer>
        {/* Top Metrics */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <MetricCard title="Total Revenue" value="$0" change="+0%" changeType="neutral" />
          <MetricCard title="Net Revenue" value="$0" subtitle="after fees" changeType="neutral" />
          <MetricCard title="Platform Fees" value="$0" subtitle="total deducted" changeType="neutral" />
          <MetricCard title="Avg Contract" value="$0" subtitle="per project" changeType="neutral" />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <RevenueChart data={[] as RevenueDataPoint[]} />
          <PillarDistribution data={pillarData} />
          <PlatformRevenue data={[] as PlatformRevenueDataPoint[]} />
          <ProposalFunnel data={[] as FunnelStage[]} />
        </div>
      </PageContainer>
    </>
  )
}

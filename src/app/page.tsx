import { Header, PageContainer } from "@/components/layout"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { DailyTargets } from "@/components/dashboard/DailyTargets"
import { PipelineSnapshot } from "@/components/dashboard/PipelineSnapshot"
import { RevenueChart } from "@/components/dashboard/RevenueChart"
import { PillarDistribution } from "@/components/dashboard/PillarDistribution"
import { WeeklyTrend } from "@/components/dashboard/WeeklyTrend"

export default function DashboardHome() {
  return (
    <>
      <Header
        title="Dashboard"
        description="Your acquisition engine at a glance"
      />
      <PageContainer>
        {/* Top Metrics Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Weekly Revenue"
            value="$0"
            change="+0%"
            changeType="neutral"
          />
          <MetricCard
            title="Active Pipeline"
            value="0"
            subtitle="opportunities"
            changeType="neutral"
          />
          <MetricCard
            title="Proposal Win Rate"
            value="0%"
            subtitle="all platforms"
            changeType="neutral"
          />
          <MetricCard
            title="Avg Effective Rate"
            value="$0/hr"
            subtitle="this month"
            changeType="neutral"
          />
        </div>

        {/* Revenue Chart + Daily Targets */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart data={[]} />
          </div>
          <DailyTargets
            proposalsSent={0}
            proposalTarget={10}
            gigsUpdated={0}
            gigTarget={3}
          />
        </div>

        {/* Pipeline Snapshot + Pillar Distribution */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PipelineSnapshot />
          </div>
          <PillarDistribution data={[]} />
        </div>

        {/* Weekly Trend */}
        <div className="mt-6">
          <WeeklyTrend currentWeek={[]} previousWeek={[]} />
        </div>
      </PageContainer>
    </>
  )
}

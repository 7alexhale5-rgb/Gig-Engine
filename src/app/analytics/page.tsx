import { Header } from "@/components/layout"
import { PageContainer } from "@/components/layout"
import { BarChart3, TrendingUp, Target, Lightbulb } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <>
      <Header
        title="Analytics & Optimizer"
        description="Deep performance analytics and optimization recommendations"
      />
      <PageContainer>
        {/* Top Metrics */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-pillar-automation" />
              <span className="text-xs font-medium text-muted-foreground">Total Revenue (90d)</span>
            </div>
            <p className="mt-1 text-2xl font-bold">$0</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-pillar-ai" />
              <span className="text-xs font-medium text-muted-foreground">Best Platform</span>
            </div>
            <p className="mt-1 text-2xl font-bold">--</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-pillar-architecture" />
              <span className="text-xs font-medium text-muted-foreground">Top Gig (by revenue)</span>
            </div>
            <p className="mt-1 text-2xl font-bold">--</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-pillar-webdev" />
              <span className="text-xs font-medium text-muted-foreground">Recommendations</span>
            </div>
            <p className="mt-1 text-2xl font-bold">0</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Proposal Win Rate by Platform</h3>
            <div className="mt-4 flex h-48 items-center justify-center text-sm text-muted-foreground">
              Chart — connect Supabase
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Effective Hourly Rate Trend</h3>
            <div className="mt-4 flex h-48 items-center justify-center text-sm text-muted-foreground">
              Chart — connect Supabase
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Platform Comparison</h3>
            <div className="mt-4 flex h-48 items-center justify-center text-sm text-muted-foreground">
              Chart — connect Supabase
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Gig Performance A/B Log</h3>
            <div className="mt-4 flex h-48 items-center justify-center text-sm text-muted-foreground">
              A/B testing log — Phase 4
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-pillar-webdev" />
            <h2 className="text-base font-semibold">Optimization Recommendations</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Recommendations engine activates after 2+ weeks of data. Track daily metrics to unlock insights.
          </p>
        </div>
      </PageContainer>
    </>
  )
}

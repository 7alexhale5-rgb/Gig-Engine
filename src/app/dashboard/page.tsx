import { Header } from "@/components/layout"
import { PageContainer } from "@/components/layout"

export default function RevenueDashboard() {
  return (
    <>
      <Header
        title="Revenue Dashboard"
        description="Revenue analytics across all platforms and pillars"
      />
      <PageContainer>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue by Platform */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Revenue by Platform</h3>
            <div className="mt-4 flex h-48 items-center justify-center text-muted-foreground">
              Chart placeholder — connect Supabase to populate
            </div>
          </div>

          {/* Revenue by Pillar */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Revenue by Service Pillar</h3>
            <div className="mt-4 flex h-48 items-center justify-center text-muted-foreground">
              Chart placeholder — connect Supabase to populate
            </div>
          </div>

          {/* Effective Hourly Rate */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Effective Hourly Rate</h3>
            <div className="mt-4 flex h-48 items-center justify-center text-muted-foreground">
              Chart placeholder — connect Supabase to populate
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Monthly Revenue Trend</h3>
            <div className="mt-4 flex h-48 items-center justify-center text-muted-foreground">
              Chart placeholder — connect Supabase to populate
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

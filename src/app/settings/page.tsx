import { Header } from "@/components/layout"
import { PageContainer } from "@/components/layout"

const platforms = [
  { name: "Upwork", status: "setup_needed" },
  { name: "Fiverr", status: "setup_needed" },
  { name: "Toptal", status: "application_pending" },
  { name: "Arc.dev", status: "setup_needed" },
  { name: "PeoplePerHour", status: "planned" },
  { name: "Guru", status: "planned" },
  { name: "LinkedIn Services", status: "planned" },
  { name: "Direct/Referral", status: "active" },
]

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    active: "bg-pillar-architecture/20 text-pillar-architecture",
    setup_needed: "bg-pillar-webdev/20 text-pillar-webdev",
    application_pending: "bg-pillar-ai/20 text-pillar-ai",
    planned: "bg-muted text-muted-foreground",
    paused: "bg-pillar-strategy/20 text-pillar-strategy",
  }
  const labels: Record<string, string> = {
    active: "Active",
    setup_needed: "Setup Needed",
    application_pending: "Application Pending",
    planned: "Planned",
    paused: "Paused",
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || styles.planned}`}>
      {labels[status] || status}
    </span>
  )
}

export default function SettingsPage() {
  return (
    <>
      <Header
        title="Settings"
        description="Platform profiles and application preferences"
      />
      <PageContainer>
        {/* Platform Profiles */}
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold">Platform Profiles</h2>
            <p className="text-sm text-muted-foreground">
              Manage your profiles across all gig platforms
            </p>
          </div>
          <div className="divide-y divide-border">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="text-sm font-medium">{platform.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(platform.status)}
                  <button className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold">Preferences</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Application settings and daily targets
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Daily Proposal Target</label>
              <input
                type="number"
                defaultValue={10}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Daily Gig Update Target</label>
              <input
                type="number"
                defaultValue={3}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

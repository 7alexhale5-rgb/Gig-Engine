import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header, PageContainer } from "@/components/layout"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("display_name, slug, tagline, email_verified, onboarding_complete")
    .eq("user_id", user.id)
    .single()

  const displayName = tenant?.display_name ?? user.email ?? "there"

  return (
    <>
      <Header
        title="Dashboard"
        description={`Welcome back, ${displayName}`}
      />
      <PageContainer>
        <div className="space-y-6">
          {/* Tenant info card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground">Your Catalog</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Phase 2 will build the full catalog management UI here.
            </p>

            {tenant && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Display name:</span>
                  <span className="font-medium text-foreground">{tenant.display_name}</span>
                </div>
                {tenant.tagline && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Tagline:</span>
                    <span className="font-medium text-foreground">{tenant.tagline}</span>
                  </div>
                )}
                {tenant.slug && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Public URL:</span>
                    <span className="font-mono text-sm text-primary">/{tenant.slug}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Email verified:</span>
                  <span
                    className={
                      tenant.email_verified
                        ? "font-medium text-green-400"
                        : "font-medium text-amber-400"
                    }
                  >
                    {tenant.email_verified ? "Yes — catalog is live" : "No — verify to go live"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </>
  )
}

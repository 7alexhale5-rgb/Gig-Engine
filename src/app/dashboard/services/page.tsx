import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header, PageContainer } from "@/components/layout"
import { ServiceList } from "@/components/gigs/ServiceList"

export default async function ServicesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user's services with pillar data
  const { data: services } = await supabase
    .from("gig_listings")
    .select("*, service_pillars(id, name, color, sort_order)")
    .eq("user_id", user.id)
    .neq("status", "archived")
    .order("created_at", { ascending: false })

  // Fetch user's pillars (for potential future use in the list header)
  const { data: pillars } = await supabase
    .from("service_pillars")
    .select("id, name, color, sort_order")
    .eq("user_id", user.id)
    .order("sort_order")

  // Fetch tenant data for onboarding checklist
  const { data: tenant } = await supabase
    .from("tenants")
    .select("display_name, bio, email_verified, slug")
    .eq("user_id", user.id)
    .single()

  return (
    <>
      <Header
        title="Services"
        description="Manage your service listings"
      />
      <PageContainer>
        <ServiceList
          services={services ?? []}
          pillars={pillars ?? []}
          tenant={{
            display_name: tenant?.display_name ?? null,
            bio: tenant?.bio ?? null,
            email_verified: tenant?.email_verified ?? null,
            slug: tenant?.slug ?? null,
          }}
        />
      </PageContainer>
    </>
  )
}

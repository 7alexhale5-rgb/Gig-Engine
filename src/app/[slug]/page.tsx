import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"
import { CatalogHeader, ServicePillarSection } from "@/components/catalog"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

function getAnonClient() {
  const url = SUPABASE_URL || "https://placeholder.supabase.co"
  const key =
    SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTgwMDAwMDAwMH0.cGxhY2Vob2xkZXItc2lnbmF0dXJlLWZvci1idWlsZA"
  return createClient(url, key)
}

interface PageProps {
  params: { slug: string }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServicePillarData {
  id: string
  name: string
  color: string
  sort_order: number
}

interface ServiceRow {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  pricing_basic: number | null
  pricing_standard: number | null
  pricing_premium: number | null
  delivery_days_basic: number | null
  delivery_days_standard: number | null
  delivery_days_premium: number | null
  contact_for_pricing: boolean
  service_pillars: ServicePillarData | null
}

interface PillarGroup {
  pillar: ServicePillarData
  services: Omit<ServiceRow, "service_pillars">[]
}

// ---------------------------------------------------------------------------
// groupByPillar — groups services by pillar and sorts by sort_order
// ---------------------------------------------------------------------------

function groupByPillar(services: ServiceRow[]): PillarGroup[] {
  const map = new Map<string, PillarGroup>()

  for (const service of services) {
    const pillar = service.service_pillars
    if (!pillar) continue

    if (!map.has(pillar.id)) {
      map.set(pillar.id, { pillar, services: [] })
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { service_pillars: _sp, ...serviceData } = service
    map.get(pillar.id)!.services.push(serviceData)
  }

  // Sort groups by pillar sort_order ascending
  return Array.from(map.values()).sort(
    (a, b) => a.pillar.sort_order - b.pillar.sort_order
  )
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = getAnonClient()

  const { data: tenant } = await supabase
    .from("tenants")
    .select("display_name, tagline")
    .eq("slug", params.slug)
    .single()

  if (!tenant) {
    return { title: "Catalog Not Found" }
  }

  return {
    title: `${tenant.display_name}'s Services`,
    description:
      tenant.tagline ??
      `Browse services offered by ${tenant.display_name} on PrettyFly.`,
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PublicCatalogPage({ params }: PageProps) {
  const supabase = getAnonClient()

  const { data: tenant } = await supabase
    .from("tenants")
    .select("user_id, display_name, slug, tagline, bio, avatar_url, email_verified, onboarding_complete")
    .eq("slug", params.slug)
    .single()

  // Unknown slug — 404
  if (!tenant) {
    notFound()
  }

  // Tenant found but email not verified — friendly holding state
  if (!tenant.email_verified) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="text-4xl">&#128640;</div>
          <h1 className="text-2xl font-bold text-foreground">
            {tenant.display_name}
          </h1>
          <p className="text-muted-foreground">
            This catalog is being set up. Check back soon!
          </p>
          <p className="text-sm text-muted-foreground/60">
            The page is reserved and will be live once the owner verifies their email.
          </p>
        </div>
      </div>
    )
  }

  // Fetch active services for this tenant only
  const { data: services } = await supabase
    .from("gig_listings")
    .select("*, service_pillars(id, name, color, sort_order)")
    .eq("user_id", tenant.user_id)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const pillarGroups = groupByPillar((services ?? []) as ServiceRow[])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile header */}
        <CatalogHeader tenant={tenant} />

        {/* Services */}
        {pillarGroups.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="text-muted-foreground">
              {tenant.display_name} hasn&apos;t added any services yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-12">
            {pillarGroups.map(({ pillar, services: pillarServices }) => (
              <ServicePillarSection
                key={pillar.id}
                pillar={pillar}
                services={pillarServices}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

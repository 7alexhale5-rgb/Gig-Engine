import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = getAnonClient()

  const { data: tenant } = await supabase
    .from("tenants")
    .select("display_name")
    .eq("slug", params.slug)
    .single()

  if (!tenant) {
    return { title: "Catalog Not Found" }
  }

  return {
    title: `${tenant.display_name}'s Services`,
    description: `Browse services offered by ${tenant.display_name} on PrettyFly.`,
  }
}

export default async function PublicCatalogPage({ params }: PageProps) {
  const supabase = getAnonClient()

  const { data: tenant } = await supabase
    .from("tenants")
    .select("display_name, slug, tagline, avatar_url, email_verified, onboarding_complete")
    .eq("slug", params.slug)
    .single()

  // Unknown slug — 404
  if (!tenant) {
    notFound()
  }

  // Tenant found but email not verified — holding state
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

  // Tenant verified — placeholder catalog
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-lg space-y-6 text-center">
        {/* Avatar */}
        {tenant.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tenant.avatar_url}
            alt={tenant.display_name}
            className="mx-auto h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
            {tenant.display_name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Name + tagline */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{tenant.display_name}</h1>
          {tenant.tagline && (
            <p className="text-lg text-muted-foreground">{tenant.tagline}</p>
          )}
        </div>

        {/* Coming soon */}
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm font-medium text-foreground">Services Coming Soon</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Full service catalog and booking will be available here in the next update.
          </p>
        </div>

        {/* URL hint */}
        <p className="text-xs text-muted-foreground/50">
          prettyfly.app/{tenant.slug}
        </p>
      </div>
    </div>
  )
}

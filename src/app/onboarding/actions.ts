"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Check if a slug is available by querying the public-readable tenants.
 *
 * Uses a plain anon Supabase client (no auth session / cookies) to leverage the
 * public RLS policy: "Public can read tenant by slug" — shows tenants where
 * slug IS NOT NULL AND onboarding_complete = true.
 *
 * Covers the primary case (competing with completed user slugs).
 * Two users simultaneously in onboarding is caught by the DB UNIQUE constraint
 * in completeOnboarding, which returns error slug_taken.
 */
export async function checkSlugAvailability(
  slug: string
): Promise<{ available: boolean }> {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTgwMDAwMDAwMH0.cGxhY2Vob2xkZXItc2lnbmF0dXJlLWZvci1idWlsZA"

  // Plain anon client (no session cookies) — queries as anon role
  const anonClient = createSupabaseClient(url, anonKey)

  const { data } = await anonClient
    .from("tenants")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle()

  return { available: data === null }
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // TypeScript narrowing: user is non-null after the redirect above
  const authenticatedUser = user!

  const display_name = String(formData.get("display_name") ?? "").trim()
  const slug = String(formData.get("slug") ?? "").trim()
  const tagline = String(formData.get("tagline") ?? "").trim()
  const avatar_url = String(formData.get("avatar_url") ?? "").trim()

  if (!display_name || !slug) {
    redirect(
      `/onboarding?error=${encodeURIComponent("Display name and slug are required")}`
    )
  }

  const { error: tenantError } = await supabase
    .from("tenants")
    .update({
      display_name,
      slug,
      tagline,
      avatar_url,
      onboarding_complete: true,
    })
    .eq("user_id", authenticatedUser.id)

  if (tenantError) {
    if (tenantError.code === "23505") {
      // Unique constraint violation on slug
      redirect("/onboarding?error=slug_taken")
    }
    redirect(
      `/onboarding?error=${encodeURIComponent(tenantError.message)}`
    )
  }

  // Update JWT metadata so middleware sees onboarding_complete without a DB query
  await supabase.auth.updateUser({
    data: { onboarding_complete: true },
  })

  // CRITICAL: Force-refresh the JWT so the new metadata is in the token immediately.
  // Without this, middleware still sees onboarding_complete: false from the stale token
  // and redirects back to /onboarding (Pitfall 4 from research).
  await supabase.auth.refreshSession()

  redirect("/dashboard")
}

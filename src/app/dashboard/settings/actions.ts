"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const settingsSchema = z.object({
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be 50 characters or less")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only"
    ),
})

export async function updateSettings(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const raw = {
    slug: (formData.get("slug") as string ?? "").trim().toLowerCase(),
  }

  const result = settingsSchema.safeParse(raw)

  if (!result.success) {
    const errorMessage = result.error.issues[0]?.message ?? "Invalid slug"
    redirect(`/dashboard/settings?error=${encodeURIComponent(errorMessage)}`)
  }

  const { slug } = result.data

  // Check slug availability using anon client (matches onboarding pattern).
  // Also exclude own current slug by checking if another tenant already has it.
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTgwMDAwMDAwMH0.cGxhY2Vob2xkZXItc2lnbmF0dXJlLWZvci1idWlsZA"

  const anonClient = createSupabaseClient(url, anonKey)

  const { data: existingTenant } = await anonClient
    .from("tenants")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle()

  // If found by anon client, it belongs to a completed tenant (could be self or another user)
  // Use auth client to check if it's our own slug — if so, still allow the update
  if (existingTenant) {
    const { data: ownTenant } = await supabase
      .from("tenants")
      .select("slug")
      .eq("user_id", user.id)
      .eq("slug", slug)
      .maybeSingle()

    if (!ownTenant) {
      // The slug is taken by someone else
      redirect(
        `/dashboard/settings?error=${encodeURIComponent("This slug is already in use. Please choose a different one.")}`
      )
    }
  }

  const { error } = await supabase
    .from("tenants")
    .update({ slug })
    .eq("user_id", user.id)

  if (error) {
    if (error.code === "23505") {
      redirect(
        `/dashboard/settings?error=${encodeURIComponent("This slug is already in use. Please choose a different one.")}`
      )
    }
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard")
  revalidatePath(`/${slug}`)

  redirect("/dashboard/settings?saved=true")
}

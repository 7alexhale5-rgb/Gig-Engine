"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { gigSchema } from "@/lib/schemas/gig"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a FormData boolean field (checkbox sends "on" or is absent). */
function parseBoolean(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true"
}

// ---------------------------------------------------------------------------
// createService
// ---------------------------------------------------------------------------

export async function createService(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Parse the raw FormData into a plain object for zod
  const raw = Object.fromEntries(formData)

  // contact_for_pricing comes in as "on" from a checkbox — normalize to boolean
  const contactForPricing = parseBoolean(formData.get("contact_for_pricing"))

  const parsed = gigSchema.safeParse({
    ...raw,
    contact_for_pricing: contactForPricing,
    // Zod coerces these via optionalPositiveNumber / optionalPositiveInt;
    // empty strings from form inputs will coerce to undefined
    pricing_basic: raw.pricing_basic || undefined,
    pricing_standard: raw.pricing_standard || undefined,
    pricing_premium: raw.pricing_premium || undefined,
    delivery_days_basic: raw.delivery_days_basic || undefined,
    delivery_days_standard: raw.delivery_days_standard || undefined,
    delivery_days_premium: raw.delivery_days_premium || undefined,
    tags: formData.getAll("tags").filter(Boolean),
  })

  if (!parsed.success) {
    redirect(`/dashboard/services/new?error=validation`)
  }

  const data = parsed.data

  // When contact_for_pricing is enabled, clear all pricing fields
  const pricingFields = data.contact_for_pricing
    ? {
        pricing_basic: null,
        pricing_standard: null,
        pricing_premium: null,
        delivery_days_basic: null,
        delivery_days_standard: null,
        delivery_days_premium: null,
      }
    : {
        pricing_basic: data.pricing_basic ?? null,
        pricing_standard: data.pricing_standard ?? null,
        pricing_premium: data.pricing_premium ?? null,
        delivery_days_basic: data.delivery_days_basic ?? null,
        delivery_days_standard: data.delivery_days_standard ?? null,
        delivery_days_premium: data.delivery_days_premium ?? null,
      }

  const { error } = await supabase.from("gig_listings").insert({
    user_id: user.id,
    platform_id: null,
    pillar_id: data.pillar_id,
    title: data.title,
    description: data.description ?? "",
    tags: data.tags,
    status: data.status,
    gig_url: data.gig_url ?? "",
    thumbnail_url: data.thumbnail_url ?? "",
    contact_for_pricing: data.contact_for_pricing,
    ...pricingFields,
  })

  if (error) {
    redirect(`/dashboard/services/new?error=db`)
  }

  revalidatePath("/dashboard/services")
  redirect("/dashboard/services")
}

// ---------------------------------------------------------------------------
// updateService
// ---------------------------------------------------------------------------

export async function updateService(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const raw = Object.fromEntries(formData)
  const contactForPricing = parseBoolean(formData.get("contact_for_pricing"))

  const parsed = gigSchema.safeParse({
    ...raw,
    contact_for_pricing: contactForPricing,
    pricing_basic: raw.pricing_basic || undefined,
    pricing_standard: raw.pricing_standard || undefined,
    pricing_premium: raw.pricing_premium || undefined,
    delivery_days_basic: raw.delivery_days_basic || undefined,
    delivery_days_standard: raw.delivery_days_standard || undefined,
    delivery_days_premium: raw.delivery_days_premium || undefined,
    tags: formData.getAll("tags").filter(Boolean),
  })

  if (!parsed.success) {
    redirect(`/dashboard/services/${id}/edit?error=validation`)
  }

  const data = parsed.data

  const pricingFields = data.contact_for_pricing
    ? {
        pricing_basic: null,
        pricing_standard: null,
        pricing_premium: null,
        delivery_days_basic: null,
        delivery_days_standard: null,
        delivery_days_premium: null,
      }
    : {
        pricing_basic: data.pricing_basic ?? null,
        pricing_standard: data.pricing_standard ?? null,
        pricing_premium: data.pricing_premium ?? null,
        delivery_days_basic: data.delivery_days_basic ?? null,
        delivery_days_standard: data.delivery_days_standard ?? null,
        delivery_days_premium: data.delivery_days_premium ?? null,
      }

  const { error } = await supabase
    .from("gig_listings")
    .update({
      pillar_id: data.pillar_id,
      title: data.title,
      description: data.description ?? "",
      tags: data.tags,
      status: data.status,
      gig_url: data.gig_url ?? "",
      thumbnail_url: data.thumbnail_url ?? "",
      contact_for_pricing: data.contact_for_pricing,
      ...pricingFields,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    redirect(`/dashboard/services/${id}/edit?error=db`)
  }

  revalidatePath("/dashboard/services")
  redirect("/dashboard/services")
}

// ---------------------------------------------------------------------------
// deleteService
// ---------------------------------------------------------------------------

export async function deleteService(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { error } = await supabase
    .from("gig_listings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    // Delete errors are non-fatal — revalidate and redirect anyway
    console.error("deleteService error:", error)
  }

  revalidatePath("/dashboard/services")
  redirect("/dashboard/services")
}

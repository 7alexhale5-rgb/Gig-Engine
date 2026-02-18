import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Generate a URL-safe slug from a display name.
 * Lowercases, trims, removes non-alphanumeric characters, max 30 chars.
 */
export function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "") // remove non-alphanumeric (including spaces)
    .slice(0, 30) // max length
}

/**
 * Find an available slug by checking the tenants table.
 * Appends incrementing numbers if the base slug is taken.
 * Max 20 attempts before throwing.
 */
export async function findAvailableSlug(
  baseSlug: string,
  supabase: SupabaseClient
): Promise<string> {
  let slug = baseSlug
  let attempt = 0

  while (attempt < 20) {
    const { data } = await supabase
      .from("tenants")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle()

    if (!data) return slug // slug is available

    attempt++
    slug = `${baseSlug}${attempt}`
  }

  throw new Error("Could not find available slug after 20 attempts")
}

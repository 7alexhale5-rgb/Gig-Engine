"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const profileSchema = z.object({
  display_name: z.string().min(1, "Display name is required").max(100, "Display name must be 100 characters or less"),
  tagline: z.string().max(200, "Tagline must be 200 characters or less").optional().default(""),
  bio: z.string().max(2000, "Bio must be 2000 characters or less").optional().default(""),
  avatar_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")).default(""),
})

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const raw = {
    display_name: (formData.get("display_name") as string ?? "").trim(),
    tagline: (formData.get("tagline") as string ?? "").trim(),
    bio: (formData.get("bio") as string ?? "").trim(),
    avatar_url: (formData.get("avatar_url") as string ?? "").trim(),
  }

  const result = profileSchema.safeParse(raw)

  if (!result.success) {
    const errorMessage = result.error.issues[0]?.message ?? "Invalid input"
    redirect(`/dashboard/profile?error=${encodeURIComponent(errorMessage)}`)
  }

  const { display_name, tagline, bio, avatar_url } = result.data

  const { error } = await supabase
    .from("tenants")
    .update({ display_name, tagline, bio, avatar_url })
    .eq("user_id", user.id)

  if (error) {
    redirect(`/dashboard/profile?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath("/dashboard/profile")
  revalidatePath("/dashboard")

  redirect("/dashboard/profile?saved=true")
}

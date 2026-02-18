"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get("email"))
  const password = String(formData.get("password"))

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { onboarding_complete: false },
    },
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  redirect("/onboarding")
}

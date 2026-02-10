import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

export async function createClient() {
  const cookieStore = await cookies()

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      "Supabase credentials missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    )
  }

  const url = SUPABASE_URL || "https://placeholder.supabase.co"
  const key =
    SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"

  // NOTE: Database generic omitted — see client.ts comment for rationale.
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method is called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

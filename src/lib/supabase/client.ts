import { createBrowserClient } from "@supabase/ssr"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

/**
 * Create a Supabase browser client.
 *
 * NOTE: The Database generic is omitted until the Supabase project is connected
 * and types are auto-generated via `npm run db:generate-types`. The hand-maintained
 * types in types.ts don't satisfy the Supabase internal GenericSchema constraints.
 * Once connected, add `<Database>` generic back here.
 */
export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      "Supabase credentials missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    )
    // Return a client that will fail gracefully — hooks already handle errors.
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"
    )
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

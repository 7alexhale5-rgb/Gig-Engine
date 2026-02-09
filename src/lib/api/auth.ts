import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

// ---------------------------------------------------------------------------
// Auth result types
// ---------------------------------------------------------------------------

interface AuthenticatedApiKey {
  authenticated: true
  source: "api_key"
  user?: undefined
}

interface AuthenticatedSession {
  authenticated: true
  source: "session"
  user: User
}

interface Unauthenticated {
  authenticated: false
  source: null
  user?: undefined
}

export type AuthResult =
  | AuthenticatedApiKey
  | AuthenticatedSession
  | Unauthenticated

// ---------------------------------------------------------------------------
// Authenticate a request via API key (webhooks) or Supabase session
// ---------------------------------------------------------------------------

/**
 * Checks authentication in two passes:
 * 1. If an `x-api-key` header is present and matches WEBHOOK_API_KEY, allow.
 * 2. Otherwise, check for a valid Supabase user session via cookies.
 *
 * Returns an AuthResult indicating success/failure and the auth source.
 */
export async function authenticateRequest(
  req: NextRequest,
): Promise<AuthResult> {
  // 1. Check API key for webhooks / external integrations
  const apiKey = req.headers.get("x-api-key")
  if (apiKey && apiKey === process.env.WEBHOOK_API_KEY) {
    return { authenticated: true, source: "api_key" as const }
  }

  // 2. Check Supabase session
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      return { authenticated: true, source: "session" as const, user }
    }
  } catch (err) {
    console.error("Auth check failed:", err)
  }

  return { authenticated: false, source: null }
}

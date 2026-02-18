import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Use getUser() not getSession() — getUser() validates with auth server
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtected = request.nextUrl.pathname.startsWith("/dashboard")
  const isOnboarding = request.nextUrl.pathname.startsWith("/onboarding")
  const isAuthRoute =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup"

  // Guard: redirect unauthenticated users away from protected routes
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("message", "Please log in to continue")
    return NextResponse.redirect(url)
  }

  // Intercept authenticated users who haven't completed onboarding
  // Only redirect from dashboard — don't intercept auth routes or onboarding itself
  if (user && !isOnboarding && !isAuthRoute && isProtected) {
    const onboardingComplete = user.user_metadata?.onboarding_complete
    if (!onboardingComplete) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  // Redirect already-authenticated users away from auth pages
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout"
import { LogoutButton } from "@/components/layout/LogoutButton"
import { VerificationBanner } from "@/components/layout/VerificationBanner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("user_id", user.id)
    .single()

  const isUnverified = tenant && !tenant.email_verified

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar with logout button in footer slot */}
      <Sidebar footer={<LogoutButton />} />

      {/* Main content area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {isUnverified && <VerificationBanner />}
        {children}
      </main>
    </div>
  )
}

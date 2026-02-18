import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header, PageContainer } from "@/components/layout"
import { SettingsForm } from "./SettingsForm"

interface SettingsPageProps {
  searchParams: Promise<{ saved?: string; error?: string }>
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("slug, display_name")
    .eq("user_id", user.id)
    .single()

  const params = await searchParams
  const saved = params.saved === "true"
  const errorMessage = params.error ? decodeURIComponent(params.error) : undefined

  return (
    <>
      <Header
        title="Settings"
        description="Account settings"
      />
      <PageContainer>
        <SettingsForm
          email={user.email ?? ""}
          currentSlug={tenant?.slug ?? ""}
          displayName={tenant?.display_name ?? null}
          saved={saved}
          errorMessage={errorMessage}
        />
      </PageContainer>
    </>
  )
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header, PageContainer } from "@/components/layout"
import { ProfileForm } from "./ProfileForm"

interface ProfilePageProps {
  searchParams: Promise<{ saved?: string; error?: string }>
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("display_name, tagline, bio, avatar_url, slug")
    .eq("user_id", user.id)
    .single()

  const params = await searchParams
  const saved = params.saved === "true"
  const errorMessage = params.error ? decodeURIComponent(params.error) : undefined

  return (
    <>
      <Header
        title="Profile"
        description="Manage your public identity"
      />
      <PageContainer>
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-border bg-card p-6">
            <ProfileForm
              initialData={{
                display_name: tenant?.display_name ?? null,
                tagline: tenant?.tagline ?? null,
                bio: tenant?.bio ?? null,
                avatar_url: tenant?.avatar_url ?? null,
                slug: tenant?.slug ?? null,
              }}
              saved={saved}
              errorMessage={errorMessage}
            />
          </div>
        </div>
      </PageContainer>
    </>
  )
}

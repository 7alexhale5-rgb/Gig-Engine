import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header, PageContainer } from "@/components/layout"
import { ServiceForm } from "@/components/gigs/ServiceForm"
import { createService } from "@/app/dashboard/services/actions"

interface NewServicePageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function NewServicePage({
  searchParams,
}: NewServicePageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: pillars } = await supabase
    .from("service_pillars")
    .select("id, name, color, sort_order")
    .eq("user_id", user.id)
    .order("sort_order")

  const params = await searchParams
  const hasError = Boolean(params.error)

  return (
    <>
      <Header
        title="New Service"
        description="Create a new service listing for your public catalog"
      />
      <PageContainer>
        {hasError && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {params.error === "validation"
              ? "Please check your form inputs and try again."
              : "Something went wrong saving your service. Please try again."}
          </div>
        )}
        <ServiceForm
          pillars={pillars ?? []}
          action={createService}
        />
      </PageContainer>
    </>
  )
}

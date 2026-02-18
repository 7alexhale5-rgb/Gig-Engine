import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header, PageContainer } from "@/components/layout"
import { ServiceForm } from "@/components/gigs/ServiceForm"
import { updateService } from "@/app/dashboard/services/actions"

interface EditServicePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function EditServicePage({
  params,
  searchParams,
}: EditServicePageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { id } = await params

  // Fetch the service, scoped to the authenticated user
  const { data: service } = await supabase
    .from("gig_listings")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!service) {
    redirect("/dashboard/services")
  }

  const { data: pillars } = await supabase
    .from("service_pillars")
    .select("id, name, color, sort_order")
    .eq("user_id", user.id)
    .order("sort_order")

  const resolvedParams = await searchParams
  const hasError = Boolean(resolvedParams.error)

  const boundAction = updateService.bind(null, id)

  return (
    <>
      <Header
        title="Edit Service"
        description="Update your service listing"
      />
      <PageContainer>
        {hasError && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {resolvedParams.error === "validation"
              ? "Please check your form inputs and try again."
              : "Something went wrong saving your service. Please try again."}
          </div>
        )}
        <ServiceForm
          initialData={service}
          pillars={pillars ?? []}
          action={boundAction}
          cancelHref="/dashboard/services"
        />
      </PageContainer>
    </>
  )
}

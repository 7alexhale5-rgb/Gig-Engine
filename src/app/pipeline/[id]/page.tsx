"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Header } from "@/components/layout"
import { PageContainer } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { OpportunityForm } from "@/components/pipeline"
import { useOpportunities } from "@/lib/hooks/useOpportunities"
import { STAGE_LABELS, STAGE_COLORS } from "@/lib/utils/constants"
import { cn } from "@/lib/utils"
import type { Opportunity } from "@/lib/supabase/types"
import type { OpportunityFormData } from "@/lib/schemas/opportunity"

interface OpportunityDetailProps {
  params: { id: string }
}

export default function OpportunityDetail({ params }: OpportunityDetailProps) {
  const router = useRouter()
  const { opportunities, loading, fetchOpportunities, updateOpportunity } =
    useOpportunities()

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)

  useEffect(() => {
    fetchOpportunities()
  }, [fetchOpportunities])

  useEffect(() => {
    if (opportunities.length > 0) {
      const found = opportunities.find((o) => o.id === params.id) ?? null
      setOpportunity(found)
    }
  }, [opportunities, params.id])

  const handleUpdate = useCallback(
    async (data: OpportunityFormData) => {
      if (!opportunity) return
      await updateOpportunity(opportunity.id, {
        platform_id: data.platform_id,
        job_title: data.job_title,
        job_url: data.job_url ?? "",
        job_description: data.job_description ?? "",
        stage: data.stage,
        pillar_id: data.pillar_id || null,
        gig_id: data.gig_id || null,
        client_name: data.client_name ?? "",
        client_company: data.client_company ?? "",
        client_location: data.client_location ?? "",
        budget_min: data.budget_min ?? null,
        budget_max: data.budget_max ?? null,
        contract_type: data.contract_type,
        proposal_text: data.proposal_text ?? "",
        proposal_template_id: data.proposal_template_id || null,
        contract_value: data.contract_value ?? null,
        estimated_hours: data.estimated_hours ?? null,
        actual_hours: data.actual_hours ?? null,
        delivery_deadline: data.delivery_deadline || null,
        notes: data.notes ?? "",
      })
      router.push("/pipeline")
    },
    [opportunity, updateOpportunity, router]
  )

  const handleCancel = useCallback(() => {
    router.push("/pipeline")
  }, [router])

  if (loading && !opportunity) {
    return (
      <>
        <Header title="Opportunity Detail" description="Loading..." />
        <PageContainer>
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        </PageContainer>
      </>
    )
  }

  if (!loading && opportunities.length > 0 && !opportunity) {
    return (
      <>
        <Header title="Not Found" description="Opportunity not found" />
        <PageContainer>
          <div className="mx-auto max-w-lg text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              The opportunity with ID{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">{params.id}</code>{" "}
              was not found.
            </p>
            <Button variant="outline" onClick={() => router.push("/pipeline")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pipeline
            </Button>
          </div>
        </PageContainer>
      </>
    )
  }

  return (
    <>
      <Header
        title="Edit Opportunity"
        description={opportunity?.job_title ?? ""}
      />
      <PageContainer>
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.push("/pipeline")}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Pipeline
            </Button>
            {opportunity && (
              <span className="inline-flex items-center gap-1.5 text-sm">
                <span className={cn("h-2 w-2 rounded-full", STAGE_COLORS[opportunity.stage])} />
                <span className="font-medium">{STAGE_LABELS[opportunity.stage]}</span>
              </span>
            )}
          </div>
          {opportunity && (
            <div className="rounded-lg border border-border bg-card p-6">
              <OpportunityForm
                initialData={opportunity}
                onSubmit={handleUpdate}
                onCancel={handleCancel}
                submitLabel="Update Opportunity"
              />
            </div>
          )}
        </div>
      </PageContainer>
    </>
  )
}

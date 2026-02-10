"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, LayoutGrid, Table as TableIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Header } from "@/components/layout"
import { PageContainer } from "@/components/layout"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useOpportunities } from "@/lib/hooks/useOpportunities"
import {
  KanbanBoard,
  PipelineTable,
  PipelineFilters,
  OpportunityForm,
  filtersFromSearchParams,
  hasActiveFilters,
} from "@/components/pipeline"
import type { PipelineFilterValues } from "@/components/pipeline"
import type { OpportunityFormData } from "@/lib/schemas/opportunity"
import type { OpportunityStage, OpportunityWithRelations } from "@/lib/supabase/types"

type ViewMode = "kanban" | "table"

function PipelineContent() {
  const searchParams = useSearchParams()

  const [viewMode, setViewMode] = useState<ViewMode>("kanban")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [filters, setFilters] = useState<PipelineFilterValues>(() =>
    filtersFromSearchParams(searchParams)
  )

  const {
    opportunities,
    loading,
    fetchOpportunities,
    createOpportunity,
    updateStage,
  } = useOpportunities()

  useEffect(() => {
    fetchOpportunities()
  }, [fetchOpportunities])

  const filtered = useMemo(() => {
    const all = opportunities as unknown as OpportunityWithRelations[]

    if (!hasActiveFilters(filters)) return all

    return all.filter((opp) => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const matchTitle = opp.job_title.toLowerCase().includes(q)
        const matchClient = opp.client_name?.toLowerCase().includes(q)
        const matchCompany = opp.client_company?.toLowerCase().includes(q)
        if (!matchTitle && !matchClient && !matchCompany) return false
      }

      if (filters.platform) {
        const platformName = opp.platforms?.name ?? ""
        if (platformName !== filters.platform && opp.platform_id !== filters.platform) {
          return false
        }
      }

      if (filters.pillar) {
        const pillarName = opp.service_pillars?.name ?? ""
        if (pillarName !== filters.pillar && opp.pillar_id !== filters.pillar) {
          return false
        }
      }

      if (filters.stage && opp.stage !== filters.stage) {
        return false
      }

      if (filters.contractType && opp.contract_type !== filters.contractType) {
        return false
      }

      return true
    })
  }, [opportunities, filters])

  const handleStageChange = useCallback(
    async (id: string, newStage: OpportunityStage) => {
      await updateStage(id, newStage)
    },
    [updateStage]
  )

  const handleCreate = useCallback(
    async (data: OpportunityFormData) => {
      await createOpportunity({
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
      setShowCreateDialog(false)
    },
    [createOpportunity]
  )

  const totalCount = filtered.length
  const activeCount = filtered.filter(
    (o) => o.stage !== "complete" && o.stage !== "lost"
  ).length

  return (
    <PageContainer>
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "kanban"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "table"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TableIcon className="h-4 w-4" />
              Table
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {activeCount} active / {totalCount} total
            </span>
            <Button
              size="sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Opportunity
            </Button>
          </div>
        </div>

        <PipelineFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {viewMode === "kanban" && (
        <KanbanBoard
          opportunities={filtered}
          loading={loading}
          onStageChange={handleStageChange}
          onAddClick={() => setShowCreateDialog(true)}
        />
      )}

      {viewMode === "table" && <PipelineTable opportunities={filtered} />}

      <Dialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Opportunity</DialogTitle>
            <DialogDescription>
              Add a new opportunity to your pipeline. Fill in as much as
              you know now -- you can always update it later.
            </DialogDescription>
          </DialogHeader>
          <OpportunityForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
            submitLabel="Create Opportunity"
          />
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}

function PipelineLoading() {
  return (
    <PageContainer>
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading pipeline...
        </span>
      </div>
    </PageContainer>
  )
}

export default function PipelinePage() {
  return (
    <>
      <Header
        title="Pipeline"
        description="Track opportunities across all platforms"
      />
      <Suspense fallback={<PipelineLoading />}>
        <PipelineContent />
      </Suspense>
    </>
  )
}

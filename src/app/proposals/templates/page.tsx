"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, useCallback } from "react"
import { Header, PageContainer } from "@/components/layout"
import { TemplateCard, TemplateForm } from "@/components/proposals"
import { EmptyState } from "@/components/shared"
import { useProposals } from "@/lib/hooks/useProposals"
import { Plus, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { TemplateFormData } from "@/components/proposals/TemplateForm"

export default function ProposalTemplatesPage() {
  const [showForm, setShowForm] = useState(false)
  const { templates, loading, fetchTemplates, createTemplate } = useProposals()

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleCreate = useCallback(
    async (data: TemplateFormData) => {
      await createTemplate({
        name: data.name,
        pillar_id: data.pillarName ?? null,
        platform_id: data.platformName ?? null,
        template_text: data.templateText,
        variables: data.variables,
        tags: data.tags,
      })
      setShowForm(false)
    },
    [createTemplate]
  )

  return (
    <>
      <Header
        title="Proposal Templates"
        description="Manage and optimize your proposal template library"
      />
      <PageContainer>
        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Template
          </Button>
        </div>

        {!loading && templates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No templates yet"
            description="Create your first proposal template to speed up your workflow."
            action={{ label: "Create Template", onClick: () => setShowForm(true) }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={{
                  id: template.id,
                  name: template.name,
                  pillarName: template.pillar_id ?? null,
                  platformName: template.platform_id ?? null,
                  templateText: template.template_text ?? "",
                  timesUsed: template.times_used ?? 0,
                  timesWon: template.times_won ?? 0,
                  winRate: template.times_used ? ((template.times_won ?? 0) / template.times_used) * 100 : 0,
                  variables: template.variables ?? [],
                  tags: template.tags ?? [],
                }}
              />
            ))}
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Proposal Template</DialogTitle>
            </DialogHeader>
            <TemplateForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              platforms={[]}
            />
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  )
}

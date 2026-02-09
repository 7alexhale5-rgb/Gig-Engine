import { Header } from "@/components/layout"
import { PageContainer } from "@/components/layout"

export default function ProposalTemplatesPage() {
  return (
    <>
      <Header
        title="Proposal Templates"
        description="Manage and optimize your proposal template library"
      />
      <PageContainer>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Template management will be implemented in Phase 3. 7 templates are seeded and ready.
          </p>
        </div>
      </PageContainer>
    </>
  )
}

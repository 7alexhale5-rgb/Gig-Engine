import { Header } from "@/components/layout"
import { PageContainer } from "@/components/layout"

interface OpportunityDetailProps {
  params: { id: string }
}

export default function OpportunityDetail({ params }: OpportunityDetailProps) {
  return (
    <>
      <Header
        title="Opportunity Detail"
        description="View and edit opportunity information"
      />
      <PageContainer>
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              Opportunity ID: {params.id}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Opportunity detail form will be implemented in Phase 2.
            </p>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

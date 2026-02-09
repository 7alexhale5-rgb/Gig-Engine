import { Header } from "@/components/layout"
import { PageContainer } from "@/components/layout"

interface GigDetailProps {
  params: { id: string }
}

export default function GigDetail({ params }: GigDetailProps) {
  return (
    <>
      <Header
        title="Gig Detail"
        description="Edit listing, manage versions, and track performance"
      />
      <PageContainer>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              Gig ID: {params.id}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Gig detail form with version history and pricing tier editor will be implemented in Phase 3.
            </p>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

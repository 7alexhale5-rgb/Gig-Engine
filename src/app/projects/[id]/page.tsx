import { Header } from "@/components/layout"
import { PageContainer } from "@/components/layout"

interface ProjectDetailProps {
  params: { id: string }
}

export default function ProjectDetail({ params }: ProjectDetailProps) {
  return (
    <>
      <Header
        title="Project Detail"
        description="Delivery checklist, time tracking, and client communication"
      />
      <PageContainer>
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              Project ID: {params.id}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Project detail with delivery checklist and time tracker will be implemented in Phase 4.
            </p>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

import { Header } from "@/components/layout"
import { PageContainer } from "@/components/layout"
import { Briefcase, Plus, FileText, Image } from "lucide-react"

export default function PortfolioPage() {
  return (
    <>
      <Header
        title="Portfolio & Content Library"
        description="Case studies, testimonials, and reusable content blocks"
      />
      <PageContainer>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Case Studies */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-pillar-architecture" />
                <h2 className="text-base font-semibold">Case Studies</h2>
              </div>
              <button className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Build case studies from completed projects. Structure: Problem, Solution, Result, Metrics.
            </p>
            <div className="mt-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              No case studies yet
            </div>
          </div>

          {/* Content Blocks */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-pillar-ai" />
                <h2 className="text-base font-semibold">Content Blocks</h2>
              </div>
              <button className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Reusable bios, credentials, process descriptions, and testimonials.
            </p>
            <div className="mt-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              No content blocks yet
            </div>
          </div>

          {/* Testimonials */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-pillar-webdev" />
              <h2 className="text-base font-semibold">Testimonials</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Reviews and testimonials collected from platform clients.
            </p>
            <div className="mt-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              No testimonials yet
            </div>
          </div>

          {/* Assets */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-pillar-strategy" />
              <h2 className="text-base font-semibold">Image Assets</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Screenshots, thumbnails, and portfolio images for platform listings.
            </p>
            <div className="mt-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              No assets yet
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

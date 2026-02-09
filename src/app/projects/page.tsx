import { Header } from "@/components/layout"
import { PageContainer } from "@/components/layout"
import { FolderKanban, Plus, Clock, CheckCircle2 } from "lucide-react"

export default function ProjectsPage() {
  return (
    <>
      <Header
        title="Active Projects"
        description="Track deliveries, milestones, and time"
      />
      <PageContainer>
        {/* Status Summary */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-pillar-automation" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <p className="mt-1 text-2xl font-bold">0</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-pillar-webdev" />
              <span className="text-sm font-medium">Due This Week</span>
            </div>
            <p className="mt-1 text-2xl font-bold">0</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-pillar-architecture" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <p className="mt-1 text-2xl font-bold">0</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-pillar-strategy" />
              <span className="text-sm font-medium">Hours Logged</span>
            </div>
            <p className="mt-1 text-2xl font-bold">0h</p>
          </div>
        </div>

        {/* Add Project */}
        <div className="mb-4 flex justify-end">
          <button className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        {/* Projects List */}
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <FolderKanban className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No active projects. Win an opportunity to create your first delivery.
          </p>
        </div>
      </PageContainer>
    </>
  )
}

"use client"

import { useState } from "react"
import { Header, PageContainer } from "@/components/layout"
import { ProjectCard } from "@/components/projects"
import { EmptyState } from "@/components/shared"
import { FolderKanban, Plus, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProjectForm } from "@/components/projects"
import type { Project } from "@/lib/supabase/types"

export default function ProjectsPage() {
  const [showForm, setShowForm] = useState(false)
  const projects: Project[] = [] // Will be fetched from Supabase

  const activeCount = projects.filter((p) => p.status === "active").length
  const completedCount = projects.filter((p) => p.status === "completed").length

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
            <p className="mt-1 text-2xl font-bold">{activeCount}</p>
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
            <p className="mt-1 text-2xl font-bold">{completedCount}</p>
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
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No active projects"
            description="Win an opportunity to create your first delivery."
            action={{ label: "Create Project", onClick: () => setShowForm(true) }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Project</DialogTitle>
            </DialogHeader>
            <ProjectForm
              onSubmit={async () => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  )
}

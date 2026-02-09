"use client"

import { Header } from "@/components/layout"
import { PageContainer } from "@/components/layout"
import { OPPORTUNITY_STAGES, STAGE_LABELS, STAGE_COLORS } from "@/lib/utils/constants"
import { cn } from "@/lib/utils"
import { Plus, LayoutGrid, Table as TableIcon } from "lucide-react"
import { useState } from "react"

type ViewMode = "kanban" | "table"

export default function PipelinePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban")

  return (
    <>
      <Header
        title="Pipeline"
        description="Track opportunities across all platforms"
      />
      <PageContainer>
        {/* Controls */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm",
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
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm",
                viewMode === "table"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TableIcon className="h-4 w-4" />
              Table
            </button>
          </div>

          <button className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add Opportunity
          </button>
        </div>

        {/* Kanban Board */}
        {viewMode === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {OPPORTUNITY_STAGES.filter((s) => s !== "lost").map((stage) => (
              <div
                key={stage}
                className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-card"
              >
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <div className={cn("h-2 w-2 rounded-full", STAGE_COLORS[stage])} />
                  <h3 className="text-sm font-medium">{STAGE_LABELS[stage]}</h3>
                  <span className="ml-auto text-xs text-muted-foreground">0</span>
                </div>
                <div className="flex-1 space-y-2 p-2">
                  <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                    No opportunities yet
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        {viewMode === "table" && (
          <div className="rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Platform</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Stage</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Deadline</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    No opportunities yet. Add your first one to get started.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </PageContainer>
    </>
  )
}

"use client"

import { useMemo } from "react"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { STAGE_LABELS, STAGE_COLORS } from "@/lib/utils/constants"
import type { OpportunityStage, OpportunityWithRelations } from "@/lib/supabase/types"
import { OpportunityCard } from "./OpportunityCard"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KanbanColumnProps {
  stage: OpportunityStage
  opportunities: OpportunityWithRelations[]
  onAddClick?: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KanbanColumn({
  stage,
  opportunities,
  onAddClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${stage}`,
    data: {
      type: "column",
      stage,
    },
  })

  const opportunityIds = useMemo(
    () => opportunities.map((o) => o.id),
    [opportunities]
  )

  const showAddButton = stage === "discovered"

  return (
    <div
      className={cn(
        "flex w-[280px] min-w-[280px] flex-col rounded-lg border border-border bg-card/50 transition-colors",
        isOver && "border-primary/50 bg-primary/5"
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <div
          className={cn(
            "h-2.5 w-2.5 rounded-full flex-shrink-0",
            STAGE_COLORS[stage]
          )}
        />
        <h3 className="truncate text-sm font-medium text-foreground">
          {STAGE_LABELS[stage]}
        </h3>
        <span
          className={cn(
            "ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
            opportunities.length > 0
              ? "bg-muted text-muted-foreground"
              : "text-muted-foreground/50"
          )}
        >
          {opportunities.length}
        </span>
      </div>

      {/* Card list — scrollable area */}
      <SortableContext
        items={opportunityIds}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex-1 space-y-2 overflow-y-auto p-2",
            "max-h-[calc(100vh-220px)] min-h-[120px]",
            // Show a subtle drop indicator when dragging over an empty column
            isOver && opportunities.length === 0 && "ring-1 ring-inset ring-primary/20 rounded-b-lg"
          )}
        >
          {opportunities.length === 0 && !isOver && (
            <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground/60">
              No opportunities
            </div>
          )}

          {opportunities.length === 0 && isOver && (
            <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 text-xs text-primary/60">
              Drop here
            </div>
          )}

          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add button — only on the "discovered" column */}
      {showAddButton && (
        <div className="border-t border-border p-2">
          <button
            onClick={onAddClick}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-md py-1.5",
              "text-xs font-medium text-muted-foreground",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Opportunity
          </button>
        </div>
      )}
    </div>
  )
}

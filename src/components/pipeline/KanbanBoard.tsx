"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { OPPORTUNITY_STAGES } from "@/lib/utils/constants"
import type {
  OpportunityStage,
  OpportunityWithRelations,
} from "@/lib/supabase/types"
import { KanbanColumn } from "./KanbanColumn"
import { OpportunityCard } from "./OpportunityCard"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KanbanBoardProps {
  opportunities: OpportunityWithRelations[]
  loading: boolean
  onStageChange: (id: string, newStage: OpportunityStage) => Promise<void>
  onAddClick: () => void
}

// ---------------------------------------------------------------------------
// Stages visible as Kanban columns (exclude "lost")
// ---------------------------------------------------------------------------

const KANBAN_STAGES = OPPORTUNITY_STAGES.filter(
  (s): s is Exclude<OpportunityStage, "lost"> => s !== "lost"
)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KanbanBoard({
  opportunities,
  loading,
  onStageChange,
  onAddClick,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  // Track which column a card is being dragged over so we can do
  // optimistic reordering in the UI before the drag ends.
  const [overStage, setOverStage] = useState<OpportunityStage | null>(null)

  // Store the original stage of the actively dragged item so we can
  // revert if the drop is cancelled.
  const originalStageRef = useRef<OpportunityStage | null>(null)

  // -----------------------------------------------------------------------
  // Sensors
  // -----------------------------------------------------------------------

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Require a small movement before activating drag to allow clicks
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // -----------------------------------------------------------------------
  // Group opportunities by stage
  // -----------------------------------------------------------------------

  const opportunitiesByStage = useMemo(() => {
    const grouped: Record<OpportunityStage, OpportunityWithRelations[]> = {
      discovered: [],
      proposal_sent: [],
      interview: [],
      contracted: [],
      in_progress: [],
      delivered: [],
      review_requested: [],
      complete: [],
      lost: [],
    }

    for (const opp of opportunities) {
      grouped[opp.stage].push(opp)
    }

    return grouped
  }, [opportunities])

  // -----------------------------------------------------------------------
  // Find the active opportunity for DragOverlay
  // -----------------------------------------------------------------------

  const activeOpportunity = useMemo(
    () => (activeId ? opportunities.find((o) => o.id === activeId) ?? null : null),
    [activeId, opportunities]
  )

  // -----------------------------------------------------------------------
  // Resolve which column (stage) a droppable ID belongs to
  // -----------------------------------------------------------------------

  const resolveStage = useCallback(
    (droppableId: string | null): OpportunityStage | null => {
      if (!droppableId) return null

      // Column droppable IDs are formatted as "column-<stage>"
      if (typeof droppableId === "string" && droppableId.startsWith("column-")) {
        return droppableId.replace("column-", "") as OpportunityStage
      }

      // Otherwise, it could be another card — find that card's stage
      const opp = opportunities.find((o) => o.id === droppableId)
      return opp?.stage ?? null
    },
    [opportunities]
  )

  // -----------------------------------------------------------------------
  // Drag handlers
  // -----------------------------------------------------------------------

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      setActiveId(active.id as string)

      // Remember the starting stage
      const opp = opportunities.find((o) => o.id === active.id)
      originalStageRef.current = opp?.stage ?? null
    },
    [opportunities]
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event
      if (!over) {
        setOverStage(null)
        return
      }
      const stage = resolveStage(over.id as string)
      setOverStage(stage)
    },
    [resolveStage]
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event

      setActiveId(null)
      setOverStage(null)
      originalStageRef.current = null

      if (!over) return

      const newStage = resolveStage(over.id as string)
      if (!newStage) return

      const draggedOpp = opportunities.find((o) => o.id === active.id)
      if (!draggedOpp) return

      // Skip if dropped in the same stage
      if (draggedOpp.stage === newStage) return

      // Don't allow dragging to the "lost" stage via Kanban
      if (newStage === "lost") return

      try {
        await onStageChange(draggedOpp.id, newStage)
      } catch {
        // The hook handles rollback via fetchOpportunities
      }
    },
    [opportunities, resolveStage, onStageChange]
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setOverStage(null)
    originalStageRef.current = null
  }, [])

  // -----------------------------------------------------------------------
  // Lost opportunities summary
  // -----------------------------------------------------------------------

  const lostCount = opportunitiesByStage.lost.length

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (loading && opportunities.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading pipeline...
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* Horizontally scrollable board */}
        <div className="flex gap-3 overflow-x-auto pb-4">
          {KANBAN_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              opportunities={opportunitiesByStage[stage]}
              onAddClick={stage === "discovered" ? onAddClick : undefined}
            />
          ))}
        </div>

        {/* Drag overlay: the "ghost" card that follows the cursor */}
        <DragOverlay dropAnimation={null}>
          {activeOpportunity ? (
            <div className="w-[256px]">
              <OpportunityCard
                opportunity={activeOpportunity}
                isOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Lost opportunities indicator */}
      {lostCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-red-400/30 bg-red-500/5 px-4 py-2.5">
          <div className="h-2 w-2 rounded-full bg-red-400" />
          <span className="text-sm text-muted-foreground">
            <span className="font-medium text-red-400">{lostCount}</span>{" "}
            lost{" "}
            {lostCount === 1 ? "opportunity" : "opportunities"}
          </span>
        </div>
      )}
    </div>
  )
}

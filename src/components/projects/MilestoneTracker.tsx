"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/formatters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  CheckCircle2,
  Circle,
  Plus,
  X,
  AlertTriangle,
} from "lucide-react"
import type { Milestone } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return crypto.randomUUID()
}

function isMilestoneOverdue(milestone: Milestone): boolean {
  if (milestone.completed || !milestone.due_date) return false
  return new Date(milestone.due_date) < new Date()
}

// ---------------------------------------------------------------------------
// Add Milestone Form (inline)
// ---------------------------------------------------------------------------

interface AddMilestoneFormProps {
  onAdd: (milestone: Milestone) => void
  onCancel: () => void
}

function AddMilestoneForm({ onAdd, onCancel }: AddMilestoneFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    const milestone: Milestone = {
      id: generateId(),
      title: trimmedTitle,
      description: description.trim() || undefined,
      due_date: dueDate || undefined,
      completed: false,
    }
    onAdd(milestone)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="milestone-title">Title</Label>
        <Input
          id="milestone-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Milestone title..."
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="milestone-description">Description (optional)</Label>
        <Textarea
          id="milestone-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description..."
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="milestone-due-date">Due Date (optional)</Label>
        <Input
          id="milestone-due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={!title.trim()}>
          <Plus className="mr-1 h-4 w-4" />
          Add Milestone
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Milestone Tracker Component
// ---------------------------------------------------------------------------

interface MilestoneTrackerProps {
  milestones: Milestone[]
  onUpdate: (milestones: Milestone[]) => void
  className?: string
}

export function MilestoneTracker({
  milestones,
  onUpdate,
  className,
}: MilestoneTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false)

  const totalMilestones = milestones.length
  const completedMilestones = milestones.filter((m) => m.completed).length
  const progressPercent =
    totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

  // Toggle milestone completion
  const toggleMilestone = useCallback(
    (id: string) => {
      const updated = milestones.map((m) => {
        if (m.id !== id) return m
        return {
          ...m,
          completed: !m.completed,
          completed_at: !m.completed ? new Date().toISOString() : undefined,
        }
      })
      onUpdate(updated)
    },
    [milestones, onUpdate]
  )

  // Remove a milestone
  const removeMilestone = useCallback(
    (id: string) => {
      onUpdate(milestones.filter((m) => m.id !== id))
    },
    [milestones, onUpdate]
  )

  // Add a milestone
  const addMilestone = useCallback(
    (milestone: Milestone) => {
      onUpdate([...milestones, milestone])
      setShowAddForm(false)
    },
    [milestones, onUpdate]
  )

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Milestones
        </span>
        <span className="text-sm text-muted-foreground">
          {completedMilestones}/{totalMilestones} complete
          {totalMilestones > 0 && ` (${Math.round(progressPercent)}%)`}
        </span>
      </div>

      {/* Vertical timeline */}
      {totalMilestones > 0 ? (
        <div className="relative ml-3">
          {/* Vertical line */}
          <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />

          <ul className="space-y-0">
            {milestones.map((milestone) => {
              const overdue = isMilestoneOverdue(milestone)
              return (
                <li key={milestone.id} className="group relative flex gap-3 pb-6 last:pb-0">
                  {/* Timeline node */}
                  <button
                    type="button"
                    onClick={() => toggleMilestone(milestone.id)}
                    className="relative z-10 mt-0.5 shrink-0"
                    aria-label={
                      milestone.completed
                        ? `Mark "${milestone.title}" as incomplete`
                        : `Mark "${milestone.title}" as complete`
                    }
                  >
                    {milestone.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : overdue ? (
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Milestone content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            milestone.completed
                              ? "text-muted-foreground line-through"
                              : overdue
                                ? "text-red-400"
                                : "text-foreground"
                          )}
                        >
                          {milestone.title}
                        </p>
                        {milestone.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {milestone.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          {milestone.due_date && (
                            <span
                              className={cn(
                                "text-xs",
                                overdue
                                  ? "font-medium text-red-400"
                                  : "text-muted-foreground"
                              )}
                            >
                              Due: {formatDate(milestone.due_date)}
                            </span>
                          )}
                          {milestone.completed_at && (
                            <span className="text-xs text-green-500">
                              Completed: {formatDate(milestone.completed_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => removeMilestone(milestone.id)}
                        className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                        aria-label={`Delete milestone "${milestone.title}"`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No milestones yet. Add your first milestone to track project progress.
        </p>
      )}

      {/* Add milestone */}
      {showAddForm ? (
        <AddMilestoneForm
          onAdd={addMilestone}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Milestone
        </Button>
      )}
    </div>
  )
}

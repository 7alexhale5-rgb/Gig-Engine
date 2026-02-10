"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { formatDate, formatHours } from "@/lib/utils/formatters"
import { StatusBadge } from "@/components/shared"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Milestone as MilestoneIcon,
  AlertTriangle,
} from "lucide-react"
import type {
  Project,
  ProjectStatus,
  Milestone,
  ChecklistItem,
  TimeEntry,
} from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Status indicator colors
// ---------------------------------------------------------------------------

const STATUS_INDICATOR_COLORS: Record<ProjectStatus, string> = {
  active: "bg-green-500",
  paused: "bg-amber-500",
  completed: "bg-blue-500",
  cancelled: "bg-red-500",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseMilestones(raw: Record<string, unknown>[]): Milestone[] {
  return raw as unknown as Milestone[]
}

function parseChecklist(raw: Record<string, unknown>[]): ChecklistItem[] {
  return raw as unknown as ChecklistItem[]
}

function parseTimeEntries(raw: Record<string, unknown>[]): TimeEntry[] {
  return raw as unknown as TimeEntry[]
}

function getDeliveryUrgency(
  targetDate: string | null,
  status: ProjectStatus
): "overdue" | "urgent" | "normal" | null {
  if (!targetDate || status === "completed" || status === "cancelled") {
    return null
  }
  const now = new Date()
  const target = new Date(targetDate)
  const diffMs = target.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays < 0) return "overdue"
  if (diffDays <= 3) return "urgent"
  return "normal"
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProjectCardProps {
  project: Project
  className?: string
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const router = useRouter()

  const milestones = parseMilestones(project.milestones_json)
  const checklist = parseChecklist(project.checklist_json)
  const timeEntries = parseTimeEntries(project.time_entries_json)

  // Checklist progress
  const totalItems = checklist.length
  const completedItems = checklist.filter((item) => item.completed).length
  const checklistPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  // Milestone progress
  const totalMilestones = milestones.length
  const completedMilestones = milestones.filter((m) => m.completed).length

  // Total hours logged
  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0)

  // Delivery urgency
  const urgency = getDeliveryUrgency(project.target_delivery_date, project.status)

  return (
    <button
      type="button"
      onClick={() => router.push(`/projects/${project.id}`)}
      className={cn(
        "group relative w-full rounded-lg border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-card/80",
        className
      )}
    >
      {/* Status color indicator */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1 rounded-l-lg",
          STATUS_INDICATOR_COLORS[project.status]
        )}
      />

      {/* Header: title + status badge */}
      <div className="flex items-start justify-between gap-3 pl-3">
        <h3 className="text-sm font-semibold leading-tight text-foreground group-hover:text-primary">
          {project.title}
        </h3>
        <StatusBadge status={project.status} className="shrink-0" />
      </div>

      {/* Checklist progress bar */}
      {totalItems > 0 && (
        <div className="mt-3 pl-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {completedItems}/{totalItems} tasks
            </span>
            <span>{Math.round(checklistPercent)}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                checklistPercent === 100
                  ? "bg-green-500"
                  : checklistPercent > 50
                    ? "bg-blue-500"
                    : "bg-amber-500"
              )}
              style={{ width: `${checklistPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-3 text-xs text-muted-foreground">
        {/* Milestone progress */}
        {totalMilestones > 0 && (
          <span className="flex items-center gap-1">
            <MilestoneIcon className="h-3 w-3" />
            {completedMilestones}/{totalMilestones} milestones
          </span>
        )}

        {/* Hours logged */}
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatHours(totalHours)}
        </span>

        {/* Delivery date */}
        {project.target_delivery_date && (
          <span
            className={cn(
              "flex items-center gap-1",
              urgency === "overdue" && "font-medium text-red-400",
              urgency === "urgent" && "font-medium text-amber-400"
            )}
          >
            {urgency === "overdue" && <AlertTriangle className="h-3 w-3" />}
            {urgency === "urgent" && <AlertTriangle className="h-3 w-3" />}
            {urgency === "normal" && <Calendar className="h-3 w-3" />}
            {urgency === null && <Calendar className="h-3 w-3" />}
            {urgency === "overdue"
              ? `Overdue (${formatDate(project.target_delivery_date)})`
              : formatDate(project.target_delivery_date)}
          </span>
        )}
      </div>
    </button>
  )
}

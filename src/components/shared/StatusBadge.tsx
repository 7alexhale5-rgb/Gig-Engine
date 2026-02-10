import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  // Gig statuses
  draft: "bg-zinc-500/15 text-zinc-400",
  active: "bg-green-500/15 text-green-400",
  paused: "bg-yellow-500/15 text-yellow-400",
  archived: "bg-zinc-600/15 text-zinc-500",
  // Project statuses
  completed: "bg-blue-500/15 text-blue-400",
  cancelled: "bg-red-500/15 text-red-400",
  // Platform statuses
  setup_needed: "bg-yellow-500/15 text-yellow-400",
  application_pending: "bg-purple-500/15 text-purple-400",
  planned: "bg-zinc-500/15 text-zinc-400",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  archived: "Archived",
  completed: "Completed",
  cancelled: "Cancelled",
  setup_needed: "Setup Needed",
  application_pending: "Pending",
  planned: "Planned",
  in_progress: "In Progress",
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {STATUS_LABELS[status] || status}
    </span>
  )
}

"use client"

import { useMemo } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useRouter } from "next/navigation"
import {
  Clock,
  DollarSign,
  GripVertical,
  AlertTriangle,
  CalendarClock,
  Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, formatRelativeDate } from "@/lib/utils/formatters"
import { PILLAR_COLORS } from "@/lib/utils/constants"
import type { OpportunityWithRelations } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OpportunityCardProps {
  opportunity: OpportunityWithRelations
  /** When true the card renders in a non-interactive "overlay" style for DragOverlay. */
  isOverlay?: boolean
}

// ---------------------------------------------------------------------------
// Deadline helpers
// ---------------------------------------------------------------------------

type DeadlineUrgency = "overdue" | "urgent" | "normal" | "none"

function getDeadlineUrgency(deadline: string | null): DeadlineUrgency {
  if (!deadline) return "none"
  const now = new Date()
  const dl = new Date(deadline)
  const diffMs = dl.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays < 0) return "overdue"
  if (diffDays <= 3) return "urgent"
  return "normal"
}

const URGENCY_STYLES: Record<DeadlineUrgency, string> = {
  overdue: "text-red-400",
  urgent: "text-amber-400",
  normal: "text-muted-foreground",
  none: "",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OpportunityCard({
  opportunity,
  isOverlay = false,
}: OpportunityCardProps) {
  const router = useRouter()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: opportunity.id,
    data: {
      type: "opportunity",
      opportunity,
    },
  })

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition]
  )

  const deadlineUrgency = getDeadlineUrgency(opportunity.delivery_deadline)

  const platformName = opportunity.platforms?.name ?? "Unknown"
  const pillarName = opportunity.service_pillars?.name ?? null
  const pillarColor = opportunity.service_pillars?.color ?? null

  const displayName =
    opportunity.client_company || opportunity.client_name || null

  const hasBudget =
    opportunity.budget_min !== null || opportunity.budget_max !== null

  const budgetDisplay = useMemo(() => {
    if (opportunity.contract_value !== null) {
      return formatCurrency(opportunity.contract_value)
    }
    if (
      opportunity.budget_min !== null &&
      opportunity.budget_max !== null &&
      opportunity.budget_min > 0 &&
      opportunity.budget_max > 0
    ) {
      if (opportunity.budget_min === opportunity.budget_max) {
        return formatCurrency(opportunity.budget_min)
      }
      return `${formatCurrency(opportunity.budget_min)} - ${formatCurrency(opportunity.budget_max)}`
    }
    if (opportunity.budget_min !== null && opportunity.budget_min > 0) {
      return `From ${formatCurrency(opportunity.budget_min)}`
    }
    if (opportunity.budget_max !== null && opportunity.budget_max > 0) {
      return `Up to ${formatCurrency(opportunity.budget_max)}`
    }
    return null
  }, [
    opportunity.budget_min,
    opportunity.budget_max,
    opportunity.contract_value,
  ])

  function handleCardClick(e: React.MouseEvent) {
    // Don't navigate if we're dragging or clicking the drag handle
    if (isDragging) return
    const target = e.target as HTMLElement
    if (target.closest("[data-drag-handle]")) return
    router.push(`/pipeline/${opportunity.id}`)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border border-border bg-card p-3 shadow-sm transition-all",
        "hover:border-border/80 hover:shadow-md",
        "cursor-pointer select-none",
        isDragging && "z-50 opacity-50",
        isOverlay && "rotate-2 shadow-xl border-primary/40"
      )}
      onClick={handleCardClick}
    >
      {/* Drag handle + title row */}
      <div className="flex items-start gap-2">
        <button
          data-drag-handle
          className={cn(
            "mt-0.5 flex-shrink-0 cursor-grab rounded p-0.5 text-muted-foreground/50",
            "opacity-0 transition-opacity group-hover:opacity-100",
            "hover:text-muted-foreground active:cursor-grabbing",
            isOverlay && "opacity-100"
          )}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium leading-snug text-foreground">
            {opportunity.job_title}
          </h4>

          {/* Client info */}
          {displayName && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {displayName}
            </p>
          )}
        </div>
      </div>

      {/* Badges row */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {/* Platform badge */}
        <PlatformChip name={platformName} />

        {/* Pillar badge */}
        {pillarName && pillarColor && (
          <PillarChip name={pillarName} color={pillarColor} />
        )}

        {/* Contract type */}
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
            opportunity.contract_type === "hourly"
              ? "bg-blue-500/10 text-blue-400"
              : "bg-emerald-500/10 text-emerald-400"
          )}
        >
          <Briefcase className="h-2.5 w-2.5" />
          {opportunity.contract_type}
        </span>
      </div>

      {/* Budget / value */}
      {(budgetDisplay || hasBudget) && budgetDisplay && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <DollarSign className="h-3 w-3 flex-shrink-0" />
          <span className="truncate font-medium text-foreground/90">
            {budgetDisplay}
          </span>
        </div>
      )}

      {/* Footer row: deadline + time since created */}
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        {/* Deadline indicator */}
        {deadlineUrgency !== "none" && opportunity.delivery_deadline && (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              URGENCY_STYLES[deadlineUrgency]
            )}
          >
            {deadlineUrgency === "overdue" ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <CalendarClock className="h-3 w-3" />
            )}
            {deadlineUrgency === "overdue"
              ? "Overdue"
              : `Due ${formatRelativeDate(opportunity.delivery_deadline)}`}
          </span>
        )}

        {/* Time since created */}
        <span className="ml-auto inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatRelativeDate(opportunity.created_at)}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components: lightweight badges optimized for the compact card layout
// ---------------------------------------------------------------------------

const CARD_PLATFORM_STYLES: Record<string, string> = {
  Upwork: "bg-green-500/10 text-green-400",
  Fiverr: "bg-emerald-500/10 text-emerald-400",
  Toptal: "bg-blue-500/10 text-blue-400",
  "Arc.dev": "bg-violet-500/10 text-violet-400",
  PeoplePerHour: "bg-orange-500/10 text-orange-400",
  Guru: "bg-sky-500/10 text-sky-400",
  "LinkedIn Services": "bg-blue-600/10 text-blue-300",
  "Direct/Referral": "bg-zinc-500/10 text-zinc-400",
}

function PlatformChip({ name }: { name: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        CARD_PLATFORM_STYLES[name] ?? "bg-muted text-muted-foreground"
      )}
    >
      {name}
    </span>
  )
}

function PillarChip({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{
        backgroundColor: `${color}18`,
        color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  )
}

"use client"

import { useState } from "react"
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Trophy,
  X,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecommendationType =
  | "opportunity"
  | "optimization"
  | "warning"
  | "milestone"

export type RecommendationPriority = "high" | "medium" | "low"

export interface Recommendation {
  id: string
  type: RecommendationType
  title: string
  description: string
  priority: RecommendationPriority
  actionLabel?: string
  actionUrl?: string
}

export interface RecommendationsPanelProps {
  recommendations: Recommendation[]
  className?: string
}

// ---------------------------------------------------------------------------
// Type-specific styles
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  RecommendationType,
  {
    icon: typeof Lightbulb
    bgClass: string
    iconClass: string
    borderClass: string
  }
> = {
  opportunity: {
    icon: TrendingUp,
    bgClass: "bg-blue-500/10",
    iconClass: "text-blue-400",
    borderClass: "border-blue-500/20",
  },
  optimization: {
    icon: Lightbulb,
    bgClass: "bg-amber-500/10",
    iconClass: "text-amber-400",
    borderClass: "border-amber-500/20",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-red-500/10",
    iconClass: "text-red-400",
    borderClass: "border-red-500/20",
  },
  milestone: {
    icon: Trophy,
    bgClass: "bg-emerald-500/10",
    iconClass: "text-emerald-400",
    borderClass: "border-emerald-500/20",
  },
}

const PRIORITY_STYLES: Record<
  RecommendationPriority,
  { dotClass: string; label: string }
> = {
  high: { dotClass: "bg-red-400", label: "High" },
  medium: { dotClass: "bg-amber-400", label: "Medium" },
  low: { dotClass: "bg-blue-400", label: "Low" },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecommendationsPanel({
  recommendations,
  className,
}: RecommendationsPanelProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = recommendations.filter((r) => !dismissed.has(r.id))

  function handleDismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  if (visible.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-6",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-400" />
          <h3 className="text-sm font-semibold">Recommendations</h3>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          No recommendations right now. Keep tracking metrics to unlock
          insights.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-400" />
          <h3 className="text-sm font-semibold">Recommendations</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {visible.length} active
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {visible.map((rec) => {
          const config = TYPE_CONFIG[rec.type]
          const priority = PRIORITY_STYLES[rec.priority]
          const Icon = config.icon

          return (
            <div
              key={rec.id}
              className={cn(
                "relative rounded-lg border p-4",
                config.bgClass,
                config.borderClass
              )}
            >
              {/* Dismiss button */}
              <button
                onClick={() => handleDismiss(rec.id)}
                className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-zinc-800 hover:text-foreground"
                aria-label="Dismiss recommendation"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="flex gap-3 pr-8">
                {/* Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  <Icon className={cn("h-5 w-5", config.iconClass)} />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-foreground">
                      {rec.title}
                    </h4>
                    {/* Priority dot */}
                    <span className="flex items-center gap-1">
                      <span
                        className={cn(
                          "inline-block h-1.5 w-1.5 rounded-full",
                          priority.dotClass
                        )}
                      />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {priority.label}
                      </span>
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {rec.description}
                  </p>

                  {/* Action button */}
                  {rec.actionLabel && rec.actionUrl && (
                    <div className="pt-1">
                      <Link href={rec.actionUrl}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs"
                        >
                          {rec.actionLabel}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import { useState, useCallback } from "react"
import {
  History,
  ChevronDown,
  ChevronRight,
  Plus,
  GitBranch,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatDate, formatCurrency, formatPercentage } from "@/lib/utils/formatters"
import type {
  GigVersion,
  GigPricing,
  PerformanceSnapshot,
} from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GigVersionHistoryProps {
  versions: GigVersion[]
  currentVersionNumber?: number
  onCreateSnapshot?: () => void
  loading?: boolean
}

// ---------------------------------------------------------------------------
// Type-safe JSON accessors
// ---------------------------------------------------------------------------

function parsePricing(json: Record<string, unknown>): GigPricing | null {
  if (!json || typeof json !== "object") return null
  const basic = json.basic as { price?: number; delivery_days?: number; description?: string } | undefined
  const standard = json.standard as { price?: number; delivery_days?: number; description?: string } | undefined
  const premium = json.premium as { price?: number; delivery_days?: number; description?: string } | undefined

  if (!basic && !standard && !premium) return null

  return {
    basic: {
      price: basic?.price ?? 0,
      delivery_days: basic?.delivery_days ?? 0,
      description: basic?.description,
    },
    standard: {
      price: standard?.price ?? 0,
      delivery_days: standard?.delivery_days ?? 0,
      description: standard?.description,
    },
    premium: {
      price: premium?.price ?? 0,
      delivery_days: premium?.delivery_days ?? 0,
      description: premium?.description,
    },
  }
}

function parsePerformance(
  json: Record<string, unknown>
): PerformanceSnapshot | null {
  if (!json || typeof json !== "object") return null
  const impressions = json.impressions as number | undefined
  if (typeof impressions !== "number") return null

  return {
    impressions: impressions ?? 0,
    clicks: (json.clicks as number) ?? 0,
    orders: (json.orders as number) ?? 0,
    conversion_rate: (json.conversion_rate as number) ?? 0,
    revenue_total: (json.revenue_total as number) ?? 0,
    captured_at: (json.captured_at as string) ?? "",
  }
}

// ---------------------------------------------------------------------------
// Performance delta helper
// ---------------------------------------------------------------------------

interface PerformanceDelta {
  metric: string
  previous: number
  current: number
  change: number
  changeType: "positive" | "negative" | "neutral"
  formatted: string
}

function computeDeltas(
  current: PerformanceSnapshot,
  previous: PerformanceSnapshot
): PerformanceDelta[] {
  const metrics: { key: keyof PerformanceSnapshot; label: string; isCurrency?: boolean; isPercent?: boolean }[] = [
    { key: "impressions", label: "Impressions" },
    { key: "clicks", label: "Clicks" },
    { key: "orders", label: "Orders" },
    { key: "conversion_rate", label: "Conv. Rate", isPercent: true },
    { key: "revenue_total", label: "Revenue", isCurrency: true },
  ]

  return metrics
    .filter((m) => m.key !== "captured_at")
    .map((m) => {
      const curr = current[m.key] as number
      const prev = previous[m.key] as number
      const change = curr - prev
      const changeType: PerformanceDelta["changeType"] =
        change > 0 ? "positive" : change < 0 ? "negative" : "neutral"

      let formatted: string
      if (m.isCurrency) {
        formatted = `${change >= 0 ? "+" : ""}${formatCurrency(change)}`
      } else if (m.isPercent) {
        formatted = `${change >= 0 ? "+" : ""}${formatPercentage(change)}`
      } else {
        formatted = `${change >= 0 ? "+" : ""}${change}`
      }

      return { metric: m.label, previous: prev, current: curr, change, changeType, formatted }
    })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GigVersionHistory({
  versions,
  currentVersionNumber,
  onCreateSnapshot,
  loading = false,
}: GigVersionHistoryProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set()
  )

  const toggleExpanded = useCallback((versionId: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev)
      if (next.has(versionId)) {
        next.delete(versionId)
      } else {
        next.add(versionId)
      }
      return next
    })
  }, [])

  // Sort versions by version_number descending (most recent first)
  const sortedVersions = [...versions].sort(
    (a, b) => b.version_number - a.version_number
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Version History</h3>
          <Badge variant="secondary" className="text-[10px]">
            {versions.length} version{versions.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        {onCreateSnapshot && (
          <Button
            size="sm"
            variant="outline"
            onClick={onCreateSnapshot}
            disabled={loading}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create Snapshot
          </Button>
        )}
      </div>

      {/* Empty state */}
      {versions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8">
          <GitBranch className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No version history yet
          </p>
          <p className="text-xs text-muted-foreground/60">
            Create a snapshot to start tracking changes
          </p>
        </div>
      )}

      {/* Timeline */}
      {sortedVersions.length > 0 && (
        <div className="relative ml-3 border-l border-border pl-6">
          {sortedVersions.map((version, idx) => {
            const isExpanded = expandedVersions.has(version.id)
            const isCurrent =
              currentVersionNumber !== undefined &&
              version.version_number === currentVersionNumber
            const pricing = parsePricing(version.pricing_json)
            const performance = parsePerformance(
              version.performance_snapshot_json
            )

            // Find the next older version for performance comparison
            const olderVersion = sortedVersions[idx + 1]
            const olderPerformance = olderVersion
              ? parsePerformance(olderVersion.performance_snapshot_json)
              : null
            const deltas =
              performance && olderPerformance
                ? computeDeltas(performance, olderPerformance)
                : null

            return (
              <div key={version.id} className="relative mb-6 last:mb-0">
                {/* Timeline dot */}
                <div
                  className={cn(
                    "absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2",
                    isCurrent
                      ? "border-primary bg-primary"
                      : "border-border bg-background"
                  )}
                />

                {/* Version card */}
                <div
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    isCurrent
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card"
                  )}
                >
                  {/* Version header */}
                  <button
                    type="button"
                    onClick={() => toggleExpanded(version.id)}
                    className="flex w-full items-start justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            v{version.version_number}
                          </span>
                          {isCurrent && (
                            <Badge className="h-5 border-0 bg-primary/20 px-1.5 text-[10px] text-primary">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(version.created_at)}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Change notes */}
                  {version.change_notes && (
                    <p className="ml-6 mt-2 text-sm text-muted-foreground">
                      {version.change_notes}
                    </p>
                  )}

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="ml-6 mt-4 space-y-4">
                      <Separator />

                      {/* Title */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Title
                        </p>
                        <p className="mt-0.5 text-sm">{version.title}</p>
                      </div>

                      {/* Description */}
                      {version.description && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Description
                          </p>
                          <p className="mt-0.5 line-clamp-4 text-sm text-muted-foreground">
                            {version.description}
                          </p>
                        </div>
                      )}

                      {/* Tags */}
                      {version.tags.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Tags
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {version.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pricing snapshot */}
                      {pricing && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Pricing Snapshot
                          </p>
                          <div className="mt-1 grid grid-cols-3 gap-2">
                            <PricingSnapshotCell
                              label="Basic"
                              price={pricing.basic.price}
                              days={pricing.basic.delivery_days}
                            />
                            <PricingSnapshotCell
                              label="Standard"
                              price={pricing.standard.price}
                              days={pricing.standard.delivery_days}
                            />
                            <PricingSnapshotCell
                              label="Premium"
                              price={pricing.premium.price}
                              days={pricing.premium.delivery_days}
                            />
                          </div>
                        </div>
                      )}

                      {/* Performance comparison */}
                      {deltas && (
                        <div>
                          <p className="mb-1 text-xs font-medium text-muted-foreground">
                            Performance vs. Previous Version
                          </p>
                          <div className="grid gap-1.5 sm:grid-cols-2">
                            {deltas.map((d) => (
                              <div
                                key={d.metric}
                                className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5"
                              >
                                <span className="text-xs text-muted-foreground">
                                  {d.metric}
                                </span>
                                <span
                                  className={cn(
                                    "flex items-center gap-1 text-xs font-medium",
                                    d.changeType === "positive" &&
                                      "text-green-400",
                                    d.changeType === "negative" &&
                                      "text-red-400",
                                    d.changeType === "neutral" &&
                                      "text-muted-foreground"
                                  )}
                                >
                                  {d.changeType === "positive" && (
                                    <TrendingUp className="h-3 w-3" />
                                  )}
                                  {d.changeType === "negative" && (
                                    <TrendingDown className="h-3 w-3" />
                                  )}
                                  {d.changeType === "neutral" && (
                                    <Minus className="h-3 w-3" />
                                  )}
                                  {d.formatted}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Performance snapshot (if no comparison available) */}
                      {performance && !deltas && (
                        <div>
                          <p className="mb-1 text-xs font-medium text-muted-foreground">
                            Performance at Snapshot
                          </p>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                            <PerformanceCell
                              label="Impressions"
                              value={performance.impressions.toString()}
                            />
                            <PerformanceCell
                              label="Clicks"
                              value={performance.clicks.toString()}
                            />
                            <PerformanceCell
                              label="Orders"
                              value={performance.orders.toString()}
                            />
                            <PerformanceCell
                              label="Conv."
                              value={formatPercentage(
                                performance.conversion_rate
                              )}
                            />
                            <PerformanceCell
                              label="Revenue"
                              value={formatCurrency(performance.revenue_total)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PricingSnapshotCell({
  label,
  price,
  days,
}: {
  label: string
  price: number
  days: number
}) {
  return (
    <div className="rounded-md bg-muted/40 px-2 py-1.5 text-center">
      <p className="text-[10px] font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold">{formatCurrency(price)}</p>
      {days > 0 && (
        <p className="text-[10px] text-muted-foreground">
          {days} day{days !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}

function PerformanceCell({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-md bg-muted/40 px-2 py-1.5 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold">{value}</p>
    </div>
  )
}

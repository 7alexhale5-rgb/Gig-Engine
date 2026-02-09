"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts"
import { cn } from "@/lib/utils"
import {
  formatCurrency,
  formatPercentage,
  formatHours,
} from "@/lib/utils/formatters"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SparklinePoint {
  value: number
}

export interface MetricSummary {
  label: string
  value: number
  previousValue: number
  format: "currency" | "percentage" | "number" | "hours" | "rate"
  sparkline?: SparklinePoint[]
}

export interface MetricsSummaryGridProps {
  metrics: {
    totalRevenue: MetricSummary
    winRate: MetricSummary
    effectiveHourlyRate: MetricSummary
    activePipelineValue: MetricSummary
    proposalsThisWeek: MetricSummary
    averageContractValue: MetricSummary
  }
  className?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMetricValue(value: number, format: MetricSummary["format"]): string {
  switch (format) {
    case "currency":
      return formatCurrency(value)
    case "percentage":
      return formatPercentage(value)
    case "hours":
      return formatHours(value)
    case "rate":
      return `${formatCurrency(value)}/hr`
    case "number":
    default:
      return value.toLocaleString("en-US")
  }
}

function calculateChange(current: number, previous: number): {
  percent: string
  type: "positive" | "negative" | "neutral"
} {
  if (previous === 0) {
    if (current === 0) return { percent: "0%", type: "neutral" }
    return { percent: "+100%", type: "positive" }
  }

  const change = ((current - previous) / previous) * 100
  const absChange = Math.abs(change)
  const formatted = absChange >= 100 ? absChange.toFixed(0) : absChange.toFixed(1)

  if (change > 0.5) return { percent: `+${formatted}%`, type: "positive" }
  if (change < -0.5) return { percent: `-${formatted}%`, type: "negative" }
  return { percent: "0%", type: "neutral" }
}

// ---------------------------------------------------------------------------
// Sparkline
// ---------------------------------------------------------------------------

function Sparkline({
  data,
  changeType,
}: {
  data: SparklinePoint[]
  changeType: "positive" | "negative" | "neutral"
}) {
  const color =
    changeType === "positive"
      ? "#10B981"
      : changeType === "negative"
        ? "#EF4444"
        : "#a1a1aa"

  return (
    <div className="h-8 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Single Metric Cell
// ---------------------------------------------------------------------------

function MetricCell({ metric }: { metric: MetricSummary }) {
  const { percent, type } = calculateChange(metric.value, metric.previousValue)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">
        {metric.label}
      </p>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold tracking-tight">
            {formatMetricValue(metric.value, metric.format)}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                type === "positive" && "text-emerald-400",
                type === "negative" && "text-red-400",
                type === "neutral" && "text-muted-foreground"
              )}
            >
              {type === "positive" && <TrendingUp className="h-3 w-3" />}
              {type === "negative" && <TrendingDown className="h-3 w-3" />}
              {type === "neutral" && <Minus className="h-3 w-3" />}
              {percent}
            </span>
            <span className="text-[10px] text-muted-foreground">
              vs prev. period
            </span>
          </div>
        </div>

        {metric.sparkline && metric.sparkline.length > 1 && (
          <Sparkline data={metric.sparkline} changeType={type} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MetricsSummaryGrid({
  metrics,
  className,
}: MetricsSummaryGridProps) {
  const orderedMetrics: MetricSummary[] = [
    metrics.totalRevenue,
    metrics.winRate,
    metrics.effectiveHourlyRate,
    metrics.activePipelineValue,
    metrics.proposalsThisWeek,
    metrics.averageContractValue,
  ]

  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
        className
      )}
    >
      {orderedMetrics.map((metric) => (
        <MetricCell key={metric.label} metric={metric} />
      ))}
    </div>
  )
}
